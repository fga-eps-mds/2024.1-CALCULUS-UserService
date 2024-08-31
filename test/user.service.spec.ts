import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../src/users/users.service';
import { getModelToken } from '@nestjs/mongoose';
import { EmailService } from '../src/users/email.service';
import { Model, Types } from 'mongoose';
import { User } from '../src/users/interface/user.interface';
import { UserRole } from '../src/users/dtos/user-role.enum';
import { UpdateRoleDto } from '../src/users/dtos/update-role.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

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
    subscribedJourneys: [new Types.ObjectId(), new Types.ObjectId()],
    completedTrails: [new Types.ObjectId(), new Types.ObjectId()], 
    save: jest.fn().mockResolvedValue(this), 
  };

  const mockUserList = [
    mockUser,
    {
      _id: 'mockId2',
      name: 'Another Mock Name',
      email: 'another.mock@example.com',
      username: 'anotherMockUsername',
      password: 'anotherMockPassword',
      role: UserRole.ADMIN,
      verificationToken: 'anotherMockToken',
      isVerified: true,
      save: jest.fn().mockResolvedValue(this),
    },
  ];

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
      exec: jest.fn().mockResolvedValue(mockUserList),
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

  it('should get all users', async () => {
    const result = await service.getUsers();
    expect(result).toEqual(mockUserList);
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

  it('should add a journey to a user', async () => {
    const journeyId = new Types.ObjectId();
    const userWithJourney = { ...mockUser, journeys: [journeyId] };

    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    } as any);
    jest.spyOn(mockUser, 'save').mockResolvedValue(userWithJourney as any);

    const result = await service.addJourneyToUser(
      'mockId',
      journeyId.toHexString(),
    );

    expect(result.journeys).toContain(journeyId);
    expect(result.journeys.length).toBe(1);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if user is not found when adding a journey', async () => {
    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(
      service.addJourneyToUser('invalidId', 'mockJourneyId'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should add a journey to user subscribedJourneys if not already subscribed', async () => {
    const journeyId = new Types.ObjectId().toHexString();

    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    } as any);

    const result = await service.subscribeJourney('mockId', journeyId);

    expect(result.subscribedJourneys).toContainEqual(
      new Types.ObjectId(journeyId),
    );
    expect(result.subscribedJourneys.length).toBe(3);
    expect(result.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if user is not found when subscribing in a journey', async () => {
    const journeyId = new Types.ObjectId().toHexString();

    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(
      service.subscribeJourney('invalidId', journeyId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should unsubscribe user from a journey', async () => {
    const journeyId = new Types.ObjectId().toHexString();

    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    } as any);

    const result = await service.subscribeJourney('mockId', journeyId);

    expect(service.unsubscribeJourney('mockId', journeyId)).not.toContain(
      journeyId,
    );
    expect(result.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if user is not found when unsubscribing from a journey', async () => {
    const journeyId = new Types.ObjectId().toHexString();

    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(
      service.unsubscribeJourney('invalidId', journeyId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should get subscribed journeys of a user', async () => {
    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockUser),
    } as any);

    const result = await service.getSubscribedJourneys('mockId');
    expect(result).toEqual(mockUser.subscribedJourneys);
  });

  it('should throw NotFoundException if user is not found when getting subscribed journeys', async () => {
    jest.spyOn(model, 'findById').mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.getSubscribedJourneys('invalidId')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('UsersService - Trail Management', () => {
    it('should get completed trails for a user', async () => {
      jest.spyOn(model, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);
  
      const result = await service.getCompletedTrails('mockId');
      expect(result).toEqual(mockUser.completedTrails);
    });
  
    it('should throw NotFoundException if user is not found when getting completed trails', async () => {
      jest.spyOn(model, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
  
      await expect(service.getCompletedTrails('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  
    it('should mark a trail as completed for a user', async () => {
      const trailId = new Types.ObjectId().toHexString();
  
      jest.spyOn(model, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);
  
      const userWithCompletedTrail = {
        ...mockUser,
        completedTrails: [new Types.ObjectId(trailId)],
      };
  
      jest.spyOn(mockUser, 'save').mockResolvedValue(userWithCompletedTrail as any);
  
      const result = await service.completeTrail('mockId', trailId);
      expect(result.completedTrails).toContainEqual(new Types.ObjectId(trailId));
      expect(mockUser.save).toHaveBeenCalled();
    });
  
    it('should throw NotFoundException if user is not found when marking a trail as completed', async () => {
      jest.spyOn(model, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
  
      await expect(
        service.completeTrail('invalidId', new Types.ObjectId().toHexString()),
      ).rejects.toThrow(NotFoundException);
    });
  
    it('should throw ConflictException if trail is already completed by the user', async () => {
      const trailId = new Types.ObjectId().toHexString();
  
      const userWithCompletedTrail = {
        ...mockUser,
        completedTrails: [new Types.ObjectId(trailId)],
      };
  
      jest.spyOn(model, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(userWithCompletedTrail),
      } as any);
  
      await expect(service.completeTrail('mockId', trailId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
