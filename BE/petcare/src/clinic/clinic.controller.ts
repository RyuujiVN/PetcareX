import { Clinic } from 'src/clinic/entities/clinic.entity';
import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateClinicWithAdminDTO } from './dtos/create-clinic-with-admin.dto';
import { ClinicService } from './clinic.service';
import { UpdateClinicDTO } from './dtos/update-clinic.dto';

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
  createClinic(@Body() bodyDTO: CreateClinicWithAdminDTO): Promise<Clinic> {
    return this.clinicService.createClinic(bodyDTO.clinic, bodyDTO.admin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Chỉnh sửa thông tin phòng khám' })
  @ApiBody({
    type: UpdateClinicDTO,
  })
  async updateClinic(
    @Param('id') id: string,
    @Body() bodyDTO: UpdateClinicDTO,
  ) {
    await this.clinicService.updateClinic(id, bodyDTO);

    return {
      message: 'Cập nhật thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá phòng khám' })
  @ApiBody({
    type: UpdateClinicDTO,
  })
  async deleteClinic(@Param('id') id: string) {
    await this.clinicService.deleteClinic(id);

    return {
      message: 'Xoá thành công',
    };
  }
}
