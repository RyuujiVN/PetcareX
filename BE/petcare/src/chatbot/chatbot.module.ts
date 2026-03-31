import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { RoomModule } from './room/room.module';
import { MessageModule } from './message/message.module';
import { AiClientService } from './ai-client.service';
import { ChatBotGateway } from './chatBot.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { ChatbotRoom } from './entities/chatbot-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatbotRoom]),
    RoomModule,
    MessageModule,
    AuthModule,
  ],
  providers: [AiClientService, ChatBotGateway],
  exports: [ChatBotGateway],
})
export class ChatbotModule {}
