import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { MailService } from './mail.service';

@Processor(QueueNameEnum.EMAIL, { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    const payload = job.data;

    switch (job.name) {
      case JobNameEnum.SEND_MAIL:
        console.log('Đang chạy job gửi mail');
        try {
          await this.mailService.sendMail(
            payload.email,
            payload.subject,
            payload.html,
          );
        } catch (error) {
          console.log(error.message);
          throw error;
        }
        console.log('Hoàn thành job AI phân tích bệnh');
        break;
    }
  }
}
