import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { User } from '../users/entities/user.entity';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly walletsService: WalletsService,
        private readonly jwtService: JwtService,
    ) { }

    async validateGoogleUser(
        google_id: string,
        email: string,
        name: string,
    ): Promise<User> {
        // Check if user exists by Google ID
        let user = await this.usersService.findByGoogleId(google_id);

        if (!user) {
            // Create new user
            user = await this.usersService.create({
                email,
                name,
                google_id,
            });

            // Create wallet for new user
            await this.walletsService.createForUser(user.id);
        }

        return user;
    }

    async login(user: User): Promise<LoginResponseDto> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                google_id: user.google_id,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
        };
    }

    async validateJwtPayload(payload: JwtPayload): Promise<User> {
        const user = await this.usersService.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }
        return user;
    }
}
