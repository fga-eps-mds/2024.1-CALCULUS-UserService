import { Controller, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  Payload,
  Ctx,
  EventPattern,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { User } from './interface/user.interface';
import { log } from 'console';

const ackErrors: string[] = ['E11000'];

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @EventPattern('user-created')
  async createUser(@Payload() user: User, @Ctx() context: RmqContext) {
    this.logger.log(`Data: ${JSON.stringify(user)}`);
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      await this.usersService.createUser(user);
      return {
        message: 'User created successfully',
      };
    } catch (error) {
      this.logger.error(`Error: ${JSON.stringify(error)}`);

      const filterAckError = ackErrors.filter((ackError) =>
        error.message.includes(ackError),
      );

      if (filterAckError.length > 0) {
        this.logger.log(`Conflict Error: ${JSON.stringify(error)}`);
        throw new RpcException({
          statusCode: 409,
          message: 'User already exists',
        });
      }

      throw new RpcException({
        statusCode: 500,
        message: error.message,
      });
    } finally {
      this.logger.log('Acknowledging message');
      await channel.ack(message);
    }
  }

  @EventPattern('user-verify')
  async verifyUser(@Payload() token: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    this.logger.log(`Verify: ${JSON.stringify(token)}`);

    try {
      const user = await this.usersService.verifyUser(token);
      return {
        message: 'Account verified successfully',
      };
    } catch (error) {
      throw new RpcException({
        statusCode: 500,
        message: error.message,
      });
    } finally {
      this.logger.log('Acknowledging message');
      await channel.ack(message);
    }
  }

  // @UseGuards(JwtAuthGuard)
  @EventPattern('user-get-all')
  async getUsers(@Payload() payload: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    this.logger.log(`Get all: ${JSON.stringify(payload)}`);
    const users = await this.usersService.getUsers();
    await channel.ack(message);
    return users;
  }

  //@UseGuards(JwtAuthGuard)
  @EventPattern('user-get-by-id')
  async getUserById(@Payload() id: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    this.logger.log(`Get by id: ${JSON.stringify(id)}`);
    try {
      const user = await this.usersService.getUserById(id);
      return user;
    } catch (error) {
      throw error;
    } finally {
      this.logger.log('Acknowledging message');
      await channel.ack(message);
    }
  }

  // @UseGuards(JwtAuthGuard)
  @EventPattern('user-delete-by-id')
  async deleteUserById(@Payload() id: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    this.logger.log(`Delete by id: ${JSON.stringify(id)}`);
    try {
      await this.usersService.deleteUserById(id);
      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error: ${JSON.stringify(error)}`);
      throw error;
    } finally {
      this.logger.log('Acknowledging message');
      await channel.ack(message);
    }
  }
}
