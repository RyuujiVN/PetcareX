import { Controller, Get } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { ApiOperation } from '@nestjs/swagger';
import { Medicine } from './entities/medicine.entity';

@Controller('medicine')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get('')
  @ApiOperation({ summary: 'Lấy danh sách thuốc' })
  getAllMedicine(): Promise<Medicine[]> {
    return this.medicineService.findAllMedicine();
  }
}
