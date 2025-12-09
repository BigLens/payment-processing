import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TransactionType } from '../enums/transaction.enum';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  wallet_id!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsUUID()
  @IsOptional()
  recipient_wallet_id?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
