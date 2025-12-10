import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { CreateApiKeyResponseDto } from './dto/create-api-key-response.dto';
import { User } from '../users/entities/user.entity';
import {
    CreateApiKeyDoc,
    ListApiKeysDoc,
    GetApiKeyDoc,
    RevokeApiKeyDoc,
    RolloverApiKeyDoc,
} from './doc/api-keys.swagger';

@ApiTags('api-keys')
@Controller('keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    @Post('create')
    @CreateApiKeyDoc()
    async create(
        @Req() req: Request & { user: User },
        @Body() createApiKeyDto: CreateApiKeyDto,
    ): Promise<CreateApiKeyResponseDto> {
        return this.apiKeysService.create(req.user.id, createApiKeyDto);
    }

    @Get()
    @ListApiKeysDoc()
    async findAll(@Req() req: Request & { user: User }): Promise<ApiKeyResponseDto[]> {
        return this.apiKeysService.findByUserId(req.user.id);
    }

    @Get(':id')
    @GetApiKeyDoc()
    async findOne(
        @Req() req: Request & { user: User },
        @Param('id') id: string,
    ): Promise<ApiKeyResponseDto> {
        return this.apiKeysService.findById(id, req.user.id);
    }

    @Delete(':id')
    @RevokeApiKeyDoc()
    async revoke(
        @Req() req: Request & { user: User },
        @Param('id') id: string,
    ): Promise<ApiKeyResponseDto> {
        return this.apiKeysService.revoke(id, req.user.id);
    }

    @Post('rollover')
    @RolloverApiKeyDoc()
    async rollover(
        @Req() req: Request & { user: User },
        @Body() rolloverDto: RolloverApiKeyDto,
    ): Promise<CreateApiKeyResponseDto> {
        return this.apiKeysService.rollover(req.user.id, rolloverDto);
    }
}
