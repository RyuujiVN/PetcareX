import { Clinic } from 'src/clinic/entities/clinic.entity';
import { VeterinarySpecialtyEnum } from 'src/common/enums/veterinary-specialty.enum';
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

  @OneToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Clinic, (clinic) => clinic.veterinarians, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({
    type: 'enum',
    enum: VeterinarySpecialtyEnum,
  })
  specialty: VeterinarySpecialtyEnum;
}
