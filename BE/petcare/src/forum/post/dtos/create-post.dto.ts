import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePostDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id chủ đề không được để trống' })
  topicId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  content: string;
}
