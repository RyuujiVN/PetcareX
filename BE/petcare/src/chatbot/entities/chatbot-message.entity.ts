import { SenderEnum } from 'src/common/enums/sender.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatbotRoom } from './chatbot-room.entity';

@Entity('chatbot_message')
export class ChatbotMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'room_id' })
  roomId: string;

  @Column({ type: 'enum', enum: SenderEnum, name: 'send_by' })
  sendBy: SenderEnum;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatbotRoom, (room) => room.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'room_id' })
  room: ChatbotRoom;
}
