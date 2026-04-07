import { NotificationEnum } from 'src/common/enums/notification.enum';
import { SenderNotificationEnum } from 'src/common/enums/sender-notification.enum';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'uuid', name: 'sender_id', nullable: true })
  senderId: string | null;

  @Column({ type: 'enum', name: 'sender_type', enum: SenderNotificationEnum })
  senderType: SenderNotificationEnum;

  @Column({ type: 'enum', enum: NotificationEnum })
  type: NotificationEnum;

  @Column({ type: 'boolean', name: 'is_read', default: 'false' })
  isRead: boolean;

  @Column({ type: 'jsonb' })
  target: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipient_id' })
  user: User;
}
