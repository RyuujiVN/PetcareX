import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { regex } from 'src/common/constants/rexgex.constant';

export class ChangePasswordDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @Matches(regex.passwordRegex, {
    message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
  })
  newPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  cofirmPassword: string;
}
