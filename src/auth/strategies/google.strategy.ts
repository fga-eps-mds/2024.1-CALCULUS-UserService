import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    console.log('GoogleStrategy - Profile:', profile); // Log do profile para verificar os dados

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
