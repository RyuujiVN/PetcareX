import { ReportStatusEnum, ReportTypeEnum } from 'src/common/enums/report.enum';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('report')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id', type: 'uuid', nullable: true })
  reporterId: string;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'target_type', type: 'enum', enum: ReportTypeEnum })
  targetType: ReportTypeEnum;

  @Column({ type: 'enum', enum: ReportStatusEnum })
  status: ReportStatusEnum;

  @Column('text')
  reason: string;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;
}
