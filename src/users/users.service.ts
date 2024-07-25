import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { User } from './interface/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailService } from './email.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  async createUser(User: User): Promise<void> {
    try {
      const createdUser = new this.userModel(User);
      this.logger.log(`Created User: ${JSON.stringify(createdUser)}`);
      await createdUser.save();
      // await this.emailService.sendVerificationEmail(createdUser.email, createdUser.verificationToken)
    } catch (error) {
      throw error;
    }
  }

  async verifyUser(token: string): Promise<User> {
    const user = await this.userModel
      .findOne({ verificationToken: token })
      .exec();
    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'Invalid verification token',
      });
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
      throw new RpcException({
        statusCode: 404,
        message: `User with ID '${_id}' not found`,
      });
    }
    return user;
  }

  async deleteUserById(_id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id }).exec();
    if (result.deletedCount === 0) {
      throw new RpcException({
        statusCode: 404,
        message: `User with ID '${_id}' not found`,
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}
