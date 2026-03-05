import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { CreateAppointmentDTO } from './dtos/create-appointment.dto';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import { UpdateAppointmentDTO } from './dtos/update-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async findOneById(appointmentId: string) {
    return await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.id = :id', { id: appointmentId })
      .innerJoin('appointment.pet', 'pet')
      .innerJoin('appointment.clinic', 'clinic')
      .innerJoin('pet.breed', 'breed')
      .innerJoin('pet.owner', 'owner')
      .select([
        'appointment.id',
        'appointment.appointmentDate',
        'appointment.appointmentTime',
        'appointment.service',
        'appointment.note',
        'appointment.status',
        'pet.id',
        'pet.name',
        'pet.avatar',
        'clinic.id',
        'clinic.name',
        'clinic.address',
        'breed.id',
        'breed.name',
        'owner.id',
        'owner.fullName',
      ])
      .getOne();
  }

  async createAppointment(createDTO: CreateAppointmentDTO) {
    const appointment = this.appointmentRepository.create(createDTO);
    appointment.status = AppointmentStatusEnum.HEN_THANH_CONG;

    const savedAppointment = await this.appointmentRepository.save(appointment);

    return await this.findOneById(savedAppointment.id);
  }

  async updateAppointment(
    updateDTO: UpdateAppointmentDTO,
    appointmentId: string,
  ) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) throw new NotFoundException('Không tìm thấy lịch hẹn');
    Object.assign(appointment, updateDTO);

    await this.appointmentRepository.save(appointment);
  }
}
