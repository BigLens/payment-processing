import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetRootDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get API root information',
            description: 'Returns welcome message and basic API information',
        }),
        ApiResponse({
            status: 200,
            description: 'Successfully retrieved root information',
            schema: {
                example: {
                    message: 'Welcome to NestJS Wallet Service API',
                    version: '1.0.0',
                    docs: '/api/docs',
                },
            },
        }),
    );

export const GetHealthDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Health check endpoint',
            description: 'Returns the health status of the API',
        }),
        ApiResponse({
            status: 200,
            description: 'API is healthy',
            schema: {
                example: {
                    status: 'ok',
                    timestamp: '2024-01-01T00:00:00.000Z',
                },
            },
        }),
    );
