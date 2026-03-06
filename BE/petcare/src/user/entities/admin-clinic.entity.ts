import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Clinic } from 'src/clinic/entities/clinic.entity';

@Entity('admin_clinic')
export class AdminClinic {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.adminClinic)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'clinic_id' })
  clinicId: string;

  @OneToOne(() => Clinic, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;
}
