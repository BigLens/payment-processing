import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateApiKeyResponseDto } from '../dto/create-api-key-response.dto';
import { ApiKeyResponseDto } from '../dto/api-key-response.dto';

export const CreateApiKeyDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Create new API key',
            description: 'Creates a new API key with specified permissions and expiry. Maximum 5 active keys allowed per user. The plain key is only shown once - store it securely!',
        }),
        ApiResponse({
            status: 201,
            description: 'API key created successfully',
            type: CreateApiKeyResponseDto,
            schema: {
                example: {
                    api_key: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
                    expires_at: '2025-12-10T21:58:00.000Z',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Maximum 5 active API keys allowed',
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing JWT token',
        }),
    );

export const ListApiKeysDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'List all API keys',
            description: 'Returns all API keys for the authenticated user. Plain keys are never shown after creation.',
        }),
        ApiResponse({
            status: 200,
            description: 'Successfully retrieved API keys',
            type: [ApiKeyResponseDto],
            schema: {
                example: [
                    {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'wallet-service',
                        permissions: ['read', 'deposit'],
                        expires_at: '2025-12-10T21:58:00.000Z',
                        is_revoked: false,
                        last_used_at: '2024-12-09T12:00:00.000Z',
                        created_at: '2024-12-09T00:00:00.000Z',
                        updated_at: '2024-12-09T00:00:00.000Z',
                    },
                ],
            },
        }),
    );

export const GetApiKeyDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get API key details',
            description: 'Returns details for a specific API key',
        }),
        ApiResponse({
            status: 200,
            description: 'Successfully retrieved API key',
            type: ApiKeyResponseDto,
        }),
        ApiResponse({
            status: 404,
            description: 'API key not found',
        }),
        ApiResponse({
            status: 403,
            description: 'Forbidden - You do not have access to this API key',
        }),
    );

export const RevokeApiKeyDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Revoke API key',
            description: 'Revokes an API key, making it unusable. This action cannot be undone.',
        }),
        ApiResponse({
            status: 200,
            description: 'API key revoked successfully',
            type: ApiKeyResponseDto,
        }),
        ApiResponse({
            status: 404,
            description: 'API key not found',
        }),
        ApiResponse({
            status: 403,
            description: 'Forbidden - You do not have access to this API key',
        }),
    );

export const RolloverApiKeyDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Rollover expired API key',
            description: 'Creates a new API key using the same permissions as an expired key. The expired key must truly be expired. Returns the new plain key.',
        }),
        ApiResponse({
            status: 201,
            description: 'API key rolled over successfully',
            type: CreateApiKeyResponseDto,
            schema: {
                example: {
                    api_key: 'x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6',
                    expires_at: '2026-01-09T21:58:00.000Z',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - API key must be expired to rollover',
        }),
        ApiResponse({
            status: 404,
            description: 'API key not found',
        }),
        ApiResponse({
            status: 403,
            description: 'Forbidden - You do not have access to this API key',
        }),
    );
