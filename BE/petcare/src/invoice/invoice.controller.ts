import { Body, Controller, Post } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateInvoiceDTO } from './dtos/create-invoice.dto';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('')
  @ApiOperation({ summary: 'Tạo mới hoá đơn' })
  @ApiBody({
    type: CreateInvoiceDTO,
  })
  createInvoice(@Body() createDTO: CreateInvoiceDTO) {
    return this.invoiceService.createInvoice(createDTO);
  }
}
