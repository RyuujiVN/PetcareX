import { MedicalRecordOrder } from 'src/medical/entities/medical-record-order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('medical_order')
export class MedicalOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int' })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createAt: Date;

  @OneToMany(
    () => MedicalRecordOrder,
    (medicalRecordOrder) => medicalRecordOrder.medicalOrder,
  )
  medicalRecords: MedicalRecordOrder[];
}
