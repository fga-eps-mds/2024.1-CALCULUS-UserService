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
    try {
      await this.usersService.createUser(createUserDto);
      return {
        message: 'User created successfully',
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

  @Get()
  async getUsers() {
    const users = await this.usersService.getUsers();
    return users;
  }

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

