import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Clinic } from 'src/clinic/entities/clinic.entity';
import { VeterinarySpecialtyEnum } from 'src/common/enums/veterinary-specialty.enum';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('veterinarian')
export class Veterinarian {
  @PrimaryColumn('uuid', { name: 'user_id' })
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

  @OneToMany(() => Appointment, (appointment) => appointment.veterinarian)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, (medicalRecord) => medicalRecord.veterinarian)
  medicalRecords: MedicalRecord[];
}
