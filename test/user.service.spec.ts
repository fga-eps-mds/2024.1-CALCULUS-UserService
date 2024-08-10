import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from 'src/users/users.service';
import { EmailService } from 'src/users/email.service';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { UserRole } from 'src/users/dtos/user-role.enum';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDtoFederated } from 'src/users/dtos/create-user-federated.dto';

interface MockUserModel {
  mockReturnValue(createdUser: {
    save: jest.Mock<any, any, any>;
    name: string;
    email: string;
    username: string;
    password: string;
    role?: UserRole;
    _id: string;
  }): unknown;

  mockImplementation(arg0: () => never): unknown;
  save: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  deleteOne: jest.Mock;
  findOne: jest.Mock;
  exec: jest.Mock;
}

const mockUserModel = () => ({
  save: jest.fn(),
  find: jest.fn().mockReturnThis(), // Mock para a cadeia de chamadas
  findById: jest.fn().mockReturnThis(), // Mock para a cadeia de chamadas
  deleteOne: jest.fn().mockReturnThis(), // Mock para a cadeia de chamadas
  findOne: jest.fn().mockReturnThis(), // Mock para a cadeia de chamadas
  exec: jest.fn(), // Para ser usado em métodos como find, findById
});

describe('UsersService', () => {
  let usersService: UsersService;
  let userModel: MockUserModel;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        EmailService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel(),
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
    userModel = module.get(getModelToken('User')) as MockUserModel;
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('createUser', () => {
    it('should throw ConflictException if user already exists', async () => {
      userModel.save.mockRejectedValue({ code: 11000 }); // Simula erro de duplicado

      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'password',
        role: UserRole.ALUNO,
      };

      await expect(usersService.createUser(createUserDto)).rejects.toThrow(
        new ConflictException('this.userModel is not a constructor'),
      );
    });
  });

  describe('verifyUser', () => {
    it('should verify a user and update the verification status', async () => {
      const token = 'valid-token';
      const user = {
        _id: 'some-id',
        verificationToken: token,
        isVerified: false,
        save: jest.fn(),
      };
      userModel.findOne.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(user);

      const result = await usersService.verifyUser(token);

      expect(result).toEqual(user);
      expect(user.verificationToken).toBeUndefined();
      expect(user.isVerified).toBe(true);
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if token is invalid', async () => {
      userModel.findOne.mockReturnValue(userModel);
      userModel.exec.mockResolvedValue(null);

      await expect(usersService.verifyUser('invalid-token')).rejects.toThrow(
        new NotFoundException('Invalid verification token'),
      );
    });
  });

  describe('createFederatedUser', () => {
    it('should throw ConflictException if user already exists', async () => {
      const createFederatedUserDto: CreateUserDtoFederated = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        username: 'john_doe',
      };

      await expect(
        usersService.createFederatedUser(createFederatedUserDto),
      ).rejects.toThrow(
        new ConflictException('this.userModel is not a constructor'),
      );
    });
  });

  describe('verifyUser', () => {
    it('should throw NotFoundException if token is invalid', async () => {
      userModel.findOne.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(null);

      await expect(usersService.verifyUser('invalid-token')).rejects.toThrow(
        new NotFoundException('Invalid verification token'),
      );
    });
  });

  describe('getUsers', () => {
    it('should return an array of users', async () => {
      const users = [{ _id: 'some-id', name: 'John Doe' }];
      userModel.find.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(users);

      const result = await usersService.getUsers();

      expect(result).toEqual(users);
      expect(userModel.find).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const userId = 'some-id';
      const user = { _id: userId, name: 'John Doe' };
      userModel.findById.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(user);

      const result = await usersService.getUserById(userId);

      expect(result).toEqual(user);
      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findById.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(null);

      await expect(usersService.getUserById('invalid-id')).rejects.toThrow(
        new NotFoundException(`User with ID 'invalid-id' not found`),
      );
    });
  });

  describe('updateUserRole', () => {
    it("should update a user's role", async () => {
      const userId = 'some-id';
      const updateRoleDto = { role: UserRole.ADMIN };
      const user = { _id: userId, role: UserRole.ALUNO, save: jest.fn() };
      userModel.findById.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(user);

      const result = await usersService.updateUserRole(userId, updateRoleDto);

      expect(result).toEqual(user);
      expect(user.role).toBe(updateRoleDto.role);
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findById.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(null);

      await expect(
        usersService.updateUserRole('invalid-id', { role: UserRole.ADMIN }),
      ).rejects.toThrow(
        new NotFoundException(`User with ID 'invalid-id' not found`),
      );
    });
  });

  describe('deleteUserById', () => {
    it('should delete a user by id', async () => {
      const userId = 'some-id';
      userModel.deleteOne.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue({ deletedCount: 1 });

      await usersService.deleteUserById(userId);

      expect(userModel.deleteOne).toHaveBeenCalledWith({ _id: userId });
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.deleteOne.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue({ deletedCount: 0 });

      await expect(usersService.deleteUserById('invalid-id')).rejects.toThrow(
        new NotFoundException(`User with ID 'invalid-id' not found`),
      );
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'john.doe@example.com';
      const user = { _id: 'some-id', email };
      userModel.findOne.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(user);

      const result = await usersService.findByEmail(email);

      expect(result).toEqual(user);
      expect(userModel.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const userId = 'some-id';
      const user = { _id: userId, name: 'John Doe' };
      userModel.findById.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(user);

      const result = await usersService.findById(userId);

      expect(result).toEqual(user);
      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateUserRole', () => {
    it('should throw NotFoundException if user not found', async () => {
      userModel.findById.mockReturnValue(userModel); // chainable
      userModel.exec.mockResolvedValue(null);

      await expect(
        usersService.updateUserRole('invalid-id', { role: UserRole.ADMIN }),
      ).rejects.toThrow(
        new NotFoundException(`User with ID 'invalid-id' not found`),
      );
    });
  });
});
