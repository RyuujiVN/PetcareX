import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { regex } from 'src/common/constants/rexgex.constant';
import { RoleEnum } from 'src/common/enums/role.enum';

export class CreateUserDTO {
  @IsString()
  @MaxLength(50)
  @IsNotEmpty({ message: 'Tên không được để trống' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu là 6 ký tự' })
  @Matches(regex.passwordRegex, {
    message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
  })
  password: string;

  @IsEnum(RoleEnum)
  role: RoleEnum;
}
