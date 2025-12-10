import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
    @ApiProperty({ example: 5000, description: 'Amount to deposit in Naira' })
    @IsNumber()
    @IsPositive()
    amount!: number;
}
