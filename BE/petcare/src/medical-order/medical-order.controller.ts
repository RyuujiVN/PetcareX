import { Controller, Get, UseGuards } from '@nestjs/common';
import { MedicalOrderService } from './medical-order.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MedicalOrder } from './entities/medical-order.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('medical-order')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class MedicalOrderController {
  constructor(private readonly medicalOrderService: MedicalOrderService) {}

  @Get('')
  @ApiOperation({ summary: 'Lấy danh sách các phiếu chỉ định' })
  getAllMedicalOrder(): Promise<MedicalOrder[]> {
    return this.medicalOrderService.findAll();
  }
}
