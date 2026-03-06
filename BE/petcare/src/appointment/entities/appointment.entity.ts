import { Clinic } from 'src/clinic/entities/clinic.entity';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import { ServiceEnum } from 'src/common/enums/service.enum';
import { Pet } from 'src/pet/entities/pet.entity';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('appointment')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pet_id' })
  petId: string;

  @Column({ name: 'veterinarian_id' })
  veterinarianId: string;

  @Column({ name: 'clinic_id' })
  clinicId: string;

  @Column({ type: 'date', name: 'appointment_date' })
  appointmentDate: Date;

  @Column({ type: 'time', name: 'appointment_time' })
  appointmentTime: string;

  @Column({
    type: 'enum',
    enum: ServiceEnum,
  })
  service: ServiceEnum;

  @Column({ type: 'text' })
  note: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatusEnum,
  })
  status: AppointmentStatusEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Pet, (pet) => pet.appointments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Clinic, (clinic) => clinic.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @ManyToOne(() => Veterinarian, (veterinarian) => veterinarian.appointments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: Veterinarian;
}
