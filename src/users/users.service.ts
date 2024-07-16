import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create_user.dto';
import { User } from './interface/user.interface';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Error as MongooseError } from 'mongoose';

@Injectable()
export class UsersService {
  private users: User[] = [];

  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  private readonly logger = new Logger(UsersService.name);

  //CREATE USER
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

      return await createdUser.save();
    } catch (error) {
      if (error.code === 11000) {
        if (error.keyPattern && error.keyPattern.username) {
          throw new ConflictException(
            `Username '${username}' is already taken.`,
          );
        } else if (error.keyPattern && error.keyPattern.name) {
          throw new ConflictException(`Name '${name}' is already taken.`);
        } else {
          throw new ConflictException('Duplicate field value found.');
        }
      } else {
        throw error; 
      }
    }
  }
  
  //GET ALL USERS
  async getUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  //GET  USER BY ID
  async getUserById(_id: string): Promise<User> {
    const user = await this.userModel.findById(_id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }
    return user;
  }
  //DELETE  USER BY ID
  async deleteUserById(_id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID '${_id}' not found`);
    }
  }
}

