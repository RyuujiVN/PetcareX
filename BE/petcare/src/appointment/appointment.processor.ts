import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import axios from 'axios';
import { Job } from 'bullmq';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { AiDiagnosis } from 'src/ai-diagnosis/entities/ai-diagnosis.entity';
import { Repository } from 'typeorm';

@Processor(QueueNameEnum.APPOINTMENT, { concurrency: 5 })
export class AnalyzeSymptomsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(AiDiagnosis)
    private readonly aiDiagnosisRepo: Repository<AiDiagnosis>,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    const appointment = job.data;

    const linkConnectAI = this.configService.get<string>('LINK_CONNECT_AI');

    switch (job.name) {
      case JobNameEnum.ANALYZE_SYMPTOMS: {
        console.log('Đang chạy job AI phân tích bệnh');
        // Gửi triệu chứng tới AI để phân tích
        const response = await axios.post(`${linkConnectAI}/api/triage`, {
          symptoms: appointment.note,
        });

        const aiDiagnosis = new AiDiagnosis();
        aiDiagnosis.petId = appointment.petId;
        aiDiagnosis.userId = appointment.userId;
        aiDiagnosis.diagnosis = response.data.analysis;
        aiDiagnosis.appointmentDate = appointment.appointmentDate;
        aiDiagnosis.appointmentTime = appointment.appointmentTime;

        await this.aiDiagnosisRepo.save(aiDiagnosis);
        console.log('Hoàn thành job AI phân tích bệnh');
        break;
      }
    }
  }
}
