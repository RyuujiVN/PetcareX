import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SenderEnum } from 'src/common/enums/sender.enum';

export class CreateMessageDTO {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  roomId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(SenderEnum)
  sendBy: SenderEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nội dung message không được để trống' })
  content: string;
}
