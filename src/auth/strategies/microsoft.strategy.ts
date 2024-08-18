import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-microsoft';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  private readonly logger = new Logger(MicrosoftStrategy.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.get<string>('MICROSOFT_CALLBACK_URL'),
      scope: ['user.read'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    this.logger.log('MicrosoftStrategy - Profile:', JSON.stringify(profile));
    const { user, token } = await this.authService.loginFederated({
      email: profile.emails[0].value,
      name: profile.displayName,
    });
    return done(null, {
      ...user.toObject(),
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    });
  }
}
