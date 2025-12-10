import { Controller, Post, Get, Body, Param, Req, UseGuards, Headers, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { WalletsService } from './wallets.service';
import { FlexibleAuthGuard } from '../../common/guards/flexible-auth.guard';
import { PermissionsGuard } from '../api-keys/guards/permissions.guard';
import { RequirePermissions } from '../api-keys/decorators/require-permissions.decorator';
import { ApiKeyPermission } from '../api-keys/enums/api-key.enum';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { User } from '../users/entities/user.entity';
import { PaystackWebhookPayload } from './interfaces/paystack-webhook.interface';
import {
  DepositDoc,
  GetBalanceDoc,
  WebhookDoc,
  GetDepositStatusDoc,
  TransferDoc,
  GetTransactionsDoc,
} from './doc/wallets.swagger';

@ApiTags('wallet')
@Controller('wallet')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) { }

  @Post('deposit')
  @UseGuards(FlexibleAuthGuard, PermissionsGuard)
  @RequirePermissions(ApiKeyPermission.DEPOSIT)
  @DepositDoc()
  async deposit(
    @Req() req: Request & { user: User },
    @Body() depositDto: DepositDto,
  ): Promise<DepositResponseDto> {
    return this.walletsService.initializeDeposit(
      req.user.id,
      depositDto.amount,
      req.user.email,
    );
  }

  @Post('paystack/webhook')
  @HttpCode(200)
  @WebhookDoc()
  @ApiBody({ schema: { example: { event: 'charge.success', data: { reference: 'TXN_REQUIRED', amount: 500000, status: 'success' } } } })
  async paystackWebhook(
    @Body() payload: PaystackWebhookPayload,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.walletsService.handleWebhook(payload, signature);
  }

  @Post('test/generate-signature')
  @ApiOperation({ summary: 'Generate Paystack signature for testing' })
  @ApiBody({ schema: { example: { event: 'charge.success', data: { reference: 'TXN_...', amount: 500000, status: 'success' } } } })
  async generateSignature(@Body() payload: any) {
    const signature = this.walletsService.generateTestSignature(payload);
    return { signature };
  }

  @Post('transfer')
  @UseGuards(FlexibleAuthGuard, PermissionsGuard)
  @RequirePermissions(ApiKeyPermission.TRANSFER)
  @TransferDoc()
  async transfer(
    @Req() req: Request & { user: User },
    @Body() transferDto: TransferDto,
  ) {
    return this.walletsService.transfer(
      req.user.id,
      transferDto.wallet_number,
      transferDto.amount,
    );
  }

  @Get('transactions')
  @UseGuards(FlexibleAuthGuard, PermissionsGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @GetTransactionsDoc()
  async getTransactions(
    @Req() req: Request & { user: User },
    @Query() filterDto: TransactionFilterDto,
  ) {
    return this.walletsService.getTransactions(req.user.id, filterDto);
  }

  @Get('deposit/:reference/status')
  @UseGuards(FlexibleAuthGuard, PermissionsGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @GetDepositStatusDoc()
  async getDepositStatus(@Param('reference') reference: string) {
    return this.walletsService.getDepositStatus(reference);
  }

  @Get('balance')
  @UseGuards(FlexibleAuthGuard, PermissionsGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @GetBalanceDoc()
  async getBalance(@Req() req: Request & { user: User }) {
    const balance = await this.walletsService.getBalance(req.user.id);
    return { balance };
  }
}
