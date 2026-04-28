import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VeterinarySpecialtyEnum } from 'src/common/enums/veterinary-specialty.enum';
import { UpdateUserDTO } from 'src/user/dtos/update-user.dto';

export class UpdateVeterinarianDTO extends UpdateUserDTO {
  @ApiProperty()
  @IsOptional()
  @IsEnum(VeterinarySpecialtyEnum)
  specialty?: VeterinarySpecialtyEnum;

  @ApiProperty()
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  introduce?: string;
}
