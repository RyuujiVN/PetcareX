import { Clinic } from 'src/clinic/entities/clinic.entity';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateClinicWithAdminDTO } from './dtos/create-clinic-with-admin.dto';
import { ClinicService } from './clinic.service';

@Controller('clinic')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới phòng khám' })
  @ApiBody({
    type: CreateClinicWithAdminDTO,
  })
  async createClinic(
    @Body() bodyDTO: CreateClinicWithAdminDTO,
  ): Promise<Clinic> {
    return await this.clinicService.createClinic(bodyDTO.clinic, bodyDTO.admin);
  }
}
