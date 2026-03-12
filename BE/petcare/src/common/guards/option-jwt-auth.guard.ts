import { AuthGuard } from '@nestjs/passport';

export class OptionJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    return user ?? null;
  }
}
