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
import { ChatbotMessage } from '../entities/chatbot-message.entity';
import { MessagePagination } from '../message/types/message-pagination.type';
import { RoomPagination } from './types/room-pagination.type';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(ChatbotRoom)
    private readonly roomRepository: Repository<ChatbotRoom>,
    @InjectRepository(ChatbotMessage)
    private readonly messageRepository: Repository<ChatbotMessage>,
  ) {}

  // Lấy danh sách đoạn chat
  async findAllRoomPagination(options: RoomPagination, userId: string) {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .where('room.userId = :id', { id: userId })
      .orderBy('room.createdAt', 'DESC')
      .limit(options.limit);

    if (options.createdAt)
      queryBuilder.andWhere('room.createdAt < :time', {
        time: new Date(options.createdAt),
      });

    return await queryBuilder.getMany();
  }

  // Lấy danh sách message trong đoạn chat
  async findAllMessagePagination(options: MessagePagination, userId: string) {
    const room = await this.roomRepository.findOne({
      where: { id: options.roomId, userId: userId },
    });

    if (!room) return [];

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.roomId = :id', { id: options.roomId })
      .orderBy('message.createdAt', 'DESC')
      .limit(options.limit);

    if (options.createdAt)
      queryBuilder.andWhere('message.createdAt < :time', {
        time: new Date(options.createdAt),
      });

    const messages = await queryBuilder.getMany();
    return messages.reverse();
  }

  // Tạo mới đoạn chat
  async createRoom(createDTO: CreateRoomDTO, userId: string) {
    const room = new ChatbotRoom();
    room.name = createDTO.name;
    room.userId = userId;

    return await this.roomRepository.save(room);
  }

  // Chỉnh sửa đoạn chat
  async updateRoom(updateDTO: UpdateRoomDTO, roomId: string, userId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });

    if (!room) throw new NotFoundException('Không tìm thấy đoạn chat');

    if (room.userId !== userId)
      throw new ForbiddenException('Không có quyền chỉnh sửa đoạn chat này');

    Object.assign(room, updateDTO);
    return await this.roomRepository.save(room);
  }

  // Xoá đoạn chat
  async deleteRoom(roomId: string, userId: string) {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });

    if (!room) throw new NotFoundException('Không tìm thấy đoạn chat');

    if (room.userId !== userId)
      throw new ForbiddenException('Không có quyền xoá đoạn chat này');

    await this.roomRepository.delete({ id: room.id });
  }
}
