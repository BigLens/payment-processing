import { IsArray, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiKeyPermission } from '../enums/api-key.enum';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @IsEnum(ApiKeyPermission, { each: true })
  permissions!: ApiKeyPermission[];
}
