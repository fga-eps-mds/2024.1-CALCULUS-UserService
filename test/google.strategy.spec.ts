import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { Profile } from 'passport-google-oauth20';
import { GoogleStrategy } from 'src/auth/strategies/google.strategy';
import { AuthService } from 'src/auth/auth.service';

describe('GoogleStrategy', () => {
  let googleStrategy: GoogleStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {
            loginFederated: jest.fn().mockResolvedValue({
              user: { toObject: () => ({ id: '123', email: 'test@example.com', name: 'Test User' }) },
              token: { accessToken: 'access-token', refreshToken: 'refresh-token' },
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'GOOGLE_CLIENT_ID':
                  return 'test-client-id';
                case 'GOOGLE_CLIENT_SECRET':
                  return 'test-client-secret';
                case 'GOOGLE_CALLBACK_URL':
                  return 'test-callback-url';
                default:
                  return '';
              }
            }),
          },
        },
      ],
    }).compile();

    googleStrategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should validate and return user and token', async () => {
    const profile: Profile = {
      provider: 'google',
      id: 'profile-id',
      displayName: 'Test User',
      emails: [{ value: 'test@example.com' }],
      _json: {},
      _raw: '',
    } as any;

    const done = jest.fn();

    await googleStrategy.validate(
      'access-token',
      'refresh-token',
      profile,
      done,
    );

    expect(done).toHaveBeenCalledWith(null, {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
