import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
} from 'class-validator';

export class CreatePetDTO {
  @ApiProperty()
  @IsString()
  @MaxLength(50, { message: 'Tên thú cưng tối đa 50 kí tự' })
  @IsNotEmpty({ message: 'Tên thú cưng không được để trống' })
  name: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty({ message: 'Giới tính không được để trống' })
  gender: boolean;

  @ApiProperty()
  @IsDateString(
    {},
    { message: 'Ngày sinh thú cưng phải đúng định dạng YYYY-MM-DD' },
  )
  @IsNotEmpty({ message: 'Ngày sinh không được để trống' })
  dateOfBirth: Date;

  @ApiProperty()
  @IsNumber()
  @Max(99.9, { message: 'Cân nặng tối đa là 99.9' })
  @IsPositive({ message: 'Cân nặng phải lớn hơn 0' })
  weight: number;

  @ApiProperty()
  @IsString()
  avatar: string;

  @ApiProperty()
  @IsUUID()
  breedId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
