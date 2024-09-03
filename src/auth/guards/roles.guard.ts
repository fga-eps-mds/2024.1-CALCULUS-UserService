/* eslint-disable prettier/prettier */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/users/dtos/user-role.enum';
import { IncomingHttpHeaders } from 'http';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const user = this.jwtService.decode(token);

    if (!user.role.includes(UserRole.ADMIN)) {
      return false;
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const headers = request.headers as unknown as IncomingHttpHeaders;
    return headers.authorization?.split(' ')[1];
  }
}
