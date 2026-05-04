import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('revenue')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('summary')
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Tóm tắt hoá đơn hôm nay của phòng khám' })
  getSummaryTodayAdminClinic(@Req() req) {
    return this.revenueService.getSummaryTodayAdminClinic(req?.user?.clinicId);
  }

  @Get('chart')
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Doanh thu của phòng khám' })
  @ApiQuery({
    name: 'dateStart',
    required: true,
    type: Date,
    default: new Date(),
  })
  @ApiQuery({
    name: 'dateEnd',
    required: true,
    type: Date,
    default: new Date(),
  })
  @ApiQuery({
    name: 'groupBy',
    required: true,
    type: String,
    default: 'DAY',
  })
  getChart(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
    @Query('groupBy') groupBy: 'DAY' | 'MONTH',
    @Req() req,
  ) {
    return this.revenueService.getRevenueLineChart(
      {
        dateStart,
        dateEnd,
        groupBy,
      },
      req?.user?.clinicId,
    );
  }

  @Get('top-veterinarian')
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Top 5 bác sĩ của tháng' })
  getTopVeterinarian(@Req() req) {
    return this.revenueService.topVeterinarian(req?.user?.clinicId);
  }

  @Get('summary-for-admin')
  @RequiredRole(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Tóm tắt số lượng phòng khám' })
  getSummaryTodayAdmin() {
    return this.revenueService.getSummaryTodayAdmin();
  }

  @Get('top-booked-clinic')
  @RequiredRole(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Top phòng khám đặt nhiều nhất' })
  @ApiQuery({
    name: 'orderByType',
    required: true,
    type: String,
    description: 'Sắp xếp theo tăng dần hay giảm dần. VD: "DESC"',
  })
  getTopBookedClinics(@Query('orderByType') orderByType: 'ASC' | 'DESC') {
    return this.revenueService.getTopBookedClinics({
      orderByType,
    });
  }
}
