import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('clinic')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  address: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Veterinarian, (veterinarian) => veterinarian.clinic)
  veterinarians: Veterinarian[];

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  appointments: Appointment[];
}
