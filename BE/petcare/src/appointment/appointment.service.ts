import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { paginate } from 'nestjs-typeorm-paginate';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import { NotificationEnum } from 'src/common/enums/notification.enum';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { SenderNotificationEnum } from 'src/common/enums/sender-notification.enum';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { Repository } from 'typeorm';
import { CreateAppointmentDTO } from './dtos/create-appointment.dto';
import { UpdateAppointmentStatusDTO } from './dtos/update-appointment-status.dto';
import { UpdateAppointmentDTO } from './dtos/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { AppointmentPagination } from './types/appointment-pagination.type';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectQueue(QueueNameEnum.APPOINTMENT)
    private readonly analyzeSymptomsQueue: Queue,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async findOneById(appointmentId: string) {
    return await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.id = :id', { id: appointmentId })
      .innerJoin('appointment.pet', 'pet')
      .innerJoin('appointment.clinic', 'clinic')
      .innerJoin('appointment.veterinarian', 'veterinarian')
      .innerJoin('pet.owner', 'owner')
      .innerJoin('veterinarian.user', 'user')
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
        'pet.species',
        'pet.breed',

        'clinic.id',
        'clinic.name',
        'clinic.address',

        'owner.id',
        'owner.fullName',
        'owner.phone',

        'veterinarian.specialty',

        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .getOne();
  }

  // Danh sách lịch hẹn của người dùng
  async findAllMyAppointments(options: AppointmentPagination, userId: string) {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.pet', 'pet')
      .leftJoin('appointment.clinic', 'clinic')
      .leftJoin('appointment.veterinarian', 'veterinarian')
      .leftJoin('pet.owner', 'owner')
      .leftJoin('veterinarian.user', 'user')
      .where('owner.id = :userId', { userId: userId })
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
        'pet.species',
        'pet.breed',

        'clinic.id',
        'clinic.name',
        'clinic.address',

        'owner.id',
        'owner.fullName',

        'veterinarian.specialty',

        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('appointment.createdAt', 'DESC');

    return paginate<Appointment>(queryBuilder, options);
  }

  // Danh sách lịch hẹn của phòng khám
  async findAllClinicAppointments(
    options: AppointmentPagination,
    clinicId: string,
  ) {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.pet', 'pet')
      .leftJoin('appointment.clinic', 'clinic')
      .leftJoin('appointment.veterinarian', 'veterinarian')
      .leftJoin('pet.owner', 'owner')
      .leftJoin('veterinarian.user', 'user')
      .where('appointment.clinicId = :clinicId', { clinicId: clinicId })
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
        'pet.species',
        'pet.breed',
        'pet.gender',
        'pet.dateOfBirth',
        'pet.note',

        'clinic.id',
        'clinic.name',
        'clinic.address',

        'owner.id',
        'owner.fullName',
        'owner.phone',

        'veterinarian.specialty',

        'user.id',
        'user.fullName',
        'user.avatarUrl',
      ])
      .orderBy('appointment.createdAt', 'DESC');

    if (options.appointmentDate)
      queryBuilder.andWhere('appointment.appointmentDate = :date', {
        date: new Date(options.appointmentDate),
      });

    if (options.appointmentTime)
      queryBuilder.andWhere('appointment.appointmentTime = :time', {
        time: options.appointmentTime,
      });

    return paginate<Appointment>(queryBuilder, options);
  }

  // Tạo mới lịch hẹn
  async createAppointment(
    createDTO: CreateAppointmentDTO,
    user: { id: string; fullName?: string },
  ) {
    const savedAppointment =
      await this.appointmentRepository.manager.transaction(async (manager) => {
        const appointmentRepo = manager.getRepository(Appointment);
        const notificationRepo = manager.getRepository(Notification);
        const adminClinicRepo = manager.getRepository(AdminClinic);

        // 1. Lưu lịch hẹn
        const appointment = appointmentRepo.create(createDTO);
        appointment.status = AppointmentStatusEnum.BOOKED;
        const createdAppointment = await appointmentRepo.save(appointment);

        // Lấy admin clinic theo clinicId của lịch hẹn
        const adminClinic = await adminClinicRepo.findOne({
          where: { clinicId: createdAppointment.clinicId },
          select: { userId: true },
        });

        // 2. Lưu thông báo cho admin clinic và veterinarian
        const notificationAdminClinic = notificationRepo.create({
          recipientId: adminClinic?.userId,
          senderId: user.id,
          senderType: SenderNotificationEnum.SYSTEM,
          type: NotificationEnum.APPOINTMENT_BOOKED,
          target: {
            appointmentDate: createdAppointment.appointmentDate,
            appointmentTime: createdAppointment.appointmentTime,
            appointmentId: createdAppointment.id,
            userName: user.fullName ?? '',
          },
        });

        const notificationVeterinarian = notificationRepo.create({
          recipientId: createdAppointment.veterinarianId,
          senderId: user.id,
          senderType: SenderNotificationEnum.SYSTEM,
          type: NotificationEnum.APPOINTMENT_BOOKED,
          target: {
            appointmentDate: createdAppointment.appointmentDate,
            appointmentTime: createdAppointment.appointmentTime,
            appointmentId: createdAppointment.id,
            userName: user.fullName ?? '',
          },
        });

        const notifications = await Promise.all([
          notificationRepo.save(notificationAdminClinic),
          notificationRepo.save(notificationVeterinarian),
        ]);

        // 3. Gửi thông báo realtime cho client sau khi tạo thành công
        notifications.forEach((item) => {
          this.notificationGateway.sendNotificationToClient(
            item.recipientId,
            item,
          );
        });

        return createdAppointment;
      });

    // 4. Gửi triệu chứng về cho AI phân tích
    await this.analyzeSymptomsQueue.add(
      JobNameEnum.ANALYZE_SYMPTOMS,
      {
        ...savedAppointment,
        userId: user.id,
      },
      {
        attempts: 4,
        removeOnComplete: true,
        removeOnFail: true,
        backoff: {
          type: 'exponential',
          delay: 4000,
        },
      },
    );

    return savedAppointment;
  }

  // Cập nhật lịch hẹn
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

  // Cập nhật trạng thái lịch hẹn
  async updateAppointmentStatus(
    updateDTO: UpdateAppointmentStatusDTO,
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

  // Xoá lịch hẹn
  async deleteAppointment(appointmentId: string) {
    const result = await this.appointmentRepository.delete(appointmentId);

    if (result.affected === 0)
      throw new BadRequestException('Không tìm thấy lịch hẹn');
  }
}
