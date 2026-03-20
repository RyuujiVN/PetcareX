import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInvoiceDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id khách hàng không được để trống' })
  petOwnerId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id phiếu khám không được để trống' })
  medicalRecordId: string;
}
