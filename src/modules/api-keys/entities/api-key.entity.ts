import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiKeyPermission } from '../enums/api-key.enum';
import { BaseEntity } from '../../../entity/base.entity';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column({ name: 'user_id' })
  user_id!: string;

  @ManyToOne(() => User, (user) => user.api_keys)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'key_hash' })
  key_hash!: string;

  @Column()
  name!: string;

  @Column('simple-array')
  permissions!: ApiKeyPermission[];

  @Column({ name: 'expires_at' })
  expires_at!: Date;

  @Column({ name: 'is_revoked', default: false })
  is_revoked!: boolean;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  last_used_at!: Date | null;
}
