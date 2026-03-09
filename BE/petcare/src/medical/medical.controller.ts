import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MedicalService } from './medical.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateMedicalRecordDTO } from './dtos/create-medical-record.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateMedicalRecordDTO } from './dtos/update-medical-record.dto';

@Controller('medical')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  @Get('')
  @ApiOperation({ summary: 'Lấy danh sách phiếu khám bên phòng khám' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  getAllMedicalRecordClinic(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(1), ParseIntPipe) limit: number,
    @Req() req,
  ) {
    return this.medicalService.findAllPaginationByClinic({
      page,
      limit,
      clinicId: req?.user?.clinicId,
    });
  }

  @Get('pet/:id')
  @ApiOperation({ summary: 'Lấy danh sách phiếu khám của pet' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  getAllMedicalRecordPet(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(1), ParseIntPipe) limit: number,
    @Param('id') id: string,
  ) {
    return this.medicalService.findAllPaginationByPet({
      page,
      limit,
      petId: id,
    });
  }

  @Post('')
  @ApiOperation({ summary: 'Tạo phiếu khám bệnh cho pet' })
  @ApiBody({
    type: CreateMedicalRecordDTO,
  })
  createMedical(@Body() createDTO: CreateMedicalRecordDTO, @Req() req) {
    return this.medicalService.createMedicalRecord(
      createDTO,
      req?.user?.clinicId,
      req?.user?.id,
    );
  }

  @Put(':id')
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
