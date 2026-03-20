import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RoomService } from './room.service';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đoạn chat của người dùng' })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({
    name: 'createdAt',
    required: false,
    type: Date,
    description: 'Phân trang dựa trên thời gian của đoạn chat cuối cùng',
  })
  getAllRoom(
    @Req() req,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('createdAt') createdAt?: Date,
  ) {
    return this.roomService.findAllRoomPagination(
      {
        limit,
        createdAt,
      },
      req?.user?.id,
    );
  }

  @Get(':roomId/messages')
  @ApiOperation({ summary: 'Lấy danh sách message của đoạn chat' })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({
    name: 'createdAt',
    required: false,
    type: Date,
    description: 'Phân trang dựa trên thời gian của đoạn chat cuối cùng',
  })
  getAllMessageInRoom(
    @Req() req,
    @Param('roomId') roomId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('createdAt') createdAt?: Date,
  ) {
    return this.roomService.findAllMessagePagination(
      {
        limit,
        roomId,
        createdAt,
      },
      req?.user?.id,
    );
  }

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

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá đoạn chat' })
  async deleteRoom(@Req() req, @Param(':id') id: string) {
    await this.roomService.deleteRoom(id, req?.user?.id);

    return {
      message: 'Xoá đoạn chat thành công',
    };
  }
}
