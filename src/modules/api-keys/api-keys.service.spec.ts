import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiKeysService } from './api-keys.service';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeyPermission } from './enums/api-key.enum';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ApiKeysService', () => {
    let service: ApiKeysService;
    let repository: Repository<ApiKey>;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
    };

    const mockApiKey: ApiKey = {
        id: 'key-123',
        user_id: 'user-123',
        key_hash: 'hashed-key',
        name: 'Test API Key',
        permissions: [ApiKeyPermission.READ],
        expires_at: new Date('2025-12-31'),
        is_revoked: false,
        last_used_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        user: mockUser as never,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiKeysService,
                {
                    provide: getRepositoryToken(ApiKey),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                        findOne: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue(10),
                    },
                },
            ],
        }).compile();

        service = module.get<ApiKeysService>(ApiKeysService);
        repository = module.get<Repository<ApiKey>>(getRepositoryToken(ApiKey));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create and return new API key with plain key', async () => {
            const createDto = {
                name: 'Test API Key',
                permissions: [ApiKeyPermission.READ],
                expiry: '1D' as const,
            };

            jest.spyOn(repository, 'count').mockResolvedValue(0);
            jest.spyOn(repository, 'create').mockReturnValue(mockApiKey);
            jest.spyOn(repository, 'save').mockResolvedValue(mockApiKey);

            const result = await service.create('user-123', createDto);

            expect(result).toHaveProperty('api_key');
            expect(result.api_key).toHaveLength(35);
            expect(result).toHaveProperty('expires_at');
        });

        it('should throw BadRequestException if 5 active keys limit reached', async () => {
            const createDto = {
                name: 'Test API Key',
                permissions: [ApiKeyPermission.READ],
                expiry: '1D' as const,
            };

            jest.spyOn(repository, 'count').mockResolvedValue(5);

            await expect(service.create('user-123', createDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('findByUserId', () => {
        it('should return all API keys for user', async () => {
            jest.spyOn(repository, 'find').mockResolvedValue([mockApiKey]);

            const result = await service.findByUserId('user-123');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(mockApiKey.id);
            expect(repository.find).toHaveBeenCalledWith({
                where: { user_id: 'user-123' },
                order: { created_at: 'DESC' },
            });
        });
    });

    describe('findById', () => {
        it('should return API key if found and user owns it', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockApiKey);

            const result = await service.findById('key-123', 'user-123');

            expect(result.id).toBe(mockApiKey.id);
        });

        it('should throw NotFoundException if not found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            await expect(service.findById('invalid-id', 'user-123')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user does not own key', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockApiKey);

            await expect(service.findById('key-123', 'other-user')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('revoke', () => {
        it('should revoke API key', async () => {
            const revokedKey = { ...mockApiKey, is_revoked: true };
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockApiKey);
            jest.spyOn(repository, 'save').mockResolvedValue(revokedKey);

            const result = await service.revoke('key-123', 'user-123');

            expect(result.is_revoked).toBe(true);
        });

        it('should throw ForbiddenException if user does not own key', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockApiKey);

            await expect(service.revoke('key-123', 'other-user')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('rollover', () => {
        it('should revoke old key and create new one for expired key', async () => {
            const expiredKey = { ...mockApiKey, expires_at: new Date('2020-01-01') };
            const newKey = { ...mockApiKey, id: 'key-456' };
            const rolloverDto = {
                expired_key_id: 'key-123',
                expiry: '1M' as const,
            };

            jest.spyOn(repository, 'findOne').mockResolvedValue(expiredKey);
            jest.spyOn(repository, 'save').mockResolvedValue(expiredKey);
            jest.spyOn(repository, 'count').mockResolvedValue(0);
            jest.spyOn(repository, 'create').mockReturnValue(newKey);
            jest.spyOn(repository, 'save').mockResolvedValue(newKey);

            const result = await service.rollover('user-123', rolloverDto);

            expect(result).toHaveProperty('api_key');
            expect(result).toHaveProperty('expires_at');
        });

        it('should throw BadRequestException if key is not expired', async () => {
            const rolloverDto = {
                expired_key_id: 'key-123',
                expiry: '1M' as const,
            };

            jest.spyOn(repository, 'findOne').mockResolvedValue(mockApiKey);

            await expect(service.rollover('user-123', rolloverDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('validateApiKey', () => {
        it('should return API key for valid plain key', async () => {
            const plainKey = 'pk_test-plain-key';
            const hashedKey = crypto.createHash('sha256').update(plainKey).digest('hex');
            const validKey = { ...mockApiKey, key_hash: hashedKey };

            jest.spyOn(repository, 'findOne').mockResolvedValue(validKey);
            jest.spyOn(repository, 'save').mockResolvedValue(validKey);

            const result = await service.validateApiKey(plainKey);

            expect(result).toBeDefined();
            expect(result?.id).toBe(mockApiKey.id);
            expect(repository.findOne).toHaveBeenCalledWith({
                where: {
                    key_hash: hashedKey,
                    is_revoked: false,
                    expires_at: expect.anything(), // MoreThan(new Date()) is hard to match exactly
                },
                relations: ['user'],
            });
        });

        it('should return null for invalid key', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            const result = await service.validateApiKey('invalid-key');

            expect(result).toBeNull();
        });
    });
});
