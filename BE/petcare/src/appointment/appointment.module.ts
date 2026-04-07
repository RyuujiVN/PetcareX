import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';
import { BullModule } from '@nestjs/bullmq';
import { AppointmentProcessor } from './appointment.processor';
import { AiDiagnosis } from 'src/ai-diagnosis/entities/ai-diagnosis.entity';
import { QueueNameEnum } from 'src/common/enums/queue.enum';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AdminClinic,
      Veterinarian,
      AiDiagnosis,
      Notification,
      NotificationModule,
    ]),
    BullModule.registerQueue({
      name: QueueNameEnum.APPOINTMENT,
    }),
    NotificationModule,
  ],
  providers: [AppointmentService, AppointmentProcessor],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
