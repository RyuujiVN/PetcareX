import { Module } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord])],
  providers: [MedicalService],
  controllers: [MedicalController],
})
export class MedicalModule {}
