import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';
import { BullModule } from '@nestjs/bullmq';
import { AnalyzeSymptomsProcessor } from './appointment.processor';
import { AiDiagnosis } from 'src/ai-diagnosis/entities/ai-diagnosis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AdminClinic,
      Veterinarian,
      AiDiagnosis,
    ]),
    BullModule.registerQueue({
      name: 'appointment',
    }),
  ],
  providers: [AppointmentService, AnalyzeSymptomsProcessor],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
