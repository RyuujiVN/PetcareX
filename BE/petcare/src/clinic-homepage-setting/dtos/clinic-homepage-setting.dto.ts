import { ApiProperty } from '@nestjs/swagger';
import { IsJSON, IsNotEmpty } from 'class-validator';

export class CreateClinicHomepageSettingDTO {
  @ApiProperty()
  @IsJSON()
  @IsNotEmpty()
  settings: string;
}
