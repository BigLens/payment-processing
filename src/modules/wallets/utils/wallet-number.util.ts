export function generateWalletNumber(): string {
    // 13-digit number.
    // To ensure it's 13 digits, we can generate a random number within range.
    // Min: 1000000000000
    // Max: 9999999999999
    const min = 1000000000000;
    const max = 9999999999999;
    return Math.floor(Math.min(min + Math.random() * (max - min + 1), max)).toString();
}
