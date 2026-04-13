import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDTO } from './dtos/create-appointment.dto';
import { UpdateAppointmentStatusDTO } from './dtos/update-appointment-status.dto';
import { UpdateAppointmentDTO } from './dtos/update-appointment.dto';
import { RequiredRole } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/role.guard';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('appointment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('my')
  @RequiredRole(RoleEnum.VETERINARIAN, RoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Danh sách lịch hẹn của riêng người dùng' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  getMyAppointments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Req() req,
  ) {
    return this.appointmentService.findAllMyAppointments(
      {
        page,
        limit,
      },
      req?.user,
    );
  }

  @Get('')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.VETERINARIAN)
  @ApiOperation({ summary: 'Danh sách lịch hẹn của riêng phòng khám' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({
    name: 'appointmentDate',
    required: false,
    type: Date,
    description: 'Lọc theo ngày',
  })
  @ApiQuery({
    name: 'appointmentTime',
    required: false,
    type: String,
    description: 'Lọc theo giờ (HH:MM)',
    example: '09:00',
  })
  getAppointments(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('appointmentDate') appointmentDate?: Date,
    @Query('appointmentTime') appointmentTime?: string,
  ) {
    return this.appointmentService.findAllClinicAppointments(
      {
        page,
        limit,
        appointmentDate,
        appointmentTime,
      },
      req?.user?.clinicId,
    );
  }

  @Get(':id/ai-diagnosis')
  @RequiredRole(RoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Lấy kết quả chẩn đoán AI của lịch hẹn' })
  getResultAiDiagnosis(@Param('id') id: string) {
    return this.appointmentService.getResultAiDianosis(id);
  }

  @Post('')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Tạo mới lịch hẹn' })
  @ApiBody({
    type: CreateAppointmentDTO,
  })
  createAppointment(@Body() createDTO: CreateAppointmentDTO, @Req() req) {
    return this.appointmentService.createAppointment(createDTO, req?.user);
  }

  @Put(':id')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.VETERINARIAN, RoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Chỉnh sửa lịch hẹn' })
  @ApiBody({
    type: UpdateAppointmentDTO,
  })
  async updateAppointment(
    @Body() updateDTO: UpdateAppointmentDTO,
    @Param('id') id: string,
  ) {
    await this.appointmentService.updateAppointment(updateDTO, id);
    return {
      message: 'Cập nhật lịch hẹn thành công',
    };
  }

  @Patch(':id')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.VETERINARIAN)
  @ApiOperation({ summary: 'Cập nhật trạng thái lịch hẹn' })
  @ApiBody({
    type: UpdateAppointmentStatusDTO,
  })
  async updateAppointmentStatus(
    @Body() updateDTO: UpdateAppointmentStatusDTO,
    @Param('id') id: string,
  ) {
    await this.appointmentService.updateAppointmentStatusByClinic(
      updateDTO,
      id,
    );
    return {
      message: 'Cập nhật lịch hẹn thành công',
    };
  }

  @Patch('client/:id')
  @RequiredRole(RoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Client huỷ lịch hẹn' })
  async updateAppointmentStatusByClient(@Param('id') id: string, @Req() req) {
    await this.appointmentService.updateAppointmentStatusByClient(
      id,
      req?.user,
    );
    return {
      message: 'Cập nhật lịch hẹn thành công',
    };
  }

  @Delete(':id')
  @RequiredRole(RoleEnum.ADMIN_CLINIC, RoleEnum.CUSTOMER)
  @ApiOperation({ summary: 'Xoá lịch hẹn' })
  async deleteAppointment(@Param('id') id: string) {
    await this.appointmentService.deleteAppointment(id);
    return {
      message: 'Xoá lịch hẹn thành công',
    };
  }
}
