import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotRoom } from '../entities/chatbot-room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotRoom])],
  providers: [RoomService],
  controllers: [RoomController],
})
export class RoomModule {}
