import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'; 
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSchema } from './interface/user.schema';
import { EmailService } from './email.service';
import { RefreshTokenSchema } from './interface/refresh-token.schema';
import { ResetTokenSchema } from './interface/reset-token.schema';
import { AuthService } from 'src/auth/auth.service'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema },
      { name: 'ResetToken', schema: ResetTokenSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: {
        expiresIn: '60m',
      },
    }), // Registrar JwtModule
  ],
  controllers: [UsersController],
  providers: [UsersService, EmailService, AuthService],
  exports: [UsersService],
})
export class UsersModule {}
