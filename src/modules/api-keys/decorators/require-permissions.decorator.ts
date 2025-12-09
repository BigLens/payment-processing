import { SetMetadata } from '@nestjs/common';
import { ApiKeyPermission } from '../enums/api-key.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: ApiKeyPermission[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
