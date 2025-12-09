import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

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
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findByGoogleId', () => {
        it('should return user if found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

            const result = await service.findByGoogleId('1234567890');

            expect(result).toEqual(mockUser);
            expect(repository.findOne).toHaveBeenCalledWith({ where: { google_id: '1234567890' } });
        });

        it('should return null if not found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            const result = await service.findByGoogleId('invalid-id');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return user if found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

            const result = await service.findById(mockUser.id);

            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundException if not found', async () => {
            jest.spyOn(repository, 'findOne').mockResolvedValue(null);

            await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create and return new user', async () => {
            const createUserDto = {
                email: 'test@example.com',
                name: 'Test User',
                google_id: '1234567890',
            };

            jest.spyOn(repository, 'create').mockReturnValue(mockUser);
            jest.spyOn(repository, 'save').mockResolvedValue(mockUser);

            const result = await service.create(createUserDto);

            expect(result).toEqual(mockUser);
            expect(repository.create).toHaveBeenCalledWith(createUserDto);
            expect(repository.save).toHaveBeenCalledWith(mockUser);
        });
    });
});
