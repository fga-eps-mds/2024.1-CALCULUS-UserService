import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { User } from './interface/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailService } from './email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  async createUser(User: User): Promise<User> {
    const { name, email, username, password } = User;

    const createdUser = new this.userModel({
      name,
      email,
      username,
      password, 
    });

    return await createdUser.save();
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

  async deleteUserById(_id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}
