import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotRoom } from '../entities/chatbot-room.entity';
import { CreateRoomDTO } from './dtos/create-room.dto';

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
}
