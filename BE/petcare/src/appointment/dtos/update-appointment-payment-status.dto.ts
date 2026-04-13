import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';

export class UpdateAppointmentPaymentStatusDTO {
  @ApiProperty({ enum: InvoiceStatusEnum })
  @IsEnum(InvoiceStatusEnum)
  paymentStatus: InvoiceStatusEnum;
}
