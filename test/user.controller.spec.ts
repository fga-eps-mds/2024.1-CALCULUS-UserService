import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/users/dtos/user-role.enum';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UpdateRoleDto } from 'src/users/dtos/update-role.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    _id: 'mockUserId',
    name: 'Mock User',
    email: 'mock@example.com',
    role: UserRole.ALUNO,
  };

  const mockUserService = {
    createUser: jest.fn().mockResolvedValue(mockUser),
    verifyUser: jest.fn().mockResolvedValue(mockUser),
    getSubscribedJourneys: jest.fn().mockResolvedValue([]),
    getUsers: jest.fn().mockResolvedValue([mockUser]),
    addPointToUser: jest.fn().mockResolvedValue(mockUser),
    subscribeJourney: jest.fn().mockResolvedValue(mockUser),
    unsubscribeJourney: jest.fn().mockResolvedValue(mockUser),
    getUserById: jest.fn().mockResolvedValue(mockUser),
    deleteUserById: jest.fn().mockResolvedValue(undefined),
    updateUserRole: jest.fn().mockResolvedValue(mockUser),
  };

  const mockAuthService = {};
  const mockJwtService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      username: '',
    };
    await expect(controller.createUser(createUserDto)).resolves.toEqual({
      message: 'User created successfully. Please verify your email.',
    });
  });

  it('should verify a user', async () => {
    const token = 'validToken';
    await expect(controller.verifyUser(token)).resolves.toEqual({
      message: 'Account verified successfully',
    });
  });

  it('should get subscribed journeys', async () => {
    const userId = 'mockUserId';
    await expect(controller.getSubscribedJourneys(userId)).resolves.toEqual([]);
  });

  it('should get all users', async () => {
    await expect(controller.getUsers()).resolves.toEqual([mockUser]);
  });

  it('should add a point to a user', async () => {
    const userId = 'mockUserId';
    const pointId = 'mockPointId';
    await expect(
      controller.addPointToUser(userId, { pointId }),
    ).resolves.toEqual(mockUser);
  });

  it('should handle error when adding a point to a user', async () => {
    const userId = 'mockUserId';
    const pointId = 'mockPointId';
    mockUserService.addPointToUser.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(
      controller.addPointToUser(userId, { pointId }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should get a user by ID', async () => {
    const userId = 'mockUserId';
    await expect(controller.getUserById(userId)).resolves.toEqual(mockUser);
  });

  it('should handle error when getting a user by ID', async () => {
    const userId = 'mockUserId';
    mockUserService.getUserById.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(controller.getUserById(userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete a user by ID', async () => {
    const userId = 'mockUserId';
    await expect(controller.deleteUserById(userId)).resolves.toBeUndefined();
  });

  it('should handle error when deleting a user by ID', async () => {
    const userId = 'mockUserId';
    mockUserService.deleteUserById.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(controller.deleteUserById(userId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update a user role', async () => {
    const userId = 'mockUserId';
    const updateRoleDto: UpdateRoleDto = { role: UserRole.ADMIN };
    await expect(
      controller.updateUserRole(userId, updateRoleDto),
    ).resolves.toEqual({
      message: 'User role updated successfully',
      user: mockUser,
    });
  });

  it('should handle error when updating a user role', async () => {
    const userId = 'mockUserId';
    const updateRoleDto: UpdateRoleDto = { role: UserRole.ADMIN };
    mockUserService.updateUserRole.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );
    await expect(
      controller.updateUserRole(userId, updateRoleDto),
    ).rejects.toThrow(NotFoundException);
  });
});
