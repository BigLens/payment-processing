import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyResponseDto {
    @ApiProperty({
        example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        description: 'Plain API key - only shown once. Store this securely!',
    })
    api_key!: string;

    @ApiProperty({ example: '2025-12-10T21:58:00.000Z' })
    expires_at!: Date;
}
