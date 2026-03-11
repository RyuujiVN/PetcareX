import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTopicDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Tên topic không được để trống' })
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}
