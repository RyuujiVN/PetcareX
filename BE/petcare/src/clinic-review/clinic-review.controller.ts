import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClinicReviewService } from './clinic-review.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
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

  @Get()
  @RequiredRole(
    RoleEnum.ADMIN,
    RoleEnum.ADMIN_CLINIC,
    RoleEnum.CUSTOMER,
    RoleEnum.VETERINARIAN,
  )
  @ApiOperation({ summary: 'Lấy danh sách bài review của một phòng khám' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({ name: 'clinicId', required: true, type: String })
  getAllClinicReview(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('clinicId') clinicId: string,
  ) {
    return this.clinicReviewService.findAllReviewPagination({
      page,
      limit,
      clinicId,
    });
  }

  @Get(':id')
  @RequiredRole(
    RoleEnum.ADMIN,
    RoleEnum.ADMIN_CLINIC,
    RoleEnum.CUSTOMER,
    RoleEnum.VETERINARIAN,
  )
  @ApiOperation({ summary: 'Lấy chi tiết bài review' })
  getDetailClinicReview(@Param('id') id: string) {
    return this.clinicReviewService.findOneById(id);
  }

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
