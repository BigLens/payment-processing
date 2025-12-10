import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { WalletsService } from './wallets.service';
import { FlexibleAuthGuard } from '../../common/guards/flexible-auth.guard';
import { PermissionsGuard } from '../api-keys/guards/permissions.guard';
import { RequirePermissions } from '../api-keys/decorators/require-permissions.decorator';
import { ApiKeyPermission } from '../api-keys/enums/api-key.enum';
import { DepositDto } from './dto/deposit.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { User } from '../users/entities/user.entity';
import { DepositDoc, GetBalanceDoc } from './doc/wallets.swagger';

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

  @Get('balance')
  @UseGuards(FlexibleAuthGuard, PermissionsGuard)
  @RequirePermissions(ApiKeyPermission.READ)
  @GetBalanceDoc()
  async getBalance(@Req() req: Request & { user: User }) {
    const balance = await this.walletsService.getBalance(req.user.id);
    return { balance };
  }
}
