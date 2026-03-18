import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotMessage } from '../entities/chatbot-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotMessage])],
  providers: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
