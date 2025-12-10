import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionType, TransactionStatus } from '../transactions/enums/transaction.enum';
import { generateWalletNumber } from './utils/wallet-number.util';
import { PaystackService } from '../paystack/paystack.service';

@Injectable()
export class WalletsService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletsRepository: Repository<Wallet>,
        @InjectRepository(Transaction)
        private readonly transactionsRepository: Repository<Transaction>,
        private readonly paystackService: PaystackService,
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

    async getBalance(user_id: string): Promise<number> {
        const wallet = await this.findByUserId(user_id);
        if (!wallet) {
            throw new NotFoundException('Wallet not found');
        }
        return wallet.balance;
    }
}
