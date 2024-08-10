import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from 'src/users/interface/refresh-token.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/interface/user.interface';
import { nanoid } from 'nanoid';
import { EmailService } from 'src/users/email.service';
import { ResetToken } from 'src/users/interface/reset-token.schema';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel(ResetToken.name)
    private ResetTokenModel: Model<ResetToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  getJwtService() {
    return this.jwtService;
  }

  async login(user: any) {
    const tokens = await this.generateTokens({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      ...tokens,
    };
  }

  async loginFederated({ email, name }: { email: string; name: string }) {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createFederatedUser({
        name,
        email,
        username: email,
        password: '',
      });
    }
    const token = await this.generateTokens({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async generateTokens({ id, name, email, role }) {
    const payload = {
      id: id,
      name: name,
      email: email,
      sub: id,
      role: role,
    };
    const accessToken = this.jwtService.sign(
      { id, ...payload },
      { expiresIn: '10h' },
    );

    const refreshToken = uuidv4();
    await this.storeRefreshToken(refreshToken, id);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.RefreshTokenModel.updateOne(
      { userId },
      { $set: { expiryDate, token } },
      { upsert: true },
    );
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });
    const id = token.userId.toString();
    if (!token) {
      throw new UnauthorizedException('Refresh Token is invalid');
    }
    const user = await this.usersService.findById(token.userId.toString());

    return this.generateTokens({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  async changePassword(userId, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found...');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    user.password = newPassword;
    await user.save();
  }

  redirectFederated(user: any, res: Response) {
    this.logger.log('redirectFederated', user);
    const { accessToken, refreshToken } = user || {};

    if (accessToken) {
      res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/oauth?token=${accessToken}&refresh=${refreshToken}`,
      );
    } else {
      res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/cadastro`,
      );
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    if (user) {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const resetToken = nanoid(64);
      await this.ResetTokenModel.create({
        token: resetToken,
        userId: user._id,
        expiryDate,
      });
      this.emailService.sendPasswordResetEmail(email, resetToken);
    }

    return { message: 'If this user exists, they will receive an email' };
  }

  async resetPassword(newPassword: string, resetToken: string) {
    const token = await this.ResetTokenModel.findOneAndDelete({
      token: resetToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid link');
    }

    const user = await this.userModel.findById(token.userId);
    if (!user) {
      throw new InternalServerErrorException();
    }

    user.password = newPassword;
    await user.save();
  }
}
