import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MedicalService } from './medical.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateMedicalRecordDTO } from './dtos/create-medical-record.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateMedicalRecordDTO } from './dtos/update-medical-record.dto';

@Controller('medical')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @Post('')
  @ApiOperation({ summary: 'Tạo phiếu khám bệnh cho pet' })
  @ApiBody({
    type: CreateMedicalRecordDTO,
  })
  createMedical(@Body() createDTO: CreateMedicalRecordDTO, @Req() req) {
    return this.medicalService.createMedicalRecord(
      createDTO,
      req?.user?.clinicId,
    );
  }

  @Put('')
  @ApiOperation({ summary: 'Cập nhật phiếu khám bệnh cho pet' })
  @ApiBody({
    type: UpdateMedicalRecordDTO,
  })
  async updateMedical(
    @Body() updateDTO: UpdateMedicalRecordDTO,
    @Param('id') id: string,
  ) {
    await this.medicalService.updateMedicalRecord(updateDTO, id);

    return {
      message: 'Cập nhật thành công',
    };
  }
}
