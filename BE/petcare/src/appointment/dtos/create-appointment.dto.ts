import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { ServiceEnum } from 'src/common/enums/service.enum';

export class CreateAppointmentDTO {
  @ApiProperty()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  petId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  veterinarianId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  clinicId: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Ngày hẹn không được để trống' })
  @IsDateString({}, { message: 'Ngày hẹn phải đúng định dạng YYYY-MM-DD' })
  appointmentDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Giờ hẹn không được để trống' })
  appointmentTime: string;

  @ApiProperty({ enum: ServiceEnum })
  @IsEnum(ServiceEnum)
  @IsNotEmpty({ message: 'Dịch vụ không được để trống' })
  service: ServiceEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Ghi chú bệnh không được để trống' })
  note: string;
}
