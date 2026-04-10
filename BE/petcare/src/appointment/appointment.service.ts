import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { paginate } from 'nestjs-typeorm-paginate';
import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import { NotificationEnum } from 'src/common/enums/notification.enum';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { Repository } from 'typeorm';
import { CreateAppointmentDTO } from './dtos/create-appointment.dto';
import { UpdateAppointmentStatusDTO } from './dtos/update-appointment-status.dto';
import { UpdateAppointmentDTO } from './dtos/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { AppointmentPagination } from './types/appointment-pagination.type';
import { Not } from 'typeorm';
import { RoleEnum } from 'src/common/enums/role.enum';
import { AiDiagnosis } from 'src/ai-diagnosis/entities/ai-diagnosis.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectQueue(QueueNameEnum.APPOINTMENT)
    private readonly analyzeSymptomsQueue: Queue,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AdminClinic)
    private readonly adminClinicRepository: Repository<AdminClinic>,
    @InjectRepository(AiDiagnosis)
    private readonly aiDiagnosisRepository: Repository<AiDiagnosis>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // Lấy kết quả chẩn đoán AI của lịch hẹn
  async getResultAiDianosis(appointmentId: string) {
    const queryBuilder = this.aiDiagnosisRepository
      .createQueryBuilder('aiDiagnosis')
      .leftJoin('aiDiagnosis.pet', 'pet')
      .addSelect(['pet.name', 'pet.avatar', 'pet.breed', 'pet.ownerId'])
      .where('aiDiagnosis.appointmentId = :id', { id: appointmentId });

    return queryBuilder.getOne();
  }

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
  async findAllMyAppointments(
    options: AppointmentPagination,
    user: { id: string; role: string },
  ) {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.pet', 'pet')
      .leftJoin('appointment.clinic', 'clinic')
      .leftJoin('appointment.veterinarian', 'veterinarian')
      .leftJoin('pet.owner', 'owner')
      .leftJoin('veterinarian.user', 'user')
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

    if (user.role === RoleEnum.CUSTOMER) {
      queryBuilder.where('owner.id = :userId', { userId: user.id });
    } else if (user.role === RoleEnum.VETERINARIAN) {
      queryBuilder.where('veterinarian.userId = :userId', { userId: user.id });
    }

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
    // 1. Kiểm tra lịch có đặt trước 6 tiếng không
    const appointmentDateTime = new Date(createDTO.appointmentDate);
    const [hours, minutes] = createDTO.appointmentTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const minimumBookingTime = new Date();
    minimumBookingTime.setHours(minimumBookingTime.getHours() + 3);
    if (appointmentDateTime < minimumBookingTime) {
      throw new BadRequestException(
        'Lịch hẹn phải được đặt trước ít nhất 3 tiếng',
      );
    }

    // 2. Kiểm tra xem lịch có bị đặt trùng không
    const duplicatedAppointment = await this.appointmentRepository.findOne({
      where: {
        veterinarianId: createDTO.veterinarianId,
        appointmentDate: createDTO.appointmentDate,
        appointmentTime: createDTO.appointmentTime,
        status: Not(AppointmentStatusEnum.CANCELLED),
      },
      select: {
        id: true,
      },
    });

    if (duplicatedAppointment) {
      throw new BadRequestException(
        'Khung giờ này đã có lịch hẹn, vui lòng chọn giờ khác',
      );
    }

    // Lấy admin clinic theo clinicId của lịch hẹn
    const adminClinic = await this.adminClinicRepository.findOne({
      where: { clinicId: createDTO.clinicId },
      select: { userId: true },
    });

    let notifications;

    const savedAppointment =
      await this.appointmentRepository.manager.transaction(async (manager) => {
        const appointmentRepo = manager.getRepository(Appointment);
        const notificationRepo = manager.getRepository(Notification);

        // 3. Lưu lịch hẹn
        const appointment = appointmentRepo.create(createDTO);
        appointment.status = AppointmentStatusEnum.BOOKED;
        const createdAppointment = await appointmentRepo.save(appointment);

        // 4. Lưu thông báo cho admin clinic và veterinarian
        const baseObj = {
          recipientId: null,
          type: NotificationEnum.APPOINTMENT_BOOKED,
          target: {
            appointmentDate: createdAppointment.appointmentDate,
            appointmentTime: createdAppointment.appointmentTime,
            appointmentId: createdAppointment.id,
            userName: user.fullName ?? '',
          },
        };

        const recipients = [
          {
            ...baseObj,
            recipientId: adminClinic?.userId,
          },
          {
            ...baseObj,
            recipientId: createdAppointment.veterinarianId,
          },
        ];

        notifications = await notificationRepo.save(recipients);

        return createdAppointment;
      });

    // 5. Gửi thông báo realtime cho client sau khi tạo thành công
    notifications.forEach((item) => {
      this.notificationGateway.sendNotification(item.recipientId, item);
    });

    // 6. Gửi triệu chứng về cho AI phân tích
    this.analyzeSymptomsQueue
      .add(
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
      )
      .catch((err) => {
        console.log('Analyze symptoms job failed:', err);
      });

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

  // Cập nhật trạng thái lịch hẹn từ phía phòng khám
  async updateAppointmentStatusByClinic(
    updateDTO: UpdateAppointmentStatusDTO,
    appointmentId: string,
  ) {
    // Cập nhật lịch hẹn
    await this.appointmentRepository.update(
      { id: appointmentId },
      { status: updateDTO.status },
    );

    const appointment = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.pet', 'pet')
      .leftJoin('appointment.clinic', 'clinic')
      .where('appointment.id = :appointmentId', { appointmentId })
      .select([
        'appointment.id',
        'appointment.appointmentDate',
        'appointment.appointmentTime',
        'appointment.status',

        'pet.ownerId',
        'clinic.name',
      ])
      .getOne();

    if (!appointment) throw new NotFoundException('Không tìm thấy lịch hẹn');

    // Nếu huỷ lịch thì gửi thông báo về client
    if (
      updateDTO.status === AppointmentStatusEnum.CANCELLED &&
      appointment.pet?.ownerId
    ) {
      const notificationRepo =
        this.appointmentRepository.manager.getRepository(Notification);
      const notification = notificationRepo.create({
        recipientId: appointment.pet.ownerId,
        type: NotificationEnum.APPOINTMENT_CANCELLED,
        target: {
          appointmentId: appointment.id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          clinicName: appointment.clinic?.name,
        },
      });
      const savedNotification = await notificationRepo.save(notification);

      this.notificationGateway.sendNotification(
        savedNotification.recipientId,
        savedNotification,
      );
    }
  }

  // Huỷ lịch hẹn từ phía client
  async updateAppointmentStatusByClient(
    appointmentId: string,
    user: { id: string; fullName: string },
  ) {
    const appointment = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.pet', 'pet')
      .leftJoin('appointment.clinic', 'clinic')
      .where('appointment.id = :appointmentId', { appointmentId })
      .select([
        'appointment.id',
        'appointment.clinicId',
        'appointment.veterinarianId',
        'appointment.appointmentDate',
        'appointment.appointmentTime',
        'appointment.status',

        'pet.ownerId',

        'clinic.name',
      ])
      .getOne();

    if (!appointment) throw new NotFoundException('Không tìm thấy lịch hẹn');

    if (appointment.pet?.ownerId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật lịch hẹn này');
    }

    // Cập nhật lịch hẹn
    await this.appointmentRepository.update(
      { id: appointmentId },
      { status: AppointmentStatusEnum.CANCELLED },
    );

    // Lấy admin clinic theo clinicId của lịch hẹn
    const adminClinic = await this.adminClinicRepository.findOne({
      where: { clinicId: appointment.clinicId },
      select: { userId: true },
    });

    // 4. Lưu thông báo cho admin clinic và veterinarian
    const baseObj = {
      recipientId: null,
      type: NotificationEnum.APPOINTMENT_BOOKED,
      target: {
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        appointmentId: appointment.id,
        userName: user.fullName ?? '',
      },
    };

    const recipients = [
      {
        ...baseObj,
        recipientId: adminClinic?.userId,
      },
      {
        ...baseObj,
        recipientId: appointment.veterinarianId,
      },
    ];

    const notifications = await this.notificationRepository.save(recipients);

    notifications.forEach((item) => {
      this.notificationGateway.sendNotification(item.recipientId, item);
    });
  }

  // Xoá lịch hẹn
  async deleteAppointment(appointmentId: string) {
    const result = await this.appointmentRepository.delete(appointmentId);

    if (result.affected === 0)
      throw new BadRequestException('Không tìm thấy lịch hẹn');
  }
}
