import { IsString, IsNotEmpty, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyPermission } from '../enums/api-key.enum';

export type ExpiryFormat = '1H' | '1D' | '1M' | '1Y';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'wallet-service' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: ['read', 'deposit'],
    enum: ApiKeyPermission,
    isArray: true,
  })
  @IsArray()
  @IsEnum(ApiKeyPermission, { each: true })
  permissions!: ApiKeyPermission[];

  @ApiProperty({
    example: '1D',
    enum: ['1H', '1D', '1M', '1Y'],
    description: 'Expiry duration: 1H (Hour), 1D (Day), 1M (Month), 1Y (Year)',
  })
  @IsEnum(['1H', '1D', '1M', '1Y'])
  expiry!: ExpiryFormat;
}
