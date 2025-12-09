import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let walletsService: WalletsService;
    let jwtService: JwtService;

    const mockUser: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        google_id: '1234567890',
        created_at: new Date(),
        updated_at: new Date(),
        wallet: {} as any,
        api_keys: [],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByGoogleId: jest.fn(),
                        findById: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: WalletsService,
                    useValue: {
                        createForUser: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        walletsService = module.get<WalletsService>(WalletsService);
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateGoogleUser', () => {
        it('should return existing user if found by Google ID', async () => {
            jest.spyOn(usersService, 'findByGoogleId').mockResolvedValue(mockUser);

            const result = await service.validateGoogleUser('1234567890', 'test@example.com', 'Test User');

            expect(result).toEqual(mockUser);
            expect(usersService.findByGoogleId).toHaveBeenCalledWith('1234567890');
            expect(usersService.create).not.toHaveBeenCalled();
        });

        it('should create new user and wallet if not found', async () => {
            jest.spyOn(usersService, 'findByGoogleId').mockResolvedValue(null);
            jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
            jest.spyOn(walletsService, 'createForUser').mockResolvedValue({} as any);

            const result = await service.validateGoogleUser('1234567890', 'test@example.com', 'Test User');

            expect(result).toEqual(mockUser);
            expect(usersService.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                name: 'Test User',
                google_id: '1234567890',
            });
            expect(walletsService.createForUser).toHaveBeenCalledWith(mockUser.id);
        });
    });

    describe('login', () => {
        it('should generate JWT token and return login response', async () => {
            const mockToken = 'mock.jwt.token';
            jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

            const result = await service.login(mockUser);

            expect(result).toEqual({
                access_token: mockToken,
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    google_id: mockUser.google_id,
                    created_at: mockUser.created_at,
                    updated_at: mockUser.updated_at,
                },
            });
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: mockUser.id,
                email: mockUser.email,
            });
        });
    });

    describe('validateJwtPayload', () => {
        it('should return user for valid payload', async () => {
            jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

            const result = await service.validateJwtPayload({
                sub: mockUser.id,
                email: mockUser.email,
            });

            expect(result).toEqual(mockUser);
            expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
        });

        it('should throw UnauthorizedException for invalid user ID', async () => {
            jest.spyOn(usersService, 'findById').mockRejectedValue(new Error('User not found'));

            await expect(
                service.validateJwtPayload({
                    sub: 'invalid-id',
                    email: 'test@example.com',
                }),
            ).rejects.toThrow();
        });
    });
});
