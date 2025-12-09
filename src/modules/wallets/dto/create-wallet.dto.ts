import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateWalletDto {
    @IsUUID()
    @IsNotEmpty()
    user_id!: string;
}
