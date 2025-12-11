import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { WalletsService } from './wallets.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Get('callback')
    @ApiOperation({ summary: 'Handle Paystack callback redirect', description: 'User is redirected here after payment. Verifies transaction status.' })
    @ApiResponse({ status: 200, description: 'Payment verified successfully' })
    async handleCallback(
        @Query('trxref') trxref: string,
        @Query('reference') reference: string,
        @Res() res: Response,
    ) {
        // Check status of the transaction
        // Note: The actual credit happens via Webhook. This is just for UI usage.
        const status = await this.walletsService.getDepositStatus(reference);

        if (status.status === 'success') {
            return res.json({
                status: true,
                message: 'Payment successful',
                data: status,
            });
        } else {
            return res.json({
                status: false,
                message: 'Payment verification pending or failed',
                data: status,
            });
        }
    }
}
