import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateReportDTO } from './dtos/create-report.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { ReportStatusEnum, ReportTypeEnum } from 'src/common/enums/report.enum';

@Controller('report')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, UseGuards)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('')
  @RequiredRole(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách báo cáo' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'targetType', required: false, type: String })
  getAllReport(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status: ReportStatusEnum,
    @Query('targetType') targetType: ReportTypeEnum,
  ) {
    return this.reportService.findAllPagination({
      page,
      limit,
      status,
      targetType,
    });
  }

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
