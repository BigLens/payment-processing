import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { generateWalletNumber } from './utils/wallet-number.util';

@Injectable()
export class WalletsService {
    constructor(
        @InjectRepository(Wallet)
        private readonly walletsRepository: Repository<Wallet>,
    ) { }

    async createForUser(user_id: string): Promise<Wallet> {
        const wallet = this.walletsRepository.create({
            user_id,
            wallet_number: generateWalletNumber(),
            balance: 0,
        });
        return this.walletsRepository.save(wallet);
    }

    async findByUserId(user_id: string): Promise<Wallet | null> {
        return this.walletsRepository.findOne({ where: { user_id } });
    }
}
