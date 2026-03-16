import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInvoiceDTO {
  @IsUUID()
  @IsNotEmpty({ message: 'Id khách hàng không được để trống' })
  petOwnerId: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Id phiếu khám không được để trống' })
  medicalRecordId: string;
}
