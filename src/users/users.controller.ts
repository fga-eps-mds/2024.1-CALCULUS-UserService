import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  NotFoundException,
  Param,
  UsePipes,
  ValidationPipe,
  Query,
  ConflictException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  @UsePipes(ValidationPipe)
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      await this.usersService.createUser(createUserDto);
      return {
        message: 'User created successfully. Please verify your email.',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({
          message: error.message,
          error: 'Conflict',
          statusCode: 409,
        });
      }
      throw error; 
    }
  }
  @Get('verify')
  async verifyUser(@Query('token') token: string) {
    const user = await this.usersService.verifyUser(token);
    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }
    return {
      message: 'Account verified successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers() {
    const users = await this.usersService.getUsers();
    return users;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.usersService.getUserById(id);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteUserById(@Param('id') id: string): Promise<void> {
    try {
      await this.usersService.deleteUserById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error; 
    }
  }
}