import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request & { user: User }>();
        const apiKey = request.headers['x-api-key'] as string;

        if (!apiKey) {
            throw new UnauthorizedException('API key is required');
        }

        const validatedKey = await this.apiKeysService.validateApiKey(apiKey);

        if (!validatedKey) {
            throw new UnauthorizedException('Invalid or expired API key');
        }

        // Attach user and apiKey to request
        request.user = validatedKey.user;
        (request as any).apiKey = validatedKey;

        return true;
    }
}
