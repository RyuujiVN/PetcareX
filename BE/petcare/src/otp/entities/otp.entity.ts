import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('otp')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  email: string;

  @Column({ name: 'expired_at', type: 'timestamp' })
  expiredAt: Date;
}
