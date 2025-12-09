import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { TransactionType, TransactionStatus } from '../enums/transaction.enum';
import { BaseEntity } from '../../../entity/base.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column({ name: 'wallet_id' })
  wallet_id!: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column('decimal', { precision: 20, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ type: 'varchar', unique: true, nullable: true })
  reference!: string | null;

  @Column({ name: 'recipient_wallet_id', type: 'uuid', nullable: true })
  recipient_wallet_id!: string | null;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, unknown> | null;
}
