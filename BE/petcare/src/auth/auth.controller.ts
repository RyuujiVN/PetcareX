import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { LoginDTO } from './dtos/login.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoleEnum } from 'src/common/enums/role.enum';
import { ForgotPasswordDTO } from './dtos/forgot-password.dto';
import { ResetPasswordDTO } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({
    type: LoginDTO,
  })
  login(@Body() loginDTO: LoginDTO) {
    return this.authService.login(loginDTO);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký' })
  @ApiBody({
    type: CreateUserDTO,
  })
  async register(@Body() createUserDTO: CreateUserDTO) {
    await this.userService.createUser(createUserDTO, RoleEnum.CUSTOMER);

    return {
      message: 'Đăng ký thành công',
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Quên mật khẩu' })
  @ApiBody({
    type: ForgotPasswordDTO,
  })
  async forgotPassword(@Body() forgotPasswordDTO: ForgotPasswordDTO) {
    await this.authService.forgotPassword(forgotPasswordDTO);

    return {
      message: 'Gửi email thành công',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu' })
  @ApiBody({
    type: ResetPasswordDTO,
  })
  async resetPassword(@Body() resetPasswordDTO: ResetPasswordDTO) {
    await this.authService.resetPassword(resetPasswordDTO);

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }
}
