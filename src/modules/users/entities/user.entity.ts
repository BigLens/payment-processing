import { Entity, Column, OneToOne, OneToMany } from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { ApiKey } from '../../api-keys/entities/api-key.entity';
import { BaseEntity } from '../../../entity/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column({ name: 'google_id', type: 'varchar', unique: true, nullable: true })
  google_id!: string | null;

  @Column()
  name!: string;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet!: Wallet;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  api_keys!: ApiKey[];
}
