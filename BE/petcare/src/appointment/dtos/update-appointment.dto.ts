import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDTO } from './create-appointment.dto';

export class UpdateAppointmentDTO extends PartialType(CreateAppointmentDTO) {}
