// users.controller.ts
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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create_user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async createUser(@Body() createUserDto: CreateUserDto) {
    await this.usersService.createUser(createUserDto);
    return JSON.stringify({
      message: 'User created successfully',
    });
  }

  @Get()
  async getUsers() {
    const users = await this.usersService.getUsers();
    return users;
  }

  @Get('email')
  async getUserByEmail(@Query('email') email: string) {
    if (!email) {
      throw new NotFoundException('Email query parameter is required');
    }
    try {
      const user = await this.usersService.getUserByEmail(email);
      return user;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Delete()
  async deleteUser(@Query('email') email: string): Promise<void> {
    if (!email) {
      throw new NotFoundException('Email query parameter is required');
    }
    await this.usersService.deleteUser(email);
  }
}

