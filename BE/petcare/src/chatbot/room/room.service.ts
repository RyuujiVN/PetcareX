import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotRoom } from '../entities/chatbot-room.entity';
import { CreateRoomDTO } from './dtos/create-room.dto';
import { UpdateRoomDTO } from './dtos/update-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(ChatbotRoom)
    private readonly roomRepository: Repository<ChatbotRoom>,
  ) {}

  async createRoom(createDTO: CreateRoomDTO, userId: string) {
    const room = new ChatbotRoom();
    room.name = createDTO.name;
    room.userId = userId;

    return await this.roomRepository.save(room);
  }

  async updateRoom(updateDTO: UpdateRoomDTO, roomId: string, userId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });

    if (!room) throw new NotFoundException('Không tìm thấy đoạn chat');

    if (room.userId !== userId)
      throw new ForbiddenException('Không có quyền chỉnh sửa đoạn chat này');

    Object.assign(room, updateDTO);
    await this.roomRepository.save(room);
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });

    if (!room) throw new NotFoundException('Không tìm thấy đoạn chat');

    if (room.userId !== userId)
      throw new ForbiddenException('Không có quyền xoá đoạn chat này');

    await this.roomRepository.delete({ id: room.id });
  }
}
