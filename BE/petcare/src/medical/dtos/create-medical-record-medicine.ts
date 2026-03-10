import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMedicalRecordMedicineDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id phiếu khám không được để trống' })
  medicalRecordId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id thuốc không được để trống' })
  medicineId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Giá tại thời điểm đó không được để trống' })
  priceAtTime: number;
}
