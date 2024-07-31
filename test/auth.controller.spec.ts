import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from 'src/users/dtos/login.dto';
import { Request, Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { AuthController } from 'src/auth/auth.controller';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);

    // Defina as variáveis de ambiente para os testes
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  describe('login', () => {
    it('should return a token if credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const user = { id: 'user-id', email: 'test@example.com' };
      const token = 'token';
      authService.validateUser = jest.fn().mockResolvedValue(user);
      authService.login = jest.fn().mockResolvedValue({ access_token: token });

      const result = await authController.login(loginDto);

      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual({ access_token: token });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      authService.validateUser = jest.fn().mockResolvedValue(null);

      await expect(authController.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('googleAuth', () => {
    it('should log initiation of Google auth', async () => {
      const logSpy = jest.spyOn(authController['logger'], 'log');
      const frontendUrl = process.env.FRONTEND_URL;
      configService.get = jest.fn().mockReturnValue(frontendUrl);

      await authController.googleAuth();

      expect(logSpy).toHaveBeenCalledWith(`front url: ${frontendUrl}`);
      expect(logSpy).toHaveBeenCalledWith(
        'AuthController - Google Auth Initiated',
      );
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect to OAuth URL if accessToken is present', () => {
      const req = { user: { accessToken: 'token' } } as unknown as Request;
      const res = { redirect: jest.fn() } as unknown as Response;
      const frontendUrl = process.env.FRONTEND_URL;
      configService.get = jest.fn().mockReturnValue(frontendUrl);
      const logSpy = jest.spyOn(authController['logger'], 'log');

      authController.googleAuthRedirect(req, res);

      expect(logSpy).toHaveBeenCalledWith(`front url: ${frontendUrl}`);
      expect(logSpy).toHaveBeenCalledWith(
        'AuthController - Google Callback Request:',
        req.user,
      );
      expect(res.redirect).toHaveBeenCalledWith(`${frontendUrl}/login`);
    });

    it('should redirect to registration URL if accessToken is not present', () => {
      const req = { user: {} } as Request;
      const res = { redirect: jest.fn() } as unknown as Response;
      const frontendUrl = process.env.FRONTEND_URL;
      configService.get = jest.fn().mockReturnValue(frontendUrl);
      const logSpy = jest.spyOn(authController['logger'], 'log');

      authController.googleAuthRedirect(req, res);

      expect(logSpy).toHaveBeenCalledWith(`front url: ${frontendUrl}`);
      expect(logSpy).toHaveBeenCalledWith(
        'AuthController - Google Callback Request:',
        req.user,
      );
      expect(res.redirect).toHaveBeenCalledWith(`${frontendUrl}/login`);
    });
  });

  describe('microsoftAuth', () => {
    it('should log initiation of Microsoft auth', async () => {
      const logSpy = jest.spyOn(authController['logger'], 'log');
      const frontendUrl = process.env.FRONTEND_URL;
      configService.get = jest.fn().mockReturnValue(frontendUrl);

      await authController.microsoftAuth();

      expect(logSpy).toHaveBeenCalledWith(`front url: ${frontendUrl}`);
      expect(logSpy).toHaveBeenCalledWith(
        'AuthController - Microsoft Auth Initiated',
      );
    });
  });

  describe('microsoftAuthRedirect', () => {
    it('should redirect to OAuth URL if accessToken is present', () => {
      const req = { user: { accessToken: 'token' } } as unknown as Request;
      const res = { redirect: jest.fn() } as unknown as Response;
      const frontendUrl = process.env.FRONTEND_URL;
      configService.get = jest.fn().mockReturnValue(frontendUrl);
      const logSpy = jest.spyOn(authController['logger'], 'log');

      authController.microsoftAuthRedirect(req, res);

      expect(logSpy).toHaveBeenCalledWith(
        'AuthController - Microsoft Callback Request:',
        JSON.stringify(req.user),
      );
      expect(res.redirect).toHaveBeenCalledWith(`${frontendUrl}/cadastro`);
    });

    it('should redirect to registration URL if accessToken is not present', () => {
      const req = { user: {} } as Request;
      const res = { redirect: jest.fn() } as unknown as Response;
      const frontendUrl = process.env.FRONTEND_URL;
      configService.get = jest.fn().mockReturnValue(frontendUrl);
      const logSpy = jest.spyOn(authController['logger'], 'log');

      authController.microsoftAuthRedirect(req, res);

      expect(logSpy).toHaveBeenCalledWith(
        'AuthController - Microsoft Callback Request:',
        JSON.stringify(req.user),
      );
      expect(res.redirect).toHaveBeenCalledWith(`${frontendUrl}/cadastro`);
    });
  });
});
