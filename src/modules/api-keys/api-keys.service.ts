import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { CreateApiKeyResponseDto } from './dto/create-api-key-response.dto';
import { parseExpiry } from './utils/expiry.util';

@Injectable()
export class ApiKeysService {
    private readonly MAX_ACTIVE_KEYS = 5;

    constructor(
        @InjectRepository(ApiKey)
        private readonly apiKeysRepository: Repository<ApiKey>,
        private readonly configService: ConfigService,
    ) {
    }

    private hashKey(plainKey: string): string {
        return crypto.createHash('sha256').update(plainKey).digest('hex');
    }

    async create(user_id: string, createApiKeyDto: CreateApiKeyDto): Promise<CreateApiKeyResponseDto> {
        try {
            // Check 5 active keys limit
            const activeCount = await this.countActiveKeys(user_id);
            if (activeCount >= this.MAX_ACTIVE_KEYS) {
                throw new BadRequestException('Maximum 5 active API keys allowed per user');
            }

            // Generate random 32-character API key with prefix
            const plainKey = `pk_${crypto.randomBytes(16).toString('hex')}`;

            // Hash the key using SHA256
            const key_hash = this.hashKey(plainKey);

            // Parse expiry format to datetime
            const expires_at = parseExpiry(createApiKeyDto.expiry);

            // Create and save API key
            const apiKey = this.apiKeysRepository.create({
                user_id,
                key_hash,
                name: createApiKeyDto.name,
                permissions: createApiKeyDto.permissions,
                expires_at,
                is_revoked: false,
                last_used_at: null,
            });

            const savedKey = await this.apiKeysRepository.save(apiKey);

            // Return plain key (only time it's visible) + metadata
            return {
                api_key: plainKey,
                expires_at: savedKey.expires_at,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            const logger = new Logger(ApiKeysService.name);
            logger.error(`Failed to create API key: ${error instanceof Error ? error.message : error}`);

            throw new InternalServerErrorException('Failed to create API key. Please check parameters and try again.');
        }
    }

    async findByUserId(user_id: string): Promise<ApiKeyResponseDto[]> {
        const keys = await this.apiKeysRepository.find({
            where: { user_id },
            order: { created_at: 'DESC' },
        });

        return keys.map((key) => this.toResponseDto(key));
    }

    async findById(id: string, user_id: string): Promise<ApiKeyResponseDto> {
        const key = await this.apiKeysRepository.findOne({ where: { id } });

        if (!key) {
            throw new NotFoundException(`API key with ID ${id} not found`);
        }

        if (key.user_id !== user_id) {
            throw new ForbiddenException('You do not have access to this API key');
        }

        return this.toResponseDto(key);
    }

    async revoke(id: string, user_id: string): Promise<ApiKeyResponseDto> {
        const key = await this.apiKeysRepository.findOne({ where: { id } });

        if (!key) {
            throw new NotFoundException(`API key with ID ${id} not found`);
        }

        if (key.user_id !== user_id) {
            throw new ForbiddenException('You do not have access to this API key');
        }

        key.is_revoked = true;
        const updatedKey = await this.apiKeysRepository.save(key);

        return this.toResponseDto(updatedKey);
    }

    async rollover(user_id: string, rolloverDto: RolloverApiKeyDto): Promise<CreateApiKeyResponseDto> {
        const oldKey = await this.apiKeysRepository.findOne({
            where: { id: rolloverDto.expired_key_id }
        });

        if (!oldKey) {
            throw new NotFoundException(`API key with ID ${rolloverDto.expired_key_id} not found`);
        }

        if (oldKey.user_id !== user_id) {
            throw new ForbiddenException('You do not have access to this API key');
        }

        // Verify key is actually expired
        const now = new Date();
        if (oldKey.expires_at > now) {
            throw new BadRequestException('API key must be expired to rollover');
        }

        // Revoke old key
        oldKey.is_revoked = true;
        await this.apiKeysRepository.save(oldKey);

        // Create new key with same name and permissions
        return this.create(user_id, {
            name: oldKey.name,
            permissions: oldKey.permissions,
            expiry: rolloverDto.expiry,
        });
    }

    async validateApiKey(plainKey: string): Promise<ApiKey | null> {
        // Hash the incoming key
        const key_hash = this.hashKey(plainKey);

        // Direct lookup by hash (O(1))
        const key = await this.apiKeysRepository.findOne({
            where: {
                key_hash,
                is_revoked: false,
                expires_at: MoreThan(new Date()),
            },
            relations: ['user'],
        });

        if (key) {
            // Update last_used_at
            key.last_used_at = new Date();
            await this.apiKeysRepository.save(key);
            return key;
        }

        return null;
    }

    private async countActiveKeys(user_id: string): Promise<number> {
        return this.apiKeysRepository.count({
            where: {
                user_id,
                is_revoked: false,
                expires_at: MoreThan(new Date()),
            },
        });
    }

    private toResponseDto(key: ApiKey): ApiKeyResponseDto {
        return {
            id: key.id,
            name: key.name,
            permissions: key.permissions,
            expires_at: key.expires_at,
            is_revoked: key.is_revoked,
            last_used_at: key.last_used_at,
            created_at: key.created_at,
            updated_at: key.updated_at,
        };
    }
}
