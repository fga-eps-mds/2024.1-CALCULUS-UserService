import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create_user.dto';
import { User } from './interface/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { EmailService } from './email.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, username, password } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const createdUser = new this.userModel({
        name,
        email,
        username,
        password: hashedPassword,
      });

      const user = await createdUser.save();

      const token = crypto.randomBytes(32).toString('hex');

      user.verificationToken = token;
      await user.save();

      await this.emailService.sendVerificationEmail(user.email, token);

      return user;
    } catch (error) {
      if (error.code === 11000) {
        if (error.keyPattern && error.keyPattern.username) {
          throw new ConflictException(
            `Username '${username}' is already taken.`,
          );
        } else if (error.keyPattern && error.keyPattern.email) {
          throw new ConflictException(`Email '${email}' is already taken.`);
        } else {
          throw new ConflictException('Duplicate field value found.');
        }
      } else {
        throw error;
      }
    }
  }

  async verifyUser(token: string): Promise<User> {
    const user = await this.userModel.findOne({ verificationToken: token }).exec();
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
}
