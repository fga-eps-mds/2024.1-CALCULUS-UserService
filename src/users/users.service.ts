import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dtos/create_user.dto';
import { User } from './interface/user.interface';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  private users: User[] = [];

  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  private readonly logger = new Logger(UsersService.name);
  
  async createUser(createUserDto: CreateUserDto): Promise<void> {
    this.create(createUserDto);
  }

  private async create(createUserDto: CreateUserDto): Promise<User> {

    const createdUser = new this.userModel(createUserDto)

    return await createdUser.save()
  }

  async getUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }
    return user;
  }

  async deleteUser(email: string): Promise<void> {
    const result = await this.userModel.deleteOne({ email }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }
  }

}

