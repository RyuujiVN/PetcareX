import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateRoomDTO } from './dtos/create-room.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

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
}
