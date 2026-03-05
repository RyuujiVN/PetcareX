import { Body, Controller, Post } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateAppointmentDTO } from './dtos/create-appointment.dto';

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
}
