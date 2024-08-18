import { Test, TestingModule } from '@nestjs/testing';
import { MicrosoftStrategy } from 'src/auth/strategies/microsoft.strategy';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Profile } from 'passport-microsoft';

describe('MicrosoftStrategy', () => {
  let microsoftStrategy: MicrosoftStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicrosoftStrategy,
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
                case 'MICROSOFT_CLIENT_ID':
                  return 'test-client-id';
                case 'MICROSOFT_CLIENT_SECRET':
                  return 'test-client-secret';
                case 'MICROSOFT_CALLBACK_URL':
                  return 'test-callback-url';
                default:
                  return '';
              }
            }),
          },
        },
      ],
    }).compile();

    microsoftStrategy = module.get<MicrosoftStrategy>(MicrosoftStrategy);
  });

  it('should validate and return user and token', async () => {
    const profile: Profile = {
      provider: 'microsoft',
      id: 'profile-id',
      displayName: 'Test User',
      emails: [{ value: 'test@example.com' }],
      _json: {},
      _raw: '',
    } as any;

    const done = jest.fn();

    await microsoftStrategy.validate(
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
