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

@Controller('clinic')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get()
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

  @Post()
  @ApiOperation({ summary: 'Tạo mới phòng khám' })
  @ApiBody({
    type: CreateClinicWithAdminDTO,
  })
  createClinic(@Body() bodyDTO: CreateClinicWithAdminDTO): Promise<Clinic> {
    return this.clinicService.createClinic(bodyDTO.clinic, bodyDTO.admin);
  }

  @Put(':id')
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
  @ApiOperation({ summary: 'Xoá phòng khám' })
  @ApiBody({
    type: UpdateClinicDTO,
  })
  async deleteClinic(@Param('id') id: string) {
    await this.clinicService.deleteClinic(id);

    return {
      message: 'Xoá thành công',
    };
  }
}
