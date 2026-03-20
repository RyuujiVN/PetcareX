import { MedicalRecordMedicine } from 'src/medical/entities/medical-record-medicine.entity';
import { MedicineUnitEnum } from 'src/common/enums/medicine-unit.enum';
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

  @Column({ type: 'enum', enum: MedicineUnitEnum })
  unit: MedicineUnitEnum;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createAt: Date;

  @OneToMany(
    () => MedicalRecordMedicine,
    (medicalRecordMedicine) => medicalRecordMedicine.medicine,
  )
  medicalRecords: MedicalRecordMedicine[];
}
