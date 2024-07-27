import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/dtos/user-role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);