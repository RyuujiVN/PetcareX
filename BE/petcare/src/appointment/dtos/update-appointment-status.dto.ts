import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';

export class UpdateAppointmentStatusDTO {
  @ApiProperty({ enum: AppointmentStatusEnum })
  @IsEnum(AppointmentStatusEnum)
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status: string;
}
