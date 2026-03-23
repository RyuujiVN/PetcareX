import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDTO {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  roomId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nội dung message không được để trống' })
  content: string;
}
