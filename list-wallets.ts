import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { Wallet } from './src/modules/wallets/entities/wallet.entity';

async function listWallets() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    const wallets = await dataSource.getRepository(Wallet).find({
        relations: ['user'],
    });

    console.log('\n--- AVAILABLE WALLETS ---');
    wallets.forEach(w => {
        console.log(`Owner: ${w.user?.email || 'Unknown'} | Wallet: ${w.wallet_number} | Balance: ${w.balance}`);
    });
    console.log('-------------------------\n');

    await app.close();
}

listWallets();
