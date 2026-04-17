import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateReportDTO } from './dtos/create-report.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('report')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, UseGuards)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('')
  @RequiredRole(RoleEnum.CUSTOMER, RoleEnum.VETERINARIAN, RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Tạo mới báo cáo' })
  @ApiBody({
    type: CreateReportDTO,
  })
  createReport(@Body() createDTO: CreateReportDTO, @Req() req) {
    return this.reportService.createReport(createDTO, req?.user);
  }
}
