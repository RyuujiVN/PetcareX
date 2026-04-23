import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { regex } from 'src/common/constants/rexgex.constant';

export class CreateClinicDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng khám không được để trống' })
  name: string;

  @ApiProperty()
  @IsString()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(regex.phoneRegex, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  avatarUrl: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Vĩ độ không được để trống' })
  lat: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Kinh độ không được để trống' })
  lon: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address?: string;
}
