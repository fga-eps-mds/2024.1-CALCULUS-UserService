import {
  Controller,
  Get,
  Delete,
  NotFoundException,
  Param,
  UsePipes,
  ValidationPipe,
  Query,
  ConflictException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { Payload, Ctx, EventPattern, RmqContext } from '@nestjs/microservices';
import { User } from './interface/user.interface';

const ackErrors: string[] = ['E11000']

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @EventPattern('user-created')
  async createUser(@Payload() user: User, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    this.logger.log(`User created: ${JSON.stringify(user)}`);
    
    try {
      await this.usersService.createUser(user);
      await channel.ack(message);
      return {
        message: 'User created successfully. Please verify your email.',
      };
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);

      const filterAckError = ackErrors.filter(ackError => error.message.includes(ackError))

        if (filterAckError.length > 0) {
          await channel.ack(message)
        }
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
