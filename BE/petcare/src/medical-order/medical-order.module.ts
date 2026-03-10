import { Module } from '@nestjs/common';
import { MedicalOrderService } from './medical-order.service';
import { MedicalOrderController } from './medical-order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalOrder } from './entities/medical-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalOrder])],
  providers: [MedicalOrderService],
  controllers: [MedicalOrderController],
})
export class MedicalOrderModule {}
