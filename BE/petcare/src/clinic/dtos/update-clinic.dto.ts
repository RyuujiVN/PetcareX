import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClinicDTO } from './create-clinic.dto';
import { IsOptional, IsString, Matches } from 'class-validator';
import { regex } from 'src/common/constants/rexgex.constant';

export class UpdateClinicDTO extends PartialType(CreateClinicDTO) {
  @ApiProperty({
    example: '08:00',
  })
  @IsString()
  @IsOptional()
  @Matches(regex.timeRegex, {
    message: 'Thời gian mở cửa phải đúng theo HH:MM format',
  })
  openingTime?: string;

  @ApiProperty({
    example: '08:00',
  })
  @IsString()
  @IsOptional()
  @Matches(regex.timeRegex, {
    message: 'Thời gian đóng cửa phải đúng theo HH:MM format',
  })
  closingTime?: string;
}
