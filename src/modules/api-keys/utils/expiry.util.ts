import { ExpiryFormat } from '../dto/create-api-key.dto';

export function parseExpiry(expiry: ExpiryFormat): Date {
    const now = new Date();

    switch (expiry) {
        case '1H':
            return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        case '1D':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
        case '1M':
            const oneMonth = new Date(now);
            oneMonth.setMonth(oneMonth.getMonth() + 1);
            return oneMonth;
        case '1Y':
            const oneYear = new Date(now);
            oneYear.setFullYear(oneYear.getFullYear() + 1);
            return oneYear;
        default:
            throw new Error(`Invalid expiry format: ${expiry}`);
    }
}
