import { Test, TestingModule } from '@nestjs/testing';

import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { AuthService } from 'src/auth/auth.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if no token is found', async () => {
    const context = createMockExecutionContext({
      headers: { authorization: '' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token not found'),
    );
  });

  it('should throw UnauthorizedException if token is invalid', async () => {
    const context = createMockExecutionContext({
      headers: { authorization: 'Bearer invalid-token' },
    });

    jwtService.verify = jest.fn().mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('should set userId on the request if token is valid', async () => {
    const context = createMockExecutionContext({
      headers: { authorization: 'Bearer valid-token' },
    });

    jwtService.verify = jest.fn().mockReturnValue({ userId: 'user-id' });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect((context.switchToHttp().getRequest() as any).userId).toBe('user-id');
  });

  function createMockExecutionContext(request: Partial<Request>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request as Request,
      }),
    } as any;
  }
});
