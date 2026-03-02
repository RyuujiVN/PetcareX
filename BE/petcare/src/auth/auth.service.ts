/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginDTO } from './dtos/login.dto';
import bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { userInfo } from 'os';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDTO: LoginDTO) {
    const user = await this.userService.findOneByEmail(loginDTO.email);

    if (!user) throw new UnauthorizedException('Tài khoản hoặc mật khẩu sai');

    const passwordChecked = await bcrypt.compare(
      loginDTO.password,
      user.password,
    );

    if (!passwordChecked)
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu sai');

    // Tạo accessToken
    const payload: any = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar_url: user.avatarUrl,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN'),
      expiresIn: '7d',
    });

    return {
      userInfo: payload,
      accessToken: accessToken,
    };
  }
}
