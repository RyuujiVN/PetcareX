import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { PetSpeciesEnum } from 'src/common/enums/pet-species.enum';
import { PetBreedEnum } from 'src/common/enums/pet-breed.enum';
import { AiDiagnosis } from 'src/ai-diagnosis/entities/ai-diagnosis.entity';

@Entity('pet')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'enum', enum: PetSpeciesEnum, nullable: true })
  species: PetSpeciesEnum;

  @Column({ type: 'enum', enum: PetBreedEnum, nullable: true })
  breed: PetBreedEnum;

  @Column({ type: 'boolean', nullable: true })
  gender: boolean;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
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

  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, (medicalRecord) => medicalRecord.pet)
  medicalRecords: MedicalRecord[];

  @OneToMany(() => AiDiagnosis, (aiDiagnosis) => aiDiagnosis.pet)
  aiDiagnoses: AiDiagnosis[];
}
