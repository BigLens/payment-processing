import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExpiryFormat } from './create-api-key.dto';

export class RolloverApiKeyDto {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID of the expired API key to rollover',
    })
    @IsString()
    @IsNotEmpty()
    expired_key_id!: string;

    @ApiProperty({
        example: '1M',
        enum: ['1H', '1D', '1M', '1Y'],
        description: 'Expiry duration for the new key',
    })
    @IsEnum(['1H', '1D', '1M', '1Y'])
    expiry!: ExpiryFormat;
}
