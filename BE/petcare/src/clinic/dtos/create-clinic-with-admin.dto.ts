import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateClinicDTO } from './create-clinic.dto';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClinicWithAdminDTO {
  @ApiProperty({ type: CreateClinicDTO })
  @ValidateNested()
  @Type(() => CreateClinicDTO)
  clinic: CreateClinicDTO;

  @ApiProperty({ type: CreateUserDTO })
  @ValidateNested()
  @Type(() => CreateUserDTO)
  admin: CreateUserDTO;
}
