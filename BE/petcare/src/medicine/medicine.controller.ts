import { Controller, Get, UseGuards } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { ApiOperation } from '@nestjs/swagger';
import { Medicine } from './entities/medicine.entity';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';

@Controller('medicine')
@UseGuards(JwtAuthGuard, RoleGuard)
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get('')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.VETERINARIAN)
  @ApiOperation({ summary: 'Lấy danh sách thuốc' })
  getAllMedicine(): Promise<Medicine[]> {
    return this.medicineService.findAllMedicine();
  }
}
