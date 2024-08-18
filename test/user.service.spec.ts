import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/users/users.service';
import { getModelToken } from '@nestjs/mongoose';
import { EmailService } from '../src/users/email.service';
import { Model } from 'mongoose';
import { User } from '../src/users/interface/user.interface';
import { UserRole } from '../src/users/dtos/user-role.enum';
import { UpdateRoleDto } from '../src/users/dtos/update-role.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;

  const mockUser = {
    _id: 'mockId',
    name: 'Mock Name',
    email: 'mock@example.com',
    username: 'mockUsername',
    password: 'mockPassword',
    role: UserRole.ALUNO,
    verificationToken: 'mockToken',
    isVerified: false,
    save: jest.fn().mockResolvedValue(this), // Mock da instância
  };

  const mockUpdateRoleDto: UpdateRoleDto = {
    role: UserRole.ADMIN,
  };

  const mockUserModel = {
    create: jest.fn().mockResolvedValue(mockUser),
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    }),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    }),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([mockUser]),
    }),
    deleteOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    }),
    new: jest.fn(() => mockUser),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken('User'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should verify a user', async () => {
    const result = await service.verifyUser('mockToken');
    expect(result).toEqual(mockUser);
    expect(result.isVerified).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if user is not found during verification', async () => {
    jest.spyOn(model, 'findOne').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.verifyUser('invalidToken')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return the user if found by ID', async () => {
    const result = await service.getUserById('mockId');
    expect(result).toEqual(mockUser);
  });

  it('should throw NotFoundException if user is not found by ID', async () => {
    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.getUserById('invalidId')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete a user by ID', async () => {
    await service.deleteUserById('mockId');
    expect(model.deleteOne).toHaveBeenCalledWith({ _id: 'mockId' });
  });

  it('should throw NotFoundException if user to delete is not found', async () => {
    jest.spyOn(model, 'deleteOne').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    } as any);

    await expect(service.deleteUserById('invalidId')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should find user by email', async () => {
    const result = await service.findByEmail('mock@example.com');
    expect(result).toEqual(mockUser);
  });

  it('should find user by ID', async () => {
    const result = await service.findById('mockId');
    expect(result).toEqual(mockUser);
  });

  it('should update user role', async () => {
    const result = await service.updateUserRole('mockId', mockUpdateRoleDto);
    expect(result).toEqual({ ...mockUser, role: UserRole.ADMIN });
  });

  it('should throw NotFoundException if user to update role is not found', async () => {
    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(
      service.updateUserRole('invalidId', mockUpdateRoleDto),
    ).rejects.toThrow(NotFoundException);
  });
});
