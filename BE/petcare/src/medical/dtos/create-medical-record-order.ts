import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMedicalRecordOrderDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id phiếu khám không được để trống' })
  medicalRecordId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id phiếu chỉ định không được để trống' })
  medicalOrderId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Giá tại thời điểm đó không được để trống' })
  priceAtTime: number;
}
