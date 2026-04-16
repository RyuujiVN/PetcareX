import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateInvoiceDTO } from './dtos/create-invoice.dto';
import { UpdateInvoiceDTO } from './dtos/update-invoice.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';

@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':medicalRecordId')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.VETERINARIAN)
  @ApiOperation({ summary: 'Lấy hoá đơn theo phiếu khám' })
  getOneByMedicalRecordId(@Param('medicalRecordId') medicalRecordId: string) {
    return this.invoiceService.findOneByMedicalRecordId(medicalRecordId);
  }

  @Get('')
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Danh sách hoá đơn của phòng khám' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({ name: 'status', required: false, type: String, default: 10 })
  getAllPagination(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: InvoiceStatusEnum,
  ) {
    return this.invoiceService.findAllPagination(
      {
        page,
        limit,
        status,
      },
      req?.user?.clinicId,
    );
  }

  @Post('')
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Tạo mới hoá đơn' })
  @ApiBody({
    type: CreateInvoiceDTO,
  })
  createInvoice(@Body() createDTO: CreateInvoiceDTO, @Req() req) {
    return this.invoiceService.createInvoice(createDTO, req?.user?.clinicId);
  }

  @Patch(':id')
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Chỉnh sửa hoá đơn' })
  @ApiBody({
    type: UpdateInvoiceDTO,
  })
  async updateInvoice(
    @Param('id') id: string,
    @Body() updateDTO: UpdateInvoiceDTO,
    @Req() req,
  ) {
    await this.invoiceService.updateInvoice(updateDTO, id, req?.user?.id);

    return {
      message: 'Cập nhật hoá đơn thành công',
    };
  }

  @Delete(':id')
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Xoá hoá đơn' })
  async deleteInvoice(@Param('id') id: string) {
    await this.invoiceService.deleteInvoice(id);

    return {
      message: 'Xoá hoá đơn thành công',
    };
  }
}
