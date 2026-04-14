import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { BullModule } from '@nestjs/bullmq';
import { QueueNameEnum } from 'src/common/enums/queue.enum';
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Otp } from 'src/otp/entities/otp.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecord, Appointment, Otp]),
    BullModule.registerQueue({
      name: QueueNameEnum.APPOINTMENT,
    }),
  ],
  providers: [TaskService],
})
export class TaskModule {}
