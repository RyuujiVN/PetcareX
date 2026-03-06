import { Exclude } from 'class-transformer';
import { RoleEnum } from 'src/common/enums/role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminClinic } from './admin-clinic.entity';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';
import { Pet } from 'src/pet/entities/pet.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ default: '' })
  address: string;

  @Column({
    type: 'enum',
    enum: RoleEnum,
  })
  role: RoleEnum;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'deleted', type: 'boolean', default: false })
  deleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => AdminClinic, (adminClinic) => adminClinic.user)
  adminClinic: AdminClinic;

  @OneToOne(() => Veterinarian, (veterinarian) => veterinarian.user)
  veterinarian?: Veterinarian;

  @OneToMany(() => Pet, (pet) => pet.owner)
  pets: Pet[];
}
