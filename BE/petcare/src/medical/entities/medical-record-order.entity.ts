import { MedicalOrder } from 'src/medical-order/entities/medical-order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MedicalRecord } from './medical-record.entity';

@Entity('medical_record_order')
export class MedicalRecordOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'medical_record_id' })
  medicalRecordId: string;

  @Column({ type: 'uuid', name: 'medical_order_id' })
  medicalOrderId: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'int', name: 'price_at_time' })
  priceAtTime: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(
    () => MedicalOrder,
    (medicalOrder) => medicalOrder.medicalRecords,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'medical_order_id' })
  medicalOrder: MedicalOrder;

  @ManyToOne(
    () => MedicalRecord,
    (medicalRecord) => medicalRecord.medicalOrders,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
