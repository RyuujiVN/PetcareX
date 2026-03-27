import { Pet } from 'src/pet/entities/pet.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ai_diagnosis')
export class AiDiagnosis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId: string;

  @Column()
  diagnosis: string;

  @Column({ type: 'date', name: 'appointment_date' })
  appointmentDate: Date;

  @Column({ type: 'time', name: 'appointment_time' })
  appointmentTime: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.aiDiagnoses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Pet, (pet) => pet.aiDiagnoses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;
}
