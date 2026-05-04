import { Module } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Appointment } from 'src/appointment/entities/appointment.entity';
import { Clinic } from 'src/clinic/entities/clinic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Appointment, Clinic])],
  providers: [RevenueService],
  controllers: [RevenueController],
})
export class RevenueModule {}
