import { Model } from 'mongoose';
import { EmailService } from './email.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { CreateUserDtoGoogle } from './dtos/create-user-google.dto';
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
      return await createdUser.save();
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        throw new ConflictException(
          'Duplicate value error: email or username already exists.',
        );
      }
      throw error;
    }
  }

  async createUserGoogle(
    createUserGoogleDto: CreateUserDtoGoogle,
  ): Promise<any> {
    if (!createUserGoogleDto.password) {
      delete createUserGoogleDto.password;
    }
    
    const createdUser = new this.userModel(createUserGoogleDto);
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
