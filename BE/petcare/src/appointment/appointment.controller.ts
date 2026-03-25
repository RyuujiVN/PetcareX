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

@Controller('appointment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('my')
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
      req?.user?.id,
    );
  }

  @Get('clinic/my')
  @ApiOperation({ summary: 'Danh sách lịch hẹn theo phòng khám của tài khoản đăng nhập' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  getMyClinicAppointment(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Req() req,
  ) {
    return this.appointmentService.findAllMyClinicAppointments(
      {
        page,
        limit,
      },
      req?.user?.id,
    );
  }

  @Post('')
  @ApiOperation({ summary: 'Tạo mới lịch hẹn' })
  @ApiBody({
    type: CreateAppointmentDTO,
  })
  createAppointment(@Body() createDTO: CreateAppointmentDTO) {
    return this.appointmentService.createAppointment(createDTO);
  }

  @Put(':id')
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
  @ApiOperation({ summary: 'Cập nhật trạng thái lịch hẹn' })
  @ApiBody({
    type: UpdateAppointmentStatusDTO,
  })
  async updateAppointmentStatus(
    @Body() updateDTO: UpdateAppointmentStatusDTO,
    @Param('id') id: string,
  ) {
    await this.appointmentService.updateAppointmentStatus(updateDTO, id);
    return {
      message: 'Cập nhật lịch hẹn thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá lịch hẹn' })
  async deleteAppointment(@Param('id') id: string) {
    await this.appointmentService.deleteAppointment(id);
    return {
      message: 'Xoá lịch hẹn thành công',
    };
  }
}
