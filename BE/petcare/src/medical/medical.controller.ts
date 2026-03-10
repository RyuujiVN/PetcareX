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
import { CreateMedicalRecordOrderDTO } from './dtos/create-medical-record-order';
import { UpdateMedicalRecordOrderDTO } from './dtos/update-medical-record-order';

@Controller('medical')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard)
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  // ------------------------ Phiếu khám -----------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin phiếu khám chi tiết' })
  async getDetail(@Param('id') id: string) {
    return this.medicalService.findOneById(id);
  }

  @Get('clinic')
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

  @Get('pet/:petId')
  @ApiOperation({ summary: 'Lấy danh sách phiếu khám của pet' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  getAllMedicalRecordPet(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(1), ParseIntPipe) limit: number,
    @Param('petId') petId: string,
  ) {
    return this.medicalService.findAllPaginationByPet({
      page,
      limit,
      petId: petId,
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

  // ------------------------ Phiếu chỉ định ---------------------------
  @Post('order')
  @ApiOperation({ summary: 'Thêm phiếu chỉ định vào phiếu khám' })
  @ApiBody({
    type: CreateMedicalRecordOrderDTO,
  })
  createMedicalRecordOrder(@Body() createDTO: CreateMedicalRecordOrderDTO) {
    return this.medicalService.createMedicalRecordOrder(createDTO);
  }

  @Put('order/:id')
  @ApiOperation({ summary: 'Cập nhật phiếu chỉ định của phiếu khám' })
  @ApiBody({
    type: UpdateMedicalRecordOrderDTO,
  })
  async updateMedicalRecordOrder(
    @Body() updateDTO: UpdateMedicalRecordOrderDTO,
    @Param('id') id: string,
  ) {
    await this.medicalService.updateMedicalRecordOrder(updateDTO, id);

    return {
      message: 'Cập nhật thành công',
    };
  }
}
