import { Clinic } from 'src/clinic/entities/clinic.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('veterinarian')
export class Veterinarian {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Column({ name: 'clinic_id' })
  clinicId: string;

  @OneToOne(() => User)
  user: User;

  @ManyToOne(() => Clinic, (clinic) => clinic.veterinarian, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  clinic: Clinic;
}
