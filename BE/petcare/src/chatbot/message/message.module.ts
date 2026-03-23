import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotMessage } from '../entities/chatbot-message.entity';
import { ChatbotRoom } from '../entities/chatbot-room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotRoom, ChatbotMessage])],
  providers: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
