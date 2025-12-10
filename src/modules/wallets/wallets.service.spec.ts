import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletsService } from './wallets.service';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { PaystackService } from '../paystack/paystack.service';
import { NotFoundException } from '@nestjs/common';

describe('WalletsService', () => {
    let service: WalletsService;
    let walletsRepository: Repository<Wallet>;
    let transactionsRepository: Repository<Transaction>;
    let paystackService: PaystackService;

    const mockWallet = {
        id: 'wallet-123',
        user_id: 'user-123',
        wallet_number: '1234567890123',
        balance: 10000,
        created_at: new Date(),
        updated_at: new Date(),
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
                    },
                },
                {
                    provide: PaystackService,
                    useValue: {
                        initializeTransaction: jest.fn(),
                        verifyTransaction: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<WalletsService>(WalletsService);
        walletsRepository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
        transactionsRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
        paystackService = module.get<PaystackService>(PaystackService);
    });

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
                type: 'deposit',
                amount: 5000,
                status: 'pending',
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

    describe('getBalance', () => {
        it('should return wallet balance', async () => {
            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(mockWallet as never);

            const result = await service.getBalance('user-123');

            expect(result).toBe(10000);
        });

        it('should throw NotFoundException if wallet not found', async () => {
            jest.spyOn(walletsRepository, 'findOne').mockResolvedValue(null);

            await expect(service.getBalance('user-123')).rejects.toThrow(NotFoundException);
        });
    });
});
