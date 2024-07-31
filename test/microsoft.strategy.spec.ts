import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Profile, VerifyCallback } from 'passport-microsoft';
import { JwtService } from '@nestjs/jwt';
import { MicrosoftStrategy } from 'src/auth/strategies/microsoft.strategy';
import { AuthService } from 'src/auth/auth.service';

describe('MicrosoftStrategy', () => {
  let microsoftStrategy: MicrosoftStrategy;
  let usersService: UsersService;
  let authService: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicrosoftStrategy,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            createUserGoogle: jest.fn(), // Ajuste conforme o método da estratégia do Microsoft
          },
        },
        {
          provide: AuthService,
          useValue: {
            getJwtService: jest.fn().mockReturnValue({
              sign: jest.fn(),
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'MICROSOFT_CLIENT_ID':
                  return 'test-client-id';
                case 'MICROSOFT_CLIENT_SECRET':
                  return 'test-client-secret';
                case 'MICROSOFT_CALLBACK_URL':
                  return 'http://localhost:3000/auth/microsoft/callback';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    microsoftStrategy = module.get<MicrosoftStrategy>(MicrosoftStrategy);
    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validate', () => {
    it('should validate user and return user with accessToken', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const profile: Profile = {
        emails: [{ value: email }],
        displayName: name,
      } as unknown as Profile;
      const accessToken = 'jwt-token';
      const user = {
        _id: 'user-id',
        name,
        email,
        role: 'user',
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          name,
          email,
          role: 'user',
        }),
      };
      const done: VerifyCallback = jest.fn();

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(user as any);
      jest
        .spyOn(usersService, 'createUserGoogle')
        .mockResolvedValue(user as any);
      jest
        .spyOn(authService.getJwtService(), 'sign')
        .mockReturnValue(accessToken);

      await microsoftStrategy.validate(
        'accessToken',
        'refreshToken',
        profile,
        done,
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.createUserGoogle).not.toHaveBeenCalled(); // Ajuste conforme o método da estratégia do Microsoft
      expect(authService.getJwtService().sign).toHaveBeenCalledWith({
        id: user._id,
        name: user.name,
        email: user.email,
        sub: user._id,
        role: user.role,
      });
      expect(done).toHaveBeenCalledWith(null, {
        ...user.toObject(),
        accessToken,
      });
    });

    it('should create a new user if the user does not exist', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const profile: Profile = {
        emails: [{ value: email }],
        displayName: name,
      } as unknown as Profile;
      const accessToken = 'jwt-token';
      const user = {
        _id: 'user-id',
        name,
        email,
        role: 'user',
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          name,
          email,
          role: 'user',
        }),
      };
      const done: VerifyCallback = jest.fn();

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(usersService, 'createUserGoogle')
        .mockResolvedValue(user as any);
      jest
        .spyOn(authService.getJwtService(), 'sign')
        .mockReturnValue(accessToken);

      await microsoftStrategy.validate(
        'accessToken',
        'refreshToken',
        profile,
        done,
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.createUserGoogle).toHaveBeenCalledWith({
        name,
        email,
        username: email,
        password: '',
      });
      expect(authService.getJwtService().sign).toHaveBeenCalledWith({
        id: user._id,
        name: user.name,
        email: user.email,
        sub: user._id,
        role: user.role,
      });
      expect(done).toHaveBeenCalledWith(null, {
        ...user.toObject(),
        accessToken,
      });
    });
  });
});
