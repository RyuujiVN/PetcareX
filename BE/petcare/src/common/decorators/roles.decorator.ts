import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../enums/role.enum';

export const ROLE_KEY = 'roles';
export const RequiredRole = (...roles: RoleEnum[]) =>
  SetMetadata(ROLE_KEY, roles);
