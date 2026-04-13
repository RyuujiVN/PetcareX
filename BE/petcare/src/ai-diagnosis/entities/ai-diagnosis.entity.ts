import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Pet } from 'src/pet/entities/pet.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ai_diagnosis')
export class AiDiagnosis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId: string;

  @Column({ type: 'uuid', name: 'appointment_id' })
  appoinmentId: string;

  @Column()
  diagnosis: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Pet, (pet) => pet.aiDiagnoses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @OneToOne(() => Appointment, (appointment) => appointment.aiDiagnosis, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;
}
