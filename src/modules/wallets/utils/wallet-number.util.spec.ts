import { generateWalletNumber } from './wallet-number.util';

describe('Vertex Wallet Number Generator', () => {
    it('should generate a 13-digit string', () => {
        const walletNumber = generateWalletNumber();
        expect(walletNumber).toHaveLength(13);
        expect(walletNumber).toMatch(/^\d{13}$/);
    });

    it('should generate unique numbers (probabilistic)', () => {
        const num1 = generateWalletNumber();
        const num2 = generateWalletNumber();
        expect(num1).not.toEqual(num2);
    });
});
