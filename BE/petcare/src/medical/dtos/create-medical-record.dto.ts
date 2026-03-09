import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Max } from 'class-validator';

export class CreateMedicalRecordDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Pet id không được để trống' })
  petId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Breed id không được để trống' })
  breedId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Tên pet không được để trống' })
  petName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Tên phiếu khám không được để trống' })
  name: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Nhiệt độ thú cưng không được để trống' })
  @Max(50, {
    message: 'Nhiệt độ thú cưng không quá 50 độ C',
  })
  temperature: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Nhịp tim không được để trống' })
  heartRate: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Huyết áp trên không được để trống' })
  systolic: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Huyết áp dưới không được để trống' })
  diastolic: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty({ message: 'Cân nặng không được để trống' })
  @Max(99.9, {
    message: 'Cân nặng không được vượt quá 99.9kg',
  })
  weight: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Chẩn đoán bệnh không được để trống' })
  diagnosis: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Triệu chứng không được để trống' })
  symptoms: string;
}
