import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDTO {
  @IsString()
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
