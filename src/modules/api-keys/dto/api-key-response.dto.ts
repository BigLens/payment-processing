import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyPermission } from '../enums/api-key.enum';

export class ApiKeyResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id!: string;

    @ApiProperty({ example: 'Production API Key' })
    name!: string;

    @ApiProperty({ example: [ApiKeyPermission.READ, ApiKeyPermission.DEPOSIT], enum: ApiKeyPermission, isArray: true })
    permissions!: ApiKeyPermission[];

    @ApiProperty()
    expires_at!: Date;

    @ApiProperty({ example: false })
    is_revoked!: boolean;

    @ApiProperty({ nullable: true })
    last_used_at!: Date | null;

    @ApiProperty()
    created_at!: Date;

    @ApiProperty()
    updated_at!: Date;
}
