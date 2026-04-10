import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('clinic_homepage_setting')
export class ClinicHomepageSetting {
  @PrimaryColumn({ type: 'uuid', name: 'clinic_id' })
  clinicId: string;

  @Column('jsonb')
  settings: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
