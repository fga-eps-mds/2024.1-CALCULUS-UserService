import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-microsoft';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
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
    console.log('MicrosoftStrategy - Profile:', profile);

    const email = profile.emails[0].value;
    const name = profile.displayName;

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.createUserGoogle({
        name,
        email,
        username: email,
        password: '', 
      });
    }

    const payload = { email: user.email, sub: user._id };
    const token = this.authService.getJwtService().sign(payload);

    return done(null, { ...user.toObject(), access_token: token });
  }
}
