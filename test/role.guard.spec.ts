import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from 'src/users/dtos/user-role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(rolesGuard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if no roles are required', () => {
      const context = createMockExecutionContext({});
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should return false if the user does not have the required role', () => {
      const context = createMockExecutionContext({
        headers: { authorization: 'Bearer validToken' },
      });
      jest.spyOn(reflector, 'get').mockReturnValue([UserRole.ADMIN]);
      jest
        .spyOn(jwtService, 'decode')
        .mockReturnValue({ role: [UserRole.ALUNO] });

      expect(rolesGuard.canActivate(context)).toBe(false);
    });

    it('should return true if the user has the required role', () => {
      const context = createMockExecutionContext({
        headers: { authorization: 'Bearer validToken' },
      });
      jest.spyOn(reflector, 'get').mockReturnValue([UserRole.ADMIN]);
      jest
        .spyOn(jwtService, 'decode')
        .mockReturnValue({ role: [UserRole.ADMIN] });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });
});

function createMockExecutionContext(request: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => jest.fn(), 
  } as unknown as ExecutionContext;
}
