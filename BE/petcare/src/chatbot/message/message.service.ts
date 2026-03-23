import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateMessageDTO } from './dtos/create-message.dto';
import { ChatbotRoom } from '../entities/chatbot-room.entity';
import { SenderEnum } from 'src/common/enums/sender.enum';
import { ChatbotMessage } from '../entities/chatbot-message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(ChatbotMessage)
    private readonly messageRepository: Repository<ChatbotMessage>,
    private readonly dataSource: DataSource,
  ) {}

  async createMessage(createDTO: CreateMessageDTO, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Nếu chưa có room thì tạo room mới cho message
      if (!createDTO.roomId) {
        const roomRepo = manager.getRepository(ChatbotRoom);
        const roomPayload = {
          userId: userId,
          name: createDTO.content.slice(0, 30),
        };

        const savedRoom = await roomRepo.save(roomPayload);
        createDTO.roomId = savedRoom.id;
      }

      // 2. Lưu message vào room
      const messageRepo = manager.getRepository(ChatbotMessage);
      const message = messageRepo.create(createDTO);
      message.sendBy = SenderEnum.USER;

      return await messageRepo.save(message);
    });
  }
}
