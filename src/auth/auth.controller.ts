import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/users/dtos/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.log('AuthController - Login Request:', loginDto);

    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    this.logger.log(
      `front url: ${this.configService.get<string>('FRONTEND_URL')}`,
    );
    this.logger.log('AuthController - Google Auth Initiated');
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    this.logger.log(
      `front url: ${this.configService.get<string>('FRONTEND_URL')}`,
    );
    this.logger.log('AuthController - Google Callback Request:', req.user);

    const user = req.user as any;
    const { access_token } = user || {};

    if (access_token) {
      res.redirect(`http://localhost:3000?token=${access_token}`);
    } else {
      res.redirect('http://localhost:3000/login');
    }
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    this.logger.log(
      `front url: ${this.configService.get<string>('FRONTEND_URL')}`,
    );
    this.logger.log('AuthController - Microsoft Auth Initiated');
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  microsoftAuthRedirect(@Req() req: Request, @Res() res: Response) {
    this.logger.log(
      'AuthController - Microsoft Callback Request:',
      JSON.stringify(req.user),
    );

    const user = req.user as any;
    const { access_token } = user || {};

    if (access_token) {
      res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/oauth?token=${access_token}`,
      );
    } else {
      res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/cadastro`,
      );
    }
  }
}
