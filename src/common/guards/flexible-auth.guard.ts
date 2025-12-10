import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { firstValueFrom, isObservable } from 'rxjs';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../modules/api-keys/guards/api-key.guard';

@Injectable()
export class FlexibleAuthGuard implements CanActivate {
    constructor(
        private readonly jwtAuthGuard: JwtAuthGuard,
        private readonly apiKeyGuard: ApiKeyGuard,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();

        // Check if x-api-key header exists
        const hasApiKey = !!request.headers['x-api-key'];

        // Check if Authorization header exists
        const hasJwt = !!request.headers.authorization;

        // Try API key first if present
        if (hasApiKey) {
            try {
                const result = await this.apiKeyGuard.canActivate(context);
                return result;
            } catch (error) {
                throw new UnauthorizedException('Invalid API key');
            }
        }

        // Try JWT if present
        if (hasJwt) {
            try {
                const result = this.jwtAuthGuard.canActivate(context);
                // Convert Observable to Promise if needed
                return isObservable(result) ? await firstValueFrom(result) : result;
            } catch (error) {
                throw new UnauthorizedException('Invalid JWT token');
            }
        }

        // No authentication provided
        throw new UnauthorizedException('Authentication required (JWT or API key)');
    }
}
