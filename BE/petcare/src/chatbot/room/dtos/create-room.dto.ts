import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  name: string;
}
