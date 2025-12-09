import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { ApiKeyPermission } from '../enums/api-key.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<ApiKeyPermission[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request & { user: User; apiKey?: { permissions: ApiKeyPermission[] } }>();
        const apiKey = request.apiKey;

        if (!apiKey) {
            throw new ForbiddenException('API key permissions not found');
        }

        const hasPermission = requiredPermissions.every((permission) =>
            apiKey.permissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
