import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('medical_record')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId: string;

  @Column({ type: 'uuid', name: 'veterinarian_id' })
  veterinarianId: string;

  @Column()
  diagnosis: string;

  @Column()
  symptoms: string;

  @Column()
  conclusion: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  temperature: number;

  @Column({ name: 'heart_rate' })
  heartRate: number;

  @Column()
  systolic: number;

  @Column()
  diastolic: number;
}
