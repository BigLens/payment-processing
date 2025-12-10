import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiHeader } from '@nestjs/swagger';
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

export const WebhookDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Paystack webhook handler',
            description: 'Receives payment notifications from Paystack. Validates signature and credits wallet on successful payment. This endpoint is called by Paystack, not by users.',
        }),
        ApiHeader({
            name: 'x-paystack-signature',
            description: 'Paystack webhook signature for verification',
            required: true,
        }),
        ApiResponse({
            status: 200,
            description: 'Webhook processed successfully',
            schema: {
                example: {
                    status: true,
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid signature',
        }),
        ApiResponse({
            status: 404,
            description: 'Transaction not found',
        }),
    );

export const TransferDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Transfer funds to another wallet',
            description: 'Transfers money from authenticated user wallet to another user wallet. Transaction is atomic - both debit and credit happen together or not at all.',
        }),
        ApiSecurity('bearer'),
        ApiSecurity('x-api-key'),
        ApiResponse({
            status: 201,
            description: 'Transfer completed successfully',
            schema: {
                example: {
                    status: 'success',
                    message: 'Transfer completed',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Insufficient balance or invalid transfer',
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing authentication',
        }),
        ApiResponse({
            status: 403,
            description: 'Forbidden - Insufficient permissions (requires transfer permission)',
        }),
        ApiResponse({
            status: 404,
            description: 'Sender or recipient wallet not found',
        }),
    );

export const GetDepositStatusDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get deposit transaction status',
            description: 'Returns the status of a deposit transaction by reference. This endpoint does NOT credit wallets - only the webhook credits wallets.',
        }),
        ApiSecurity('bearer'),
        ApiSecurity('x-api-key'),
        ApiResponse({
            status: 200,
            description: 'Transaction status retrieved successfully',
            schema: {
                example: {
                    reference: 'TXN_1733778000000_a1b2c3d4e5f6g7h8',
                    status: 'success',
                    amount: 5000,
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
            description: 'Transaction not found',
        }),
    );


export const GetTransactionsDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get wallet transactions',
            description: 'Retrieve transaction history with optional filters (type, status, date range) and pagination.',
        }),
        ApiSecurity('bearer'),
        ApiSecurity('x-api-key'),
        ApiResponse({
            status: 200,
            description: 'Transactions retrieved successfully',
            schema: {
                example: {
                    data: [
                        {
                            id: 'uuid',
                            type: 'deposit',
                            amount: 5000,
                            status: 'success',
                            reference: 'TXN_...',
                            created_at: '2024-12-10T...',
                        }
                    ],
                    meta: {
                        total: 1,
                        limit: 10,
                        offset: 0,
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized',
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
