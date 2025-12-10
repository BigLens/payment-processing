import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WalletsService } from './wallets.service';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatus, TransactionType } from '../transactions/enums/transaction.enum';
import { PaystackService } from '../paystack/paystack.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaystackWebhookPayload } from './interfaces/paystack-webhook.interface';

describe('WalletsService', () => {
    let service: WalletsService;
    let walletsRepository: Repository<Wallet>;
    let transactionsRepository: Repository<Transaction>;
    let paystackService: PaystackService;
    let configService: ConfigService;
    let dataSource: DataSource;

    const SECRET_KEY = 'test-secret-key';

    const mockWallet = {
        id: 'wallet-123',
        user_id: 'user-123',
        wallet_number: '1234567890123',
        balance: 10000,
        created_at: new Date(),
        updated_at: new Date(),
    };

    const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
            save: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WalletsService,
                {
                    provide: getRepositoryToken(Wallet),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Transaction),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: PaystackService,
                    useValue: {
                        initializeTransaction: jest.fn(),
                        verifyTransaction: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(SECRET_KEY),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
                    },
                },
            ],
        }).compile();

        service = module.get<WalletsService>(WalletsService);
        walletsRepository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
        transactionsRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
        paystackService = module.get<PaystackService>(PaystackService);
        configService = module.get<ConfigService>(ConfigService);
        dataSource = module.get<DataSource>(DataSource);
    });

    // Helper function to generate valid signature
    const generateSignature = (payload: PaystackWebhookPayload): string => {
        return crypto
            .createHmac('sha512', SECRET_KEY)
            .update(JSON.stringify(payload))
            .digest('hex');
    };

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createForUser', () => {
        it('should create a wallet for user', async () => {
            jest.spyOn(walletsRepository, 'create').mockReturnValue(mockWallet as never);
            jest.spyOn(walletsRepository, 'save').mockResolvedValue(mockWallet as never);

            const result = await service.createForUser('user-123');

            expect(result).toEqual(mockWallet);
            expect(walletsRepository.create).toHaveBeenCalled();
            expect(walletsRepository.save).toHaveBeenCalled();
        });
    });

    describe('findByUserId', () => {
        it('should return wallet if found', async () => {
            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(mockWallet as never);

            const result = await service.findByUserId('user-123');

            expect(result).toEqual(mockWallet);
        });

        it('should return null if not found', async () => {
            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(null);

            const result = await service.findByUserId('user-123');

            expect(result).toBeNull();
        });
    });

    describe('initializeDeposit', () => {
        it('should initialize deposit successfully', async () => {
            const mockTransaction = {
                id: 'txn-123',
                wallet_id: 'wallet-123',
                type: TransactionType.DEPOSIT,
                amount: 5000,
                status: TransactionStatus.PENDING,
                reference: 'TXN_123',
            };

            const mockPaystackResponse = {
                reference: 'TXN_123',
                authorization_url: 'https://checkout.paystack.com/abc123',
                access_code: 'abc123',
            };

            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(mockWallet as never);
            jest.spyOn(transactionsRepository, 'create').mockReturnValue(mockTransaction as never);
            jest.spyOn(transactionsRepository, 'save').mockResolvedValue(mockTransaction as never);
            jest.spyOn(paystackService, 'initializeTransaction').mockResolvedValue(mockPaystackResponse);

            const result = await service.initializeDeposit('user-123', 5000, 'test@example.com');

            expect(result.reference).toBe('TXN_123');
            expect(result.authorization_url).toBe('https://checkout.paystack.com/abc123');
        });

        it('should throw NotFoundException if wallet not found', async () => {
            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(null);

            await expect(service.initializeDeposit('user-123', 5000, 'test@example.com'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('handleWebhook', () => {
        const mockPayload: PaystackWebhookPayload = {
            event: 'charge.success',
            data: {
                id: 123,
                domain: 'test',
                status: 'success',
                reference: 'TXN_123',
                amount: 500000, // 5000 naira in kobo
                message: null,
                gateway_response: 'Successful',
                paid_at: '2024-12-10T00:00:00.000Z',
                created_at: '2024-12-10T00:00:00.000Z',
                channel: 'card',
                currency: 'NGN',
                ip_address: '127.0.0.1',
                metadata: {},
                fees: 7500,
                customer: {
                    id: 1,
                    first_name: 'Test',
                    last_name: 'User',
                    email: 'test@example.com',
                    customer_code: 'CUS_123',
                    phone: null,
                    metadata: {},
                    risk_action: 'default',
                },
                authorization: {
                    authorization_code: 'AUTH_123',
                    bin: '408408',
                    last4: '4081',
                    exp_month: '12',
                    exp_year: '2025',
                    channel: 'card',
                    card_type: 'visa',
                    bank: 'Test Bank',
                    country_code: 'NG',
                    brand: 'visa',
                    reusable: true,
                    signature: 'SIG_123',
                },
            },
        };

        it('should process webhook and credit wallet', async () => {
            const mockTransaction = {
                id: 'txn-123',
                reference: 'TXN_123',
                status: TransactionStatus.PENDING,
                wallet: mockWallet,
            };

            jest.spyOn(transactionsRepository, 'findOne').mockResolvedValue(mockTransaction as never);
            mockQueryRunner.manager.save.mockResolvedValue(mockWallet);

            const validSignature = generateSignature(mockPayload);
            const result = await service.handleWebhook(mockPayload, validSignature);

            expect(result.status).toBe(true);
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid signature', async () => {
            await expect(service.handleWebhook(mockPayload, 'invalid-signature'))
                .rejects.toThrow(BadRequestException);
        });

        it('should handle idempotency - skip already processed transaction', async () => {
            // Reset mocks
            mockQueryRunner.startTransaction.mockClear();
            mockQueryRunner.commitTransaction.mockClear();

            const mockTransaction = {
                id: 'txn-123',
                reference: 'TXN_123',
                status: TransactionStatus.SUCCESS,
                wallet: mockWallet,
            };

            jest.spyOn(transactionsRepository, 'findOne').mockResolvedValue(mockTransaction as never);

            const validSignature = generateSignature(mockPayload);
            const result = await service.handleWebhook(mockPayload, validSignature);

            expect(result.status).toBe(true);
            expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
        });
    });

    describe('getBalance', () => {
        it('should return wallet balance', async () => {
            // Use fresh mock wallet
            const freshWallet = { ...mockWallet, balance: 10000 };
            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(freshWallet as never);

            const result = await service.getBalance('user-123');

            expect(result).toBe(10000);
        });

        it('should throw NotFoundException if wallet not found', async () => {
            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(null);

            await expect(service.getBalance('user-123')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getDepositStatus', () => {
        it('should return transaction status', async () => {
            const mockTransaction = {
                reference: 'TXN_123',
                status: TransactionStatus.SUCCESS,
                amount: 5000,
            };

            jest.spyOn(transactionsRepository, 'findOne').mockResolvedValue(mockTransaction as never);

            const result = await service.getDepositStatus('TXN_123');

            expect(result.reference).toBe('TXN_123');
            expect(result.status).toBe(TransactionStatus.SUCCESS);
            expect(result.amount).toBe(5000);
        });

        it('should throw NotFoundException if transaction not found', async () => {
            jest.spyOn(transactionsRepository, 'findOne').mockResolvedValue(null);

            await expect(service.getDepositStatus('TXN_123')).rejects.toThrow(NotFoundException);
        });
    });


    describe('transfer', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should transfer funds successfully', async () => {
            const senderWallet = { ...mockWallet, id: 'sender-id', balance: 50000, wallet_number: '1111111111111' };
            const recipientWallet = { ...mockWallet, id: 'recipient-id', balance: 1000, wallet_number: '2222222222222' };
            const transferAmount = 5000;

            jest.spyOn(service, 'findByUserId').mockResolvedValue(senderWallet as never);
            jest.spyOn(service, 'findByWalletNumber').mockResolvedValue(recipientWallet as never);

            // Mock transaction creation
            jest.spyOn(transactionsRepository, 'create').mockReturnValue({ id: 'txn-1' } as never);

            // Mocks for queryRunner manager save are already set up in beforeEach via mockQueryRunner
            mockQueryRunner.manager.save.mockResolvedValue({} as never);

            const result = await service.transfer('user-sender', '2222222222222', transferAmount);

            expect(result.status).toBe('success');
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();

            // Verify balances
            expect(senderWallet.balance).toBe(45000);
            expect(recipientWallet.balance).toBe(6000);

            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should throw BadRequestException if insufficient balance', async () => {
            const senderWallet = { ...mockWallet, balance: 100 }; // Low balance
            jest.spyOn(service, 'findByUserId').mockResolvedValue(senderWallet as never);

            await expect(service.transfer('user-sender', '2222222222222', 5000))
                .rejects.toThrow(BadRequestException);

            expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException if recipient wallet not found', async () => {
            const senderWallet = { ...mockWallet, balance: 50000 };
            jest.spyOn(service, 'findByUserId').mockResolvedValue(senderWallet as never);
            jest.spyOn(service, 'findByWalletNumber').mockResolvedValue(null);

            await expect(service.transfer('user-sender', '9999999999999', 5000))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if self-transfer', async () => {
            const senderWallet = { ...mockWallet, id: 'same-id', balance: 50000, wallet_number: '1111111111111' };
            const recipientWallet = { ...mockWallet, id: 'same-id', balance: 50000, wallet_number: '1111111111111' };

            jest.spyOn(service, 'findByUserId').mockResolvedValue(senderWallet as never);
            jest.spyOn(service, 'findByWalletNumber').mockResolvedValue(recipientWallet as never);

            await expect(service.transfer('user-sender', '1111111111111', 5000))
                .rejects.toThrow(BadRequestException);
        });
    });
});
