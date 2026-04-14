import { ApiProperty } from '@nestjs/swagger';
import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateClinicReviewDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id phòng khám không được để trống' })
  clinicId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id phiếu khám không được để trống' })
  medicalRecordId: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 1 })
  @IsNotEmpty({ message: 'Rating không được để trống' })
  rating: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  content?: string;
}
