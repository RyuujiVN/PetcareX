import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { NotificationEnum } from 'src/common/enums/notification.enum';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectQueue(QueueNameEnum.APPOINTMENT)
    private readonly appointmentQueue: Queue,
  ) {}

  async handleFollowUpReminder(
    date: Date,
    jobName: JobNameEnum,
    notificationType: NotificationEnum,
  ) {
    const queryBuilder = this.medicalRecordRepo
      .createQueryBuilder('medical')
      .leftJoin('medical.pet', 'pet')
      .leftJoin('medical.clinic', 'clinic')
      .where('medical.followUpDate = :date', { date: date })
      .select([
        'medical.petName',
        'medical.followUpDate',

        'clinic.name',

        'pet.ownerId',
      ]);

    const listReminder = await queryBuilder.getMany();

    const jobs = listReminder.map((item) => ({
      name: jobName,
      data: {
        userId: item.pet?.ownerId,
        petName: item.petName,
        followUpDate: item?.followUpDate,
        clinicName: item.clinic?.name,
        notificationType: notificationType,
      },
      opts: {
        attempts: 4,
        removeOnComplete: true,
        removeOnFail: true,
        backoff: { type: 'fixed', delay: 2000 },
      },
    }));

    await this.appointmentQueue.addBulk(jobs);
  }

  // Chạy 8h sáng mỗi ngày nhắc nhở các lịch tái khám trước 2 ngày
  @Cron('0 0 8 * * *')
  async handleFollowUpReminderBeforeTwoDays() {
    const now = new Date();

    const nextFollowUpDate = new Date(now);
    nextFollowUpDate.setDate(now.getDate() + 2);

    await this.handleFollowUpReminder(
      nextFollowUpDate,
      JobNameEnum.FOLLOW_UP_DATE_REMINDER,
      NotificationEnum.FOLLOW_UP_REMINDER_BEFORE_TWO_DAYS,
    );
  }

  // Chạy 7h sáng mỗi ngày nhắc nhở các lịch tái khám hôm nay
  @Cron('0 0 7 * * *')
  async handleFollowUpReminderToday() {
    const today = new Date();

    await this.handleFollowUpReminder(
      today,
      JobNameEnum.FOLLOW_UP_DATE_REMINDER,
      NotificationEnum.FOLLOW_UP_REMINDER_TODAY,
    );
  }

  // Chạy 6h30 sáng mỗi ngày nhắc nhở các lịch hẹn hôm nay
  @Cron('0 30 6 * * *')
  // @Cron('*/20 * * * * *')
  async handleAppointmentReminder() {
    const today = new Date();

    const listReminder = await this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoin('appointment.pet', 'pet')
      .leftJoin('appointment.clinic', 'clinic')
      .where('appointment.appointmentDate = :date', { date: today })
      .select([
        'appointment.id',
        'appointment.appointmentDate',
        'appointment.appointmentTime',

        'pet.ownerId',
        'pet.name',

        'clinic.name',
      ])
      .getMany();

    const jobs = listReminder.map((item) => ({
      name: NotificationEnum.APPOINTMENT_REMINDER,
      data: {
        userId: item.pet?.ownerId,
        petName: item?.pet?.name,
        clinicName: item.clinic?.name,
        notificationType: NotificationEnum.APPOINTMENT_REMINDER,
        appointmentId: item.id,
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
      },
      opts: {
        attempts: 4,
        removeOnComplete: true,
        removeOnFail: true,
        backoff: { type: 'fixed', delay: 2000 },
      },
    }));

    await this.appointmentQueue.addBulk(jobs);
  }
}
