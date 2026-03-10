import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Medicine } from '../../medicine/entities/medicine.entity';
import { MedicalRecord } from './medical-record.entity';

@Entity('medical_record_medicine')
export class MedicalRecordMedicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'medical_record_id' })
  medicalRecordId: string;

  @Column({ type: 'uuid', name: 'medicine_id' })
  medicineId: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', name: 'price_at_time' })
  priceAtTime: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Medicine, (medicine) => medicine.medicalRecords, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'medicine_id' })
  medicine: Medicine;

  @ManyToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.medicines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
