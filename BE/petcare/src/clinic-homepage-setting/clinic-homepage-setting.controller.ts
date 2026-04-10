import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CreateClinicHomepageSettingDTO } from './dtos/clinic-homepage-setting.dto';
import { ClinicHomepageSettingService } from './clinic-homepage-setting.service';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('clinic-homepage-setting')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ClinicHomepageSettingController {
  constructor(
    private readonly clinicHomepageSettingService: ClinicHomepageSettingService,
  ) {}

  @Get(':clinicId')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.CUSTOMER, RoleEnum.VETERINARIAN)
  @ApiOperation({ summary: 'Lấy setting phòng khám' })
  getClinicHomepageSetting(@Param('clinicId') clinicId: string) {
    return this.clinicHomepageSettingService.getClinicHomepageSetting(clinicId);
  }

  @Put()
  @RequiredRole(RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Chỉnh sửa setting phòng khám' })
  @ApiBody({
    type: CreateClinicHomepageSettingDTO,
  })
  async updateClinicHomepageSetting(
    @Body() createDTO: CreateClinicHomepageSettingDTO,
    @Req() req,
  ) {
    await this.clinicHomepageSettingService.updateClinicHomepageSetting(
      createDTO,
      req?.user?.clinicId,
    );

    return {
      message: 'Cập nhật setting thành công',
    };
  }
}
