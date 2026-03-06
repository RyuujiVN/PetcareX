import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { regex } from 'src/common/constants/rexgex.constant';

export class UpdateUserDTO {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  fullName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(regex.phoneRegex, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address?: string;
}
