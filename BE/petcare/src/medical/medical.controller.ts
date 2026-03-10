import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
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
import { CreateMedicalRecordMedicineDTO } from './dtos/create-medical-record-medicine';
import { UpdateMedicalRecordMedicineDTO } from './dtos/update-medical-record-medicine';

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
  @Get(':id/medical-order')
  @ApiOperation({ summary: 'Lấy danh sách phiếu chỉ định của phiếu khám' })
  async getAllMedicalRecordOrder(@Param('id') id: string) {
    return this.medicalService.findAllMedicalOrder(id);
  }

  @Post('medical-order')
  @ApiOperation({ summary: 'Thêm phiếu chỉ định vào phiếu khám' })
  @ApiBody({
    type: CreateMedicalRecordOrderDTO,
  })
  createMedicalRecordOrder(@Body() createDTO: CreateMedicalRecordOrderDTO) {
    return this.medicalService.createMedicalRecordOrder(createDTO);
  }

  @Put('medical-order/:id')
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
      message: 'Cập nhật phiếu chỉ định thành công',
    };
  }

  @Delete('medical-order/:id')
  @ApiOperation({ summary: 'Xoá phiếu chỉ định của phiếu khám' })
  async deleteMedicalRecordOrder(@Param('id') id: string) {
    await this.medicalService.deleteMedicalRecordOrder(id);

    return {
      message: 'Xoá phiếu chỉ định thành công',
    };
  }

  // ------------------------ Thuốc ---------------------------
  @Post('medicine')
  @ApiOperation({ summary: 'Thêm thuốc vào phiếu khám' })
  @ApiBody({
    type: CreateMedicalRecordMedicineDTO,
  })
  createMedicalRecordMedicine(
    @Body() createDTO: CreateMedicalRecordMedicineDTO,
  ) {
    return this.medicalService.createMedicalRecordMedicine(createDTO);
  }

  @Put('medicine/:id')
  @ApiOperation({ summary: 'Chỉnh sửa thuốc của phiếu khám' })
  @ApiBody({
    type: UpdateMedicalRecordMedicineDTO,
  })
  async updateMedicalRecordMedicine(
    @Body() updateDTO: UpdateMedicalRecordMedicineDTO,
    @Param('id') id: string,
  ) {
    await this.medicalService.updateMedicalRecordMedicine(updateDTO, id);

    return {
      message: 'Cập nhật thuốc thành công',
    };
  }

  @Delete('medicine/:id')
  @ApiOperation({ summary: 'Xoá thuốc của phiếu khám' })
  async deleteMedicalRecordMedicine(@Param('id') id: string) {
    await this.medicalService.deleteMedicalRecordMedicine(id);

    return {
      message: 'Xoá thuốc thành công',
    };
  }
}
