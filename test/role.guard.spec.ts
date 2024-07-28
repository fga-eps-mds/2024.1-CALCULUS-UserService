import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from 'src/users/dtos/user-role.enum';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(rolesGuard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if no roles are defined', () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest
            .fn()
            .mockReturnValue({ user: { role: UserRole.ALUNO } }),
        }),
        getHandler: jest.fn().mockReturnValue(null),
      } as unknown as ExecutionContext;

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true if user role is in required roles', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest
            .fn()
            .mockReturnValue({ user: { role: UserRole.ADMIN } }),
        }),
        getHandler: jest.fn().mockReturnValue(null),
      } as unknown as ExecutionContext;

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user role is not in required roles', () => {
      const requiredRoles = [UserRole.ADMIN];
      jest.spyOn(reflector, 'get').mockReturnValue(requiredRoles);

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest
            .fn()
            .mockReturnValue({ user: { role: UserRole.ALUNO } }),
        }),
        getHandler: jest.fn().mockReturnValue(null),
      } as unknown as ExecutionContext;

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
