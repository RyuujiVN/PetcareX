import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { RoleEnum } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { ChangePasswordDTO } from './dtos/change-password.dto';
import { ForgotPasswordDTO } from './dtos/forgot-password.dto';
import { LoginDTO } from './dtos/login.dto';
import { ResetPasswordDTO } from './dtos/reset-password.dto';
import { LoginGoogleDTO } from './dtos/login-google.dto';

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

  @Post('login-google')
  @ApiOperation({ summary: 'Đăng nhập bằng google' })
  @ApiBody({
    type: LoginGoogleDTO,
  })
  async googleLogin(@Body('googleIdToken') idToken: string) {
    return this.authService.googleLogin(idToken);
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

  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thay đổi mật khẩu' })
  @ApiBody({
    type: ChangePasswordDTO,
  })
  async changePassword(@Req() req, @Body() changePassDTO: ChangePasswordDTO) {
    const accessToken = await this.authService.changePassword(
      req?.user?.id,
      changePassDTO,
    );

    return {
      message: 'Đổi mật khẩu thành công',
      accessToken: accessToken,
    };
  }
}
