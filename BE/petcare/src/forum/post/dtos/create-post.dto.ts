import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePostDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id chủ đề không được để trống' })
  topicId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  content: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
