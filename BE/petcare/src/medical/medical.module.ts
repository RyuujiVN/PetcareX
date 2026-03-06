import { Module } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';

@Module({
  providers: [MedicalService],
  controllers: [MedicalController]
})
export class MedicalModule {}
