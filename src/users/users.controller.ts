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
import { UsersValidationPipe } from './pipes/users_validation.pipe'
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

  @Get('/:_id')
  async getUserById(@Param('_id', UsersValidationPipe) _id: string) {
    try {
      const user = await this.usersService.getUserById(_id);
      return user;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Delete('/:_id')
  async deleteUserById(
    @Param('_id', UsersValidationPipe) _id: string,
  ): Promise<void> {
    try {
      await this.usersService.deleteUserById(_id);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}

