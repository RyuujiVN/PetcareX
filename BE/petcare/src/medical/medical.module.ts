import { Module } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { UserModule } from 'src/user/user.module';
import { MedicalRecordOrder } from './entities/medical-record-order.entity';
import { MedicalRecordMedicine } from './entities/medical_record_medicine.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      MedicalRecordOrder,
      MedicalRecordMedicine,
    ]),
    UserModule,
  ],
  providers: [MedicalService],
  controllers: [MedicalController],
})
export class MedicalModule {}
