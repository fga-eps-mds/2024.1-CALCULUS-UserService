// users.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create_user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
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

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    try {
      const user = await this.usersService.getUserByEmail(email);
      return user;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}

