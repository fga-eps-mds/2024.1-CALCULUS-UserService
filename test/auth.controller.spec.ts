import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    redirectFederated: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
          },
        },
        ConfigService, // Adicione qualquer outro serviço necessário aqui
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return a token if credentials are valid', async () => {
      const loginDto = { email: 'test@test.com', password: 'password' };
      const result = {
        accessToken: 'token',
        refreshToken: 'refresh-token',
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
      };

      jest
        .spyOn(authService, 'validateUser')
        .mockResolvedValue({ id: 1, ...loginDto });
      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(await authController.login(loginDto)).toBe(result);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto = { email: 'test@test.com', password: 'wrongpassword' };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(authController.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('googleAuthRedirect', () => {
    it('should handle Google auth redirect', async () => {
      const req = { user: { id: 1, email: 'test@test.com' } } as any;
      const res = { redirect: jest.fn() } as any;

      await authController.googleAuthRedirect(req, res);
      expect(authService.redirectFederated).toHaveBeenCalledWith(req.user, res);
    });
  });

  describe('microsoftAuthRedirect', () => {
    it('should handle Microsoft auth redirect', async () => {
      const req = { user: { id: 1, email: 'test@test.com' } } as any;
      const res = { redirect: jest.fn() } as any;

      await authController.microsoftAuthRedirect(req, res);
      expect(authService.redirectFederated).toHaveBeenCalledWith(req.user, res);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens', async () => {
      const refreshTokenDto = { refreshToken: 'refresh-token' };
      const result = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      };

      jest.spyOn(authService, 'refreshTokens').mockResolvedValue(result);

      expect(await authController.refreshTokens(refreshTokenDto)).toBe(result);
    });
  });

  describe('changePassword', () => {
    it('should change the password successfully', async () => {
      const changePasswordDto = {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      };
      const req = { userId: 1 } as any;

      jest.spyOn(authService, 'changePassword').mockResolvedValue(undefined); // Assuming no return value (void)

      await expect(
        authController.changePassword(changePasswordDto, req),
      ).resolves.toBeUndefined();
    });
  });

  describe('forgotPassword', () => {
    it('should handle forgot password request', async () => {
      const forgotPasswordDto = { email: 'test@test.com' };

      jest
        .spyOn(authService, 'forgotPassword')
        .mockResolvedValue({ message: 'Password reset link sent' });

      expect(await authController.forgotPassword(forgotPasswordDto)).toEqual({
        message: 'Password reset link sent',
      });

    });
  });

  describe('resetPassword', () => {
    it('should reset the password successfully', async () => {
      const resetPasswordDto = {
        resetToken: 'reset-token',
        newPassword: 'new-password',
      };

      jest
        .spyOn(authService, 'resetPassword')
        .mockResolvedValue({ message: 'Password has been reset' });

      expect(await authController.resetPassword(resetPasswordDto)).toEqual({
        message: 'Password has been reset',
      });
    });
  });
});
