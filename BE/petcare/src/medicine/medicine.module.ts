import { Module } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { MedicineController } from './medicine.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medicine } from './entities/medicine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Medicine])],
  providers: [MedicineService],
  controllers: [MedicineController],
})
export class MedicineModule {}
