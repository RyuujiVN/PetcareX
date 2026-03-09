import { Module } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord]), UserModule],
  providers: [MedicalService],
  controllers: [MedicalController],
})
export class MedicalModule {}
