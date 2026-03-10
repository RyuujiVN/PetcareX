import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('medical_record_order')
export class MedicalRecordOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'medical_record_id' })
  medicalRecordId: string;

  @Column({ type: 'uuid', name: 'medicine_id' })
  medicineId: string;

  @Column({ type: 'text' })
  note: string;

  @Column({ type: 'int', name: 'price_at_time' })
  priceAtTime: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
