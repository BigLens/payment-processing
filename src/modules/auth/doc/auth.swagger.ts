import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export const GoogleAuthDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Initiate Google OAuth flow',
            description: 'Redirects user to Google OAuth consent screen for authentication',
        }),
        ApiResponse({
            status: 302,
            description: 'Redirects to Google OAuth consent screen',
        }),
    );

export const GoogleCallbackDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Google OAuth callback',
            description: 'Handles Google OAuth callback and returns JWT access token',
        }),
        ApiResponse({
            status: 200,
            description: 'Successfully authenticated. Returns JWT token and user data',
            type: LoginResponseDto,
            schema: {
                example: {
                    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    user: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        email: 'user@example.com',
                        name: 'John Doe',
                        google_id: '1234567890',
                        created_at: '2024-01-01T00:00:00.000Z',
                        updated_at: '2024-01-01T00:00:00.000Z',
                    },
                },
            },
        }),
    );

export const GetProfileDoc = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get current user profile',
            description: 'Returns the authenticated user profile information',
        }),
        ApiResponse({
            status: 200,
            description: 'Successfully retrieved user profile',
            type: UserResponseDto,
            schema: {
                example: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'user@example.com',
                    name: 'John Doe',
                    google_id: '1234567890',
                    created_at: '2024-01-01T00:00:00.000Z',
                    updated_at: '2024-01-01T00:00:00.000Z',
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing JWT token',
            schema: {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized',
                },
            },
        }),
    );
