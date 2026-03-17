import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginGoogleDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Google id token không được để trống' })
  googleIdToken: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Tên người dùng không được để trống' })
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarUrl: string;
}
