import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { regex } from 'src/common/constants/rexgex.constant';

export class ResetPasswordDTO {
  @ApiProperty()
  @IsString()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty()
  @IsString()
  @MaxLength(6)
  @MinLength(6)
  @IsNotEmpty({ message: 'Mã otp không được để trống' })
  otp: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @Matches(regex.passwordRegex, {
    message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
  })
  newPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;
}
