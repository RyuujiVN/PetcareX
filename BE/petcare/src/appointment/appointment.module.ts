import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AdminClinic, Veterinarian])],
  providers: [AppointmentService],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
