import { Controller, Post, Get, Body, Param, Req, UseGuards, Headers, HttpCode } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WalletsService } from './wallets.service';
import { FlexibleAuthGuard } from '../../common/guards/flexible-auth.guard';
import { PermissionsGuard } from '../api-keys/guards/permissions.guard';
import { RequirePermissions } from '../api-keys/decorators/require-permissions.decorator';
import { ApiKeyPermission } from '../api-keys/enums/api-key.enum';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { User } from '../users/entities/user.entity';
import { PaystackWebhookPayload } from './interfaces/paystack-webhook.interface';
import {
  DepositDoc,
  GetBalanceDoc,
  WebhookDoc,
  GetDepositStatusDoc,
  TransferDoc,
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
  async paystackWebhook(
    @Body() payload: PaystackWebhookPayload,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.walletsService.handleWebhook(payload, signature);
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
