import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Report } from './entities/report.entity';
import { Repository } from 'typeorm';
import { CreateReportDTO } from './dtos/create-report.dto';
import { User } from 'src/user/entities/user.entity';
import { ReportStatusEnum } from 'src/common/enums/report.enum';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/notification/entities/notification.entity';
import { RoleEnum } from 'src/common/enums/role.enum';
import { NotificationEnum } from 'src/common/enums/notification.enum';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createReport(createDTO: CreateReportDTO, user: User) {
    const report = this.reportRepository.create(createDTO);
    report.status = ReportStatusEnum.PENDING;
    report.reporterId = user.id;

    const savedReport = await this.reportRepository.save(report);

    try {
      const admin = await this.userRepository.findOne({
        where: { role: RoleEnum.ADMIN },
        select: { id: true },
      });

      if (!admin) throw new NotFoundException('Không tìm thấy admin');

      const notification = new Notification();
      notification.recipientId = admin.id;
      notification.type = NotificationEnum.REPORT;
      notification.target = {
        reporterName: user.fullName,
        avatarUrl: user.avatarUrl,
        reportType: savedReport.targetType,
        reportId: savedReport.id,
      };

      const savedNotification =
        await this.notificationRepository.save(notification);

      this.notificationGateway.sendNotification(
        savedNotification.recipientId,
        savedNotification,
      );
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }

    return savedReport;
  }
}
