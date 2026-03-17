import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';

export class UpdateInvoiceDTO {
  @ApiProperty()
  @IsOptional()
  @IsEnum(InvoiceStatusEnum)
  status: InvoiceStatusEnum;

  @ApiProperty()
  @IsString()
  @IsOptional()
  note: string;
}
