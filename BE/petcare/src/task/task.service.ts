import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,
  ) {}

  @Cron('* * * * * *')
  async handleFollowUpReminderBeforeTwoDays() {
    const now = new Date();

    const nextFollowUpDate = new Date(now);
    nextFollowUpDate.setDate(now.getDate() + 2);

    const queryBuilder = this.medicalRecordRepo
      .createQueryBuilder('medical')
      .leftJoin('medical.pet', 'pet')
      .where('medical.followUpDate = :date', { date: nextFollowUpDate });

    // console.log(list);
  }
}
