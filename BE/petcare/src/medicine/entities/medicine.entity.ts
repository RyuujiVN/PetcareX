import { MedicalRecordMedicine } from 'src/medical/entities/medical_record_medicine.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('medicine')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  unit: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn({ name: 'created_at' })
  createAt: Date;

  @OneToMany(
    () => MedicalRecordMedicine,
    (medicalRecordMedicine) => medicalRecordMedicine.medicine,
  )
  medicalRecords: MedicalRecordMedicine[];
}
