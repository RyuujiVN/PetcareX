import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'pet_owner_id', nullable: true })
  petOwnerId: string;

  @Column({ type: 'uuid', name: 'medical_record_id' })
  medicalRecordId: string;

  @Column({ type: 'int', name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'enum', enum: InvoiceStatusEnum })
  status: InvoiceStatusEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (petOwner) => petOwner.invoices, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'pet_owner_id' })
  petOwner: User;

  @OneToOne(() => MedicalRecord, (medicalRecord) => medicalRecord.invoice, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_record_id' })
  medicalRecord: MedicalRecord;
}
