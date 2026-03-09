import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMedicalRecordDTO } from './create-medical-record.dto';
import { IsDate, IsOptional, IsString, MinDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMedicalRecordDTO extends PartialType(
  CreateMedicalRecordDTO,
) {
  @ApiProperty()
  @IsOptional()
  @IsString()
  conclusion?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value && new Date(value))
  @IsDate({ message: 'Ngày hẹn phải đúng định dạng YYYY-MM-DD' })
  @MinDate(new Date(), {
    message: 'Ngày tái khám phải lớn hơn ngày hiện tại',
  })
  followUpDate?: Date;
}
