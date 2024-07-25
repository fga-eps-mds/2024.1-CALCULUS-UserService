import {
  Controller,
  Get,
  Delete,
  NotFoundException,
  Param,
  Query,
  UseGuards,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { Payload, Ctx, EventPattern, RmqContext } from '@nestjs/microservices';
import { User } from './interface/user.interface';


@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @EventPattern('user-created')
  async createUser(@Payload() user: User, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    this.logger.log(`Data: ${JSON.stringify(user)}`);
    
    try {
      await this.usersService.createUser(user);
      return {message: 'User created successfully'};
    } catch (error) {
      return {
        
        message: error.message,
      }

      throw error;
    } finally {
      this.logger.log('Acknowledging message');
      await channel.ack(message);
    }
  }

  @EventPattern('user-verify')
  async verifyUser(@Payload() token: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    
    try{
      const user = await this.usersService.verifyUser(token);
      return {
        message: 'Account verified successfully',
      };
    } catch (error) {
      throw error;
    } finally {
      this.logger.log('Acknowledging message');
      await channel.ack(message);
    }
    
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
