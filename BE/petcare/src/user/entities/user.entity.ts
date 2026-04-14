import { Exclude } from 'class-transformer';
import { RoleEnum } from 'src/common/enums/role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminClinic } from './admin-clinic.entity';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';
import { Pet } from 'src/pet/entities/pet.entity';
import { ForumComment } from 'src/forum/entities/forum_comment.entity';
import { ForumPost } from 'src/forum/entities/forum_post.entity';
import { Like } from 'src/forum/entities/like.entity';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { ChatbotRoom } from 'src/chatbot/entities/chatbot-room.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { ClinicReview } from 'src/clinic-review/entities/clinic-review.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ default: '' })
  address: string;

  @Column({
    type: 'enum',
    enum: RoleEnum,
  })
  role: RoleEnum;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'deleted', type: 'boolean', default: false })
  deleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => AdminClinic, (adminClinic) => adminClinic.user)
  adminClinic: AdminClinic;

  @OneToOne(() => Veterinarian, (veterinarian) => veterinarian.user)
  veterinarian?: Veterinarian;

  @OneToMany(() => Pet, (pet) => pet.owner)
  pets: Pet[];

  @OneToMany(() => ForumComment, (comment) => comment.user)
  comments: ForumComment[];

  @OneToMany(() => ForumPost, (post) => post.author)
  posts: ForumPost[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Invoice, (invoice) => invoice.petOwner)
  invoices: Invoice[];

  @OneToMany(() => ChatbotRoom, (room) => room.user)
  rooms: ChatbotRoom[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => ClinicReview, (review) => review.user)
  reviews: ClinicReview[];
}
