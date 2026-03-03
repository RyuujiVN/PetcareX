import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  OneToOne,
  PrimaryColumn
} from 'typeorm';

@Entity('veterinarian')
export class Veterinarian {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @Column({ name: 'clinic_id' })
  clinicId: string;

  @OneToOne(() => User)
  user: User;
}
