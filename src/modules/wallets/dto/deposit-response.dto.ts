import { ApiProperty } from '@nestjs/swagger';

export class DepositResponseDto {
    @ApiProperty({ example: 'TXN_1733778000000_a1b2c3d4e5f6g7h8' })
    reference!: string;

    @ApiProperty({ example: 'https://checkout.paystack.com/abc123xyz' })
    authorization_url!: string;
}
