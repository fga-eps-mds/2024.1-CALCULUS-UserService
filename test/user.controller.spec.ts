import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { UsersController } from 'src/users/users.controller';
import { UserRole } from 'src/users/dtos/user-role.enum';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UpdateRoleDto } from 'src/users/dtos/update-role.dto';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const mockUser = {
    _id: '61c0ccf11d7bf83d153d7c06',
    name: 'Ghulam',
    email: 'ghulam1@gmail.com',
    username: 'ghulam123',
    role: UserRole.ADMIN,
  };

  const mockUsersService = {
    createUser: jest.fn().mockResolvedValue({
      message: 'User created successfully. Please verify your email.',
    }),
    verifyUser: jest.fn().mockResolvedValue(mockUser),
    getUsers: jest.fn().mockResolvedValue([mockUser]),
    getUserById: jest.fn().mockResolvedValue(mockUser),
    deleteUserById: jest.fn().mockResolvedValue({ deleted: true }),
    updateUserRole: jest.fn().mockResolvedValue({
      message: 'User role updated successfully',
      user: { ...mockUser, role: UserRole.ADMIN },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'Ghulam',
        email: 'ghulam1@gmail.com',
        password: 'password123',
        username: 'ghulam123',
      };

      const result = await usersController.createUser(
        createUserDto as CreateUserDto,
      );

      expect(usersService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        message: 'User created successfully. Please verify your email.',
      });
    });

    it('should throw an error if user creation fails', async () => {
      const createUserDto = {
        name: 'Ghulam',
        email: 'ghulam1@gmail.com',
        password: 'password123',
        username: 'ghulam123',
      };

      jest
        .spyOn(usersService, 'createUser')
        .mockRejectedValue(
          new InternalServerErrorException('Failed to create user'),
        );

      await expect(
        usersController.createUser(createUserDto as CreateUserDto),
      ).rejects.toThrow(
        new InternalServerErrorException('Failed to create user'),
      );
    });
  });

  describe('verifyUser', () => {
    it('should verify a user', async () => {
      const token = 'some-token';
      const result = await usersController.verifyUser(token);

      expect(usersService.verifyUser).toHaveBeenCalledWith(token);
      expect(result).toEqual({
        message: 'Account verified successfully',
      });
    });

    it('should throw NotFoundException if token is invalid', async () => {
      jest.spyOn(usersService, 'verifyUser').mockResolvedValue(null);

      await expect(usersController.verifyUser('invalid-token')).rejects.toThrow(
        new NotFoundException('Invalid verification token'),
      );
    });
  });

  describe('getUsers', () => {
    it('should return an array of users', async () => {
      const result = await usersController.getUsers();

      expect(usersService.getUsers).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const userId = '61c0ccf11d7bf83d153d7c06';
      const result = await usersController.getUserById(userId);

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest
        .spyOn(usersService, 'getUserById')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(usersController.getUserById('invalid-id')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should rethrow any other error', async () => {
      jest
        .spyOn(usersService, 'getUserById')
        .mockRejectedValue(new InternalServerErrorException('Some error'));

      await expect(usersController.getUserById('valid-id')).rejects.toThrow(
        new InternalServerErrorException('Some error'),
      );
    });
  });

  describe('deleteUserById', () => {
    it('should delete a user by id', async () => {
      const userId = '61c0ccf11d7bf83d153d7c06';
      const result = await usersController.deleteUserById(userId);

      expect(usersService.deleteUserById).toHaveBeenCalledWith(userId);
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      jest
        .spyOn(usersService, 'deleteUserById')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        usersController.deleteUserById('invalid-id'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should rethrow any other error', async () => {
      jest
        .spyOn(usersService, 'deleteUserById')
        .mockRejectedValue(new InternalServerErrorException('Some error'));

      await expect(usersController.deleteUserById('valid-id')).rejects.toThrow(
        new InternalServerErrorException('Some error'),
      );
    });
  });

  describe('updateUserRole', () => {

    it('should throw NotFoundException if user not found', async () => {
      jest
        .spyOn(usersService, 'updateUserRole')
        .mockRejectedValue(new NotFoundException('User not found'));

      await expect(
        usersController.updateUserRole('invalid-id', { role: UserRole.ADMIN }),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should rethrow any other error', async () => {
      jest
        .spyOn(usersService, 'updateUserRole')
        .mockRejectedValue(new InternalServerErrorException('Some error'));

      await expect(
        usersController.updateUserRole('valid-id', { role: UserRole.ADMIN }),
      ).rejects.toThrow(new InternalServerErrorException('Some error'));
    });
  });
});
