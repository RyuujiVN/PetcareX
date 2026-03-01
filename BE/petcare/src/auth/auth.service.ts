/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginDTO } from './dtos/login.dto';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login(loginDTO: LoginDTO) {
    const user = await this.userService.findOneByEmail(loginDTO.email);

    if (!user) throw new UnauthorizedException('Tài khoản hoặc mật khẩu sai');

    const passwordChecked = bcrypt.compare(loginDTO.password, user.password);

    if (!passwordChecked)
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu sai');

    return user;
  }
}
