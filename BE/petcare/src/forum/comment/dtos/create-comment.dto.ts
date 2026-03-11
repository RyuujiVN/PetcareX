import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id bài viết không được để trống' })
  postId: string;

  @ApiProperty({ required: false, nullable: true, example: null })
  @IsUUID()
  @IsOptional()
  parentId?: string | null = null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  content: string;
}
