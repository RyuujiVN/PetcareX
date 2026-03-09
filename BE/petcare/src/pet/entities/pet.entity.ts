import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Breed } from './breed.entity';
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';

@Entity('pet')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'breed_id' })
  breedId: string;

  @Column({ type: 'boolean' })
  gender: boolean;

  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  weight: number;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.pets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Breed, (breed) => breed.pets, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'breed_id' })
  breed: Breed;

  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, (medicalRecord) => medicalRecord.pet)
  medicalRecords: MedicalRecord[];
}
