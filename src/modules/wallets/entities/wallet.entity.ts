import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { BaseEntity } from '../../../entity/base.entity';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @Column({ name: 'user_id' })
  user_id!: string;

  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'wallet_number', length: 13, unique: true })
  wallet_number!: string;

  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  balance!: number;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions!: Transaction[];
}
