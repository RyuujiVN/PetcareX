import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { RoomService } from './room.service';
import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateRoomDTO } from './dtos/create-room.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateRoomDTO } from './dtos/update-room.dto';

@Controller('room')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('')
  @ApiOperation({ summary: 'Tạo mới đoạn chat với bot' })
  @ApiBody({
    type: CreateRoomDTO,
  })
  createRoom(@Body() createDTO: CreateRoomDTO, @Req() req) {
    return this.roomService.createRoom(createDTO, req?.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa tên đoạn chat' })
  @ApiBody({
    type: UpdateRoomDTO,
  })
  async updateRoom(
    @Body() updateDTO: UpdateRoomDTO,
    @Req() req,
    @Param(':id') id: string,
  ) {
    await this.roomService.updateRoom(updateDTO, id, req?.user?.id);

    return {
      message: 'Sửa tên đoạn chat thành công',
    };
  }
}
