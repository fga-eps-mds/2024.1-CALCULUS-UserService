import {
  Controller,
  Post,
  Get,
  Body,
  NotFoundException,
  Param,
  UsePipes,
  ValidationPipe,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserRole } from './dtos/user-role.enum';
import { Roles } from 'src/auth/guards/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { Types } from 'mongoose';

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

  @Get(':userId/subscribedJourneys')
  async getSubscribedJourneys(
    @Param('userId') userId: string,
  ): Promise<Types.ObjectId[]> {
    return await this.usersService.getSubscribedJourneys(userId);
  }

  @Get(':userId/completedTrails')
  async getCompletedTrails(
    @Param('userId') userId: string,
  ): Promise<Types.ObjectId[]> {
    return await this.usersService.getCompletedTrails(userId);
  }

  @Get()
  async getUsers() {
    return await this.usersService.getUsers();
  }

  @Patch(':id/add-point')
  async addPointToUser(
    @Param('id') id: string,
    @Body() body: { pointId: string },
  ) {
    try {
      return await this.usersService.addPointToUser(id, body.pointId);
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/subscribe/:journeyId')
  async subscribeJourney(
    @Param('userId') userId: string,
    @Param('journeyId') journeyId: string,
  ) {
    return this.usersService.subscribeJourney(userId, journeyId);
  }


  @UseGuards(JwtAuthGuard)
  @Delete(':userId/unsubscribe/:journeyId')
  async unsubscribeJourney(
    @Param('userId') userId: string,
    @Param('journeyId') journeyId: string,
  ) {
    return this.usersService.unsubscribeJourney(userId, journeyId);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post(':userId/complete/:trailId')
  async completeTrail(
    @Param('userId') userId: string,
    @Param('trailId') trailId: string,
  ) {
    return this.usersService.completeTrail(userId, trailId);
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    try {
      return await this.usersService.getUserById(id);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    try {
      const updatedUser = await this.usersService.updateUserRole(
        id,
        updateRoleDto,
      );
      return {
        message: 'User role updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
