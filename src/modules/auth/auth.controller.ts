import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Initiate Google OAuth flow' })
    @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({ status: 200, description: 'Returns JWT token and user data', type: LoginResponseDto })
    async googleAuthCallback(@Req() req: Request & { user: User }): Promise<LoginResponseDto> {
        return this.authService.login(req.user);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Returns current user data', type: UserResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
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
