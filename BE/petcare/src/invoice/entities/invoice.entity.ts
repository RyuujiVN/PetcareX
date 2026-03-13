import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'pet_owner_id' })
  petOwnerId: string;

  @Column({ type: 'uuid', name: 'medical_record_id' })
  medicalRecordId: string;

  @Column({ type: 'int', name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'enum', enum: InvoiceStatusEnum })
  status: InvoiceStatusEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
