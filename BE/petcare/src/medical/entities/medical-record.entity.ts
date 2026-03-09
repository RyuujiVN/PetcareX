import { Clinic } from 'src/clinic/entities/clinic.entity';
import { Pet } from 'src/pet/entities/pet.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('medical_record')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId: string;

  @Column({ name: 'pet_name' })
  petName: string;

  @Column({ type: 'uuid' })
  breedId: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  temperature: number;

  @Column({ name: 'heart_rate' })
  heartRate: number;

  @Column()
  systolic: number;

  @Column()
  diastolic: number;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  weight: number;

  @Column()
  diagnosis: string;

  @Column()
  symptoms: string;

  @Column({ nullable: true })
  conclusion?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'date', nullable: true, name: 'follow_up_date' })
  followUpDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Pet, (pet) => pet.medicalRecords, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Clinic, (clinic) => clinic.medicalRecords, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;
}
