import { Module } from '@nestjs/common';
import { RoomModule } from './room/room.module';
import { MessageModule } from './message/message.module';
import { AiClientService } from './ai-client.service';
import { ChatBotGateway } from './chatBot.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RoomModule, MessageModule, AuthModule],
  providers: [AiClientService, ChatBotGateway],
  exports: [ChatBotGateway],
})
export class ChatbotModule {}
