import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { PaymentsController } from './payments.controller';
import { PaystackModule } from '../paystack/paystack.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuthModule } from '../auth/auth.module';
import { FlexibleAuthGuard } from '../../common/guards/flexible-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    PaystackModule,
    ApiKeysModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [WalletsController, PaymentsController],
  providers: [WalletsService, FlexibleAuthGuard, JwtAuthGuard, ApiKeyGuard],
  exports: [TypeOrmModule, WalletsService],
})
export class WalletsModule { }
