import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTopicDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Tên chủ đề không được để trống' })
  nameVn: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  nameEng?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}
