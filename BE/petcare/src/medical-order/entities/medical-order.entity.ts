import {
  Column,
  CreateDateColumn,
  Entity,
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
}
