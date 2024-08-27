import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/users/dtos/user-role.enum';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UpdateRoleDto } from 'src/users/dtos/update-role.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service'; // Import AuthService
import { JwtService } from '@nestjs/jwt'; // Import JwtService

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
    addJourneyToUser: jest.fn().mockResolvedValue(mockUser),
    subscribeJourney: jest.fn().mockResolvedValue(mockUser),
    unsubscribeJourney: jest.fn().mockResolvedValue(mockUser),
    getUserById: jest.fn().mockResolvedValue(mockUser),
    deleteUserById: jest.fn().mockResolvedValue(undefined),
    updateUserRole: jest.fn().mockResolvedValue(mockUser),
  };

  const mockAuthService = {}; // Mock any methods you use from AuthService
  const mockJwtService = {}; // Mock any methods you use from JwtService

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
      username: ''
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

  it('should add a journey to a user', async () => {
    const userId = 'mockUserId';
    const journeyId = 'mockJourneyId';
    const body = { journeyId };
    await expect(controller.addJourneyToUser(userId, body)).resolves.toEqual(
      mockUser,
    );
  });

  it('should subscribe a journey for a user', async () => {
    const userId = 'mockUserId';
    const journeyId = 'mockJourneyId';
    await expect(
      controller.subscribeJourney(userId, journeyId),
    ).resolves.toEqual(mockUser);
  });

  it('should unsubscribe a journey for a user', async () => {
    const userId = 'mockUserId';
    const journeyId = 'mockJourneyId';
    await expect(
      controller.unsubscribeJourney(userId, journeyId),
    ).resolves.toEqual(mockUser);
  });

  it('should get a user by ID', async () => {
    const userId = 'mockUserId';
    await expect(controller.getUserById(userId)).resolves.toEqual(mockUser);
  });

  it('should delete a user by ID', async () => {
    const userId = 'mockUserId';
    await expect(controller.deleteUserById(userId)).resolves.toBeUndefined();
  });

  it('should update user role', async () => {
    const userId = 'mockUserId';
    const updateRoleDto: UpdateRoleDto = { role: UserRole.ADMIN };
    await expect(
      controller.updateUserRole(userId, updateRoleDto),
    ).resolves.toEqual({
      message: 'User role updated successfully',
      user: mockUser,
    });
  });
});
