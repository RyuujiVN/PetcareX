import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinDate,
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
  @Transform(({ value }) => value && new Date(value))
  @IsDate({ message: 'Ngày hẹn phải đúng định dạng YYYY-MM-DD' })
  @MinDate(new Date(), {
    message: 'Ngày hẹn phải lớn hơn ngày hiện tại',
  })
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
