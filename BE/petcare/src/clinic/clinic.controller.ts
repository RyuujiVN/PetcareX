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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateClinicWithAdminDTO } from './dtos/create-clinic-with-admin.dto';
import { ClinicService } from './clinic.service';
import { UpdateClinicDTO } from './dtos/update-clinic.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from 'src/common/pipes/file-validate.pipe';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('clinic')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(
    private readonly clinicService: ClinicService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phòng khám' })
  getDetailClinic(@Param('id') id: string): Promise<Clinic> {
    return this.clinicService.findOneById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới phòng khám' })
  @ApiBody({
    type: CreateClinicWithAdminDTO,
  })
  createClinic(@Body() bodyDTO: CreateClinicWithAdminDTO): Promise<Clinic> {
    return this.clinicService.createClinic(bodyDTO.clinic, bodyDTO.admin);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Tải ảnh avatar thú cưng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File,
  ) {
    const fileUrl = await this.cloudinaryService.uploadFile(file);

    return {
      file: fileUrl.secure_url,
    };
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
