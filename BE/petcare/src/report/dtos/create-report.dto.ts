import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ReportTypeEnum } from 'src/common/enums/report.enum';

export class CreateReportDTO {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty({ message: 'Id của target không được bỏ trống' })
  targetId: string;

  @ApiProperty({ enum: ReportTypeEnum })
  @IsEnum(ReportTypeEnum)
  @IsNotEmpty({ message: 'Loại target không được để trống' })
  targetType: ReportTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Lí do report không được để trống' })
  reason: string;
}
