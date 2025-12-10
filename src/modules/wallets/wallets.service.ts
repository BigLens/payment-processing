import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionType, TransactionStatus } from '../transactions/enums/transaction.enum';
import { generateWalletNumber } from './utils/wallet-number.util';
import { PaystackService } from '../paystack/paystack.service';
import { PaystackWebhookPayload } from './interfaces/paystack-webhook.interface';

@Injectable()
export class WalletsService {
    private readonly logger = new Logger(WalletsService.name);

    constructor(
        @InjectRepository(Wallet)
        private readonly walletsRepository: Repository<Wallet>,
        @InjectRepository(Transaction)
        private readonly transactionsRepository: Repository<Transaction>,
        private readonly paystackService: PaystackService,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
    ) { }

    async createForUser(user_id: string): Promise<Wallet> {
        const wallet = this.walletsRepository.create({
            user_id,
            wallet_number: generateWalletNumber(),
            balance: 0,
        });
        return this.walletsRepository.save(wallet);
    }

    async findByUserId(user_id: string): Promise<Wallet | null> {
        return this.walletsRepository.findOne({ where: { user_id } });
    }

    async findByWalletNumber(wallet_number: string): Promise<Wallet | null> {
        return this.walletsRepository.findOne({ where: { wallet_number } });
    }

    async initializeDeposit(user_id: string, amount: number, email: string) {
        // Find user's wallet
        const wallet = await this.findByUserId(user_id);
        if (!wallet) {
            throw new NotFoundException('Wallet not found');
        }

        // Generate unique reference
        const reference = `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

        // Create pending transaction
        const transaction = this.transactionsRepository.create({
            wallet_id: wallet.id,
            type: TransactionType.DEPOSIT,
            amount,
            status: TransactionStatus.PENDING,
            reference,
            recipient_wallet_id: null,
            metadata: null,
        });
        await this.transactionsRepository.save(transaction);

        // Initialize Paystack transaction
        const paystackResponse = await this.paystackService.initializeTransaction(
            email,
            amount,
            reference,
        );

        return {
            reference: paystackResponse.reference,
            authorization_url: paystackResponse.authorization_url,
        };
    }

    async handleWebhook(payload: PaystackWebhookPayload, signature: string): Promise<{ status: boolean }> {
        // Validate signature
        const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
        const hash = crypto
            .createHmac('sha512', secretKey!)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (hash !== signature) {
            this.logger.error('Invalid webhook signature');
            throw new BadRequestException('Invalid signature');
        }

        // Only process successful charge events
        if (payload.event !== 'charge.success') {
            this.logger.log(`Ignoring event: ${payload.event}`);
            return { status: true };
        }

        const { reference, amount, status } = payload.data;

        // Find transaction
        const transaction = await this.transactionsRepository.findOne({
            where: { reference },
            relations: ['wallet'],
        });

        if (!transaction) {
            this.logger.error(`Transaction not found: ${reference}`);
            throw new NotFoundException('Transaction not found');
        }

        // Idempotency check
        if (transaction.status === TransactionStatus.SUCCESS) {
            this.logger.log(`Transaction already processed: ${reference}`);
            return { status: true };
        }

        // Verify status
        if (status !== 'success') {
            this.logger.log(`Transaction not successful: ${reference}, status: ${status}`);
            transaction.status = TransactionStatus.FAILED;
            await this.transactionsRepository.save(transaction);
            return { status: true };
        }

        // Atomic wallet credit
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update transaction status
            transaction.status = TransactionStatus.SUCCESS;
            await queryRunner.manager.save(transaction);

            // Credit wallet (amount from Paystack is in kobo, convert to naira)
            const wallet = transaction.wallet;
            wallet.balance += amount / 100;
            await queryRunner.manager.save(wallet);

            await queryRunner.commitTransaction();

            this.logger.log(`Wallet credited successfully: ${reference}, amount: ${amount / 100}`);

            return { status: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to credit wallet: ${error}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async transfer(user_id: string, wallet_number: string, amount: number) {
        // Find sender's wallet
        const senderWallet = await this.findByUserId(user_id);
        if (!senderWallet) {
            throw new NotFoundException('Sender wallet not found');
        }

        // Validate balance
        if (senderWallet.balance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        // Find recipient's wallet
        const recipientWallet = await this.findByWalletNumber(wallet_number);
        if (!recipientWallet) {
            throw new NotFoundException('Recipient wallet not found');
        }

        // Prevent self-transfer
        if (senderWallet.id === recipientWallet.id) {
            throw new BadRequestException('Cannot transfer to your own wallet');
        }

        // Generate unique reference
        const reference = `TXF_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

        // Atomic transfer
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Debit sender
            senderWallet.balance -= amount;
            await queryRunner.manager.save(senderWallet);

            // Credit recipient
            recipientWallet.balance += amount;
            await queryRunner.manager.save(recipientWallet);

            // Create transaction record for sender (debit)
            const senderTransaction = this.transactionsRepository.create({
                wallet_id: senderWallet.id,
                type: TransactionType.TRANSFER_OUT,
                amount: -amount, // Negative for debit
                status: TransactionStatus.SUCCESS,
                reference,
                recipient_wallet_id: recipientWallet.id,
                metadata: null,
            });
            await queryRunner.manager.save(senderTransaction);

            // Create transaction record for recipient (credit)
            const recipientTransaction = this.transactionsRepository.create({
                wallet_id: recipientWallet.id,
                type: TransactionType.TRANSFER_IN,
                amount: amount, // Positive for credit
                status: TransactionStatus.SUCCESS,
                reference,
                recipient_wallet_id: senderWallet.id,
                metadata: null,
            });
            await queryRunner.manager.save(recipientTransaction);

            await queryRunner.commitTransaction();

            this.logger.log(`Transfer successful: ${reference}, from: ${senderWallet.wallet_number}, to: ${recipientWallet.wallet_number}, amount: ${amount}`);

            return {
                status: 'success',
                message: 'Transfer completed',
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Transfer failed: ${error}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getBalance(user_id: string): Promise<number> {
        const wallet = await this.findByUserId(user_id);
        if (!wallet) {
            throw new NotFoundException('Wallet not found');
        }
        return wallet.balance;
    }

    async getDepositStatus(reference: string) {
        const transaction = await this.transactionsRepository.findOne({
            where: { reference },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        return {
            reference: transaction.reference,
            status: transaction.status,
            amount: transaction.amount,
        };
    }
}
