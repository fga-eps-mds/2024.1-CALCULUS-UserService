import { Controller, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/users/dtos/login.dto';
import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { User } from 'src/users/interface/user.interface';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @EventPattern('login')
  async login(@Payload() user: User, @Ctx() context: RmqContext) {
    this.logger.log(`Data: ${JSON.stringify(user)}`);
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      const userValidated = await this.authService.validateUser(
        user.email,
        user.password,
      );
      if (!user) {
        throw new RpcException({
          statusCode: 401,
          message: 'Invalid credentials',
        });
      }
      return this.authService.login(userValidated);
    } catch (error) {
      throw error;
    } finally {
      channel.ack(message);
    }
  }
}
