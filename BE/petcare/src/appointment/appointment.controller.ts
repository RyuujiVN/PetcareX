import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateAppointmentDTO } from './dtos/create-appointment.dto';
import { UpdateAppointmentDTO } from './dtos/update-appointment.dto';
import { UpdateAppointmentStatusDTO } from './dtos/update-appointment-status.dto';

@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

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
