import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginGoogleDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Google id token không được để trống' })
  googleIdToken: string;
}
