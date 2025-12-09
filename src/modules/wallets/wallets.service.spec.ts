import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletsService } from './wallets.service';
import { Wallet } from './entities/wallet.entity';

describe('WalletsService', () => {
    let service: WalletsService;
    let repository: Repository<Wallet>;

    const mockWallet: Wallet = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        wallet_number: '1234567890123',
        balance: 0,
        created_at: new Date(),
        updated_at: new Date(),
        user: {} as any,
        transactions: [],
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
            ],
        }).compile();

        service = module.get<WalletsService>(WalletsService);
        repository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createForUser', () => {
        it('should create wallet with unique wallet number', async () => {
            jest.spyOn(repository, 'create').mockReturnValue(mockWallet);
            jest.spyOn(repository, 'save').mockResolvedValue(mockWallet);

            const result = await service.createForUser('user-123');

            expect(result).toEqual(mockWallet);
            expect(repository.create).toHaveBeenCalled();
            expect(repository.save).toHaveBeenCalledWith(mockWallet);

            const createCall = (repository.create as jest.Mock).mock.calls[0][0];
            expect(createCall.user_id).toBe('user-123');
            expect(createCall.balance).toBe(0);
            expect(createCall.wallet_number).toHaveLength(13);
        });
    });

    describe('findByUserId', () => {
        it('should return wallet if found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockWallet);

            const result = await service.findByUserId('user-123');

            expect(result).toEqual(mockWallet);
            expect(repository.findOne).toHaveBeenCalledWith({ where: { user_id: 'user-123' } });
        });

        it('should return null if not found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            const result = await service.findByUserId('invalid-id');

            expect(result).toBeNull();
        });
    });
});
