/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import axios from 'axios';
import { Job } from 'bullmq';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { AiDiagnosis } from 'src/ai-diagnosis/entities/ai-diagnosis.entity';
import { DataSource } from 'typeorm';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationEnum } from 'src/common/enums/notification.enum';
import { Pet } from 'src/pet/entities/pet.entity';
import { NotFoundError } from 'rxjs';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Processor(QueueNameEnum.APPOINTMENT, { concurrency: 5 })
export class AppointmentProcessor extends WorkerHost {
  constructor(
    private readonly configService: ConfigService,
    private readonly notificationGateway: NotificationGateway,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    switch (job.name) {
      case JobNameEnum.ANALYZE_SYMPTOMS: {
        console.log('Đang chạy job AI phân tích bệnh');
        await this.dataSource.transaction(async (manager) => {
          try {
            const appointment = job.data;
            const linkConnectAI =
              this.configService.get<string>('LINK_CONNECT_AI');
            const aiDiagnosisRepo = manager.getRepository(AiDiagnosis);

            // 1. Gửi triệu chứng tới AI để phân tích
            const response = await axios.post(`${linkConnectAI}/api/triage`, {
              symptoms: appointment.note,
            });

            // 2. Lưu phản hồi của AI vào database
            const aiDiagnosis = aiDiagnosisRepo.create();
            aiDiagnosis.petId = appointment.petId;
            aiDiagnosis.appoinmentId = appointment.id;
            aiDiagnosis.diagnosis = response.data.analysis;

            const savedAiDiagnosis = await aiDiagnosisRepo.save(aiDiagnosis);

            // 3. Tìm pet
            const petRepo = this.dataSource.getRepository(Pet);
            const pet = await petRepo.findOne({
              where: { id: appointment.petId },
              select: { name: true },
            });

            if (!pet) throw new NotFoundError('Không tìm thấy pet');

            // 4. Lưu thông báo
            const notificationRepo = manager.getRepository(Notification);
            const notification = notificationRepo.create();
            notification.recipientId = appointment.userId;
            notification.type = NotificationEnum.AI_DIAGNOSIS;
            notification.target = {
              appointmentId: appointment.id,
              aiDiagnosisId: savedAiDiagnosis.id,
              petName: pet.name,
            };

            const savedNotification = await notificationRepo.save(notification);

            // 5. Gửi thông báo về client
            this.notificationGateway.sendNotification(
              savedNotification.recipientId,
              savedNotification,
            );

            console.log('Hoàn thành job AI phân tích bệnh');
          } catch (error) {
            console.log(error.message);
            throw error;
          }
        });
        break;
      }
    }
  }
}
