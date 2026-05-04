import { Clinic } from 'src/clinic/entities/clinic.entity';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateClinicWithAdminDTO } from './dtos/create-clinic-with-admin.dto';
import { ClinicService } from './clinic.service';
import { UpdateClinicDTO } from './dtos/update-clinic.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { RoleGuard } from 'src/common/guards/role.guard';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('clinic')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(JwtAuthGuard, RoleGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get()
  @RequiredRole(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Phân trang phòng khám' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm theo tên phòng khám',
  })
  findAllPagination(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<Pagination<Clinic>> {
    return this.clinicService.findAllPagination({
      page,
      limit,
      search,
    });
  }

  @Get('user')
  // @RequiredRole(
  //   RoleEnum.ADMIN,
  //   RoleEnum.ADMIN_CLINIC,
  //   RoleEnum.VETERINARIAN,
  //   RoleEnum.CUSTOMER,
  // )
  @ApiOperation({ summary: 'Phân trang phòng khám gần nhất của bên user' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({ name: 'lat', required: true, type: Number, default: 0 })
  @ApiQuery({ name: 'lon', required: true, type: Number, default: 0 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm theo tên phòng khám',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['distance', 'rating'],
    description:
      'Sắp xếp: distance (gần nhất, mặc định) hoặc rating (rating cao nhất)',
  })
  getNearbyClinics(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('lat') lat: number,
    @Query('lon') lon: number,
    @Query('sortBy', new DefaultValuePipe('distance'))
    sortBy?: 'distance' | 'rating',
    @Query('search') search?: string,
  ) {
    return this.clinicService.findAllPaginationUser({
      page,
      limit,
      search,
      lat,
      lon,
      sortBy,
    });
  }

  @Get(':id')
  @RequiredRole(
    RoleEnum.ADMIN,
    RoleEnum.ADMIN_CLINIC,
    RoleEnum.VETERINARIAN,
    RoleEnum.CUSTOMER,
  )
  @ApiOperation({ summary: 'Chi tiết phòng khám' })
  getDetailClinic(@Param('id') id: string): Promise<Clinic> {
    return this.clinicService.findOneById(id);
  }

  @Post()
  @RequiredRole(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Tạo mới phòng khám' })
  @ApiBody({
    type: CreateClinicWithAdminDTO,
  })
  createClinic(@Body() bodyDTO: CreateClinicWithAdminDTO): Promise<Clinic> {
    return this.clinicService.createClinic(bodyDTO.clinic, bodyDTO.admin);
  }

  @Put(':id')
  @RequiredRole(RoleEnum.ADMIN, RoleEnum.ADMIN_CLINIC)
  @ApiOperation({ summary: 'Chỉnh sửa thông tin phòng khám' })
  @ApiBody({
    type: UpdateClinicDTO,
  })
  async updateClinic(
    @Param('id') id: string,
    @Body() bodyDTO: UpdateClinicDTO,
  ) {
    await this.clinicService.updateClinic(id, bodyDTO);

    return {
      message: 'Cập nhật thành công',
    };
  }

  @Delete(':id')
  @RequiredRole(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Xoá phòng khám' })
  async deleteClinic(@Param('id') id: string) {
    await this.clinicService.deleteClinic(id);

    return {
      message: 'Xoá thành công',
    };
  }
}
