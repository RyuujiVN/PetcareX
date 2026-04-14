import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ClinicReviewService } from './clinic-review.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CreateClinicReviewDTO } from './dtos/create-clinic-review.dto';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('clinic-review')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ClinicReviewController {
  constructor(private readonly clinicReviewService: ClinicReviewService) {}

  @Post()
  @RequiredRole(RoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Thêm mới bài review' })
  @ApiBody({
    type: CreateClinicReviewDTO,
  })
  async createClinicReview(
    @Body() createDTO: CreateClinicReviewDTO,
    @Req() req: any,
  ) {
    await this.clinicReviewService.createClinicReview(createDTO, req?.user?.id);

    return {
      message: 'Thêm mới review thành công',
    };
  }
}
