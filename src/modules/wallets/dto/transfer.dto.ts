import { IsString, IsNumber, IsPositive, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
    @ApiProperty({
        example: '4566678954356',
        description: 'Recipient wallet number (13 digits)',
    })
    @IsString()
    @Length(13, 13)
    wallet_number!: string;

    @ApiProperty({
        example: 3000,
        description: 'Amount to transfer in Naira',
    })
    @IsNumber()
    @IsPositive()
    amount!: number;
}
