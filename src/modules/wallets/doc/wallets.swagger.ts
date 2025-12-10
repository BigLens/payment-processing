import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { DepositResponseDto } from '../dto/deposit-response.dto';

export const DepositDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Initialize wallet deposit',
            description: 'Initializes a Paystack transaction for wallet deposit. Returns a payment link for the user to complete payment.',
        }),
        ApiSecurity('bearer'),
        ApiSecurity('x-api-key'),
        ApiResponse({
            status: 201,
            description: 'Deposit initialized successfully',
            type: DepositResponseDto,
            schema: {
                example: {
                    reference: 'TXN_1733778000000_a1b2c3d4e5f6g7h8',
                    authorization_url: 'https://checkout.paystack.com/abc123xyz',
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing authentication',
        }),
        ApiResponse({
            status: 403,
            description: 'Forbidden - Insufficient permissions (requires deposit permission)',
        }),
        ApiResponse({
            status: 404,
            description: 'Wallet not found',
        }),
    );

export const GetBalanceDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get wallet balance',
            description: 'Returns the current balance of the authenticated user wallet.',
        }),
        ApiSecurity('bearer'),
        ApiSecurity('x-api-key'),
        ApiResponse({
            status: 200,
            description: 'Balance retrieved successfully',
            schema: {
                example: {
                    balance: 15000,
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing authentication',
        }),
        ApiResponse({
            status: 403,
            description: 'Forbidden - Insufficient permissions (requires read permission)',
        }),
        ApiResponse({
            status: 404,
            description: 'Wallet not found',
        }),
    );
