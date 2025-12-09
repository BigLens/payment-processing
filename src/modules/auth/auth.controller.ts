import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';
import { GoogleAuthDoc, GoogleCallbackDoc, GetProfileDoc } from './doc/auth.swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @GoogleAuthDoc()
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @GoogleCallbackDoc()
    async googleAuthCallback(@Req() req: Request & { user: User }): Promise<LoginResponseDto> {
        return this.authService.login(req.user);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @GetProfileDoc()
    async getProfile(@Req() req: Request & { user: User }): Promise<UserResponseDto> {
        const user = req.user;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            google_id: user.google_id,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
    }
}
