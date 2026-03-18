import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateInvoiceDTO } from './dtos/create-invoice.dto';
import { UpdateInvoiceDTO } from './dtos/update-invoice.dto';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':medicalRecordId')
  @ApiOperation({ summary: 'Lấy hoá đơn theo phiếu khám' })
  getOneByMedicalRecordId(@Param('medicalRecordId') medicalRecordId: string) {
    return this.invoiceService.findOneByMedicalRecordId(medicalRecordId);
  }

  @Post('')
  @ApiOperation({ summary: 'Tạo mới hoá đơn' })
  @ApiBody({
    type: CreateInvoiceDTO,
  })
  createInvoice(@Body() createDTO: CreateInvoiceDTO) {
    return this.invoiceService.createInvoice(createDTO);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Chỉnh sửa hoá đơn' })
  @ApiBody({
    type: UpdateInvoiceDTO,
  })
  async updateInvoice(
    @Param('id') id: string,
    @Body() updateDTO: UpdateInvoiceDTO,
  ) {
    await this.invoiceService.updateInvoice(updateDTO, id);

    return {
      message: 'Cập nhật hoá đơn thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá hoá đơn' })
  async deleteInvoice(@Param('id') id: string) {
    await this.invoiceService.deleteInvoice(id);

    return {
      message: 'Xoá hoá đơn thành công',
    };
  }
}
