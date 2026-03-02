import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { LoginDTO } from './dtos/login.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({
    status: 201,
    description: 'Đăng nhập thành công',
  })
  @ApiBody({
    type: LoginDTO,
  })
  login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }

  @Post('register')
  @ApiBody({
    type: CreateUserDTO,
  })
  async register(@Body() createUserDTO: CreateUserDTO) {
    await this.userService.createUser(createUserDTO);

    return {
      message: 'Đăng ký thành công',
    };
  }
}
