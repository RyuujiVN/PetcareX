import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMedicalRecordOrderDTO {
  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
