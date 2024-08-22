import { Model, Types } from 'mongoose';
import { EmailService } from './email.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { CreateUserDtoFederated } from './dtos/create-user-federated.dto';
import { User } from './interface/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MongoError } from 'mongodb';
import { UserRole } from './dtos/user-role.enum';
import { UpdateRoleDto } from './dtos/update-role.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, username, password, role } = createUserDto;
    const createdUser = new this.userModel({
      name,
      email,
      username,
      password,
      role: role || UserRole.ALUNO,
    });

    try {
      const user = await createdUser.save();
      await this.emailService.sendVerificationEmail(email);
      return user;
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        throw new ConflictException(
          'Duplicate value error: email or username already exists.',
        );
      }
      throw error;
    }
  }

  async createFederatedUser(
    createFederatedUserDto: CreateUserDtoFederated,
  ): Promise<any> {
    if (!createFederatedUserDto.password) {
      delete createFederatedUserDto.password;
    }

    const createdUser = new this.userModel(createFederatedUserDto);
    return createdUser.save();
  }

  async verifyUser(token: string): Promise<User> {
    const user = await this.userModel
      .findOne({ verificationToken: token })
      .exec();
    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }
    user.verificationToken = undefined;
    user.isVerified = true;
    await user.save();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async getUserById(_id: string): Promise<User> {
    const user = await this.userModel.findById(_id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }
    return user;
  }

  async addJourneyToUser(userId: string, journeyId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const objectId = new Types.ObjectId(journeyId);

    if (!user.journeys) {
      user.journeys = [];
    }

    if (!user.journeys.includes(objectId)) {
      user.journeys.push(objectId);
    }

    return user.save();
  }
  async deleteUserById(_id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }
  }

  async subscribeJourney(userId: string, journeyId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const objectId = new Types.ObjectId(journeyId);

    if (!user.subscribedJourneys) {
      user.subscribedJourneys = [];
    }

    if (!user.subscribedJourneys.includes(objectId)) {
      user.subscribedJourneys.push(objectId);
    }

    return user.save();
  }

  async unsubscribeJourney(userId: string, journeyId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const objectId = new Types.ObjectId(journeyId);

    if (user.subscribedJourneys) {
      user.subscribedJourneys = user.subscribedJourneys.filter(
        (id) => !id.equals(objectId),
      );
    }

    return user.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateUserRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<User> {
    const { role } = updateRoleDto;
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    user.role = role;
    await user.save();
    return user;
  }
}
