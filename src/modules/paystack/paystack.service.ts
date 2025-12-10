import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface InitializeTransactionResponse {
    authorization_url: string;
    access_code: string;
    reference: string;
}

export interface VerifyTransactionResponse {
    status: boolean;
    message: string;
    data: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at: string;
    };
}

@Injectable()
export class PaystackService {
    private readonly axiosInstance: AxiosInstance;
    private readonly logger = new Logger(PaystackService.name);

    constructor(private readonly configService: ConfigService) {
        const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

        this.axiosInstance = axios.create({
            baseURL: 'https://api.paystack.co',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async initializeTransaction(
        email: string,
        amount: number,
        reference: string,
    ): Promise<InitializeTransactionResponse> {
        try {
            const response = await this.axiosInstance.post('/transaction/initialize', {
                email,
                amount: amount * 100, // Convert to kobo
                reference,
            });

            this.logger.log(`Transaction initialized: ${reference}`);

            return {
                authorization_url: response.data.data.authorization_url,
                access_code: response.data.data.access_code,
                reference: response.data.data.reference,
            };
        } catch (error) {
            this.logger.error(`Failed to initialize transaction: ${error}`);
            throw error;
        }
    }

    async verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
        try {
            const response = await this.axiosInstance.get(`/transaction/verify/${reference}`);

            this.logger.log(`Transaction verified: ${reference}`);

            return response.data;
        } catch (error) {
            this.logger.error(`Failed to verify transaction: ${error}`);
            throw error;
        }
    }
}
