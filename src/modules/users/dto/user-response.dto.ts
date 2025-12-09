import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id!: string;

    @ApiProperty({ example: 'user@example.com' })
    email!: string;

    @ApiProperty({ example: 'John Doe' })
    name!: string;

    @ApiProperty({ example: '1234567890', nullable: true })
    google_id!: string | null;

    @ApiProperty()
    created_at!: Date;

    @ApiProperty()
    updated_at!: Date;
}
