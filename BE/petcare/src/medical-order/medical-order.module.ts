import { Module } from '@nestjs/common';
import { MedicalOrderService } from './medical-order.service';
import { MedicalOrderController } from './medical-order.controller';

@Module({
  providers: [MedicalOrderService],
  controllers: [MedicalOrderController]
})
export class MedicalOrderModule {}
