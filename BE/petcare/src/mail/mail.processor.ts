/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { MailService } from './mail.service';
import { Logger } from '@nestjs/common';

@Processor(QueueNameEnum.EMAIL, { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger('QueueEmail');

  constructor(private readonly mailService: MailService) {
    super();
  }

  @OnWorkerEvent('active')
  onQueueActive(job: Job) {
    this.logger.log(`Job has been started: ${job.name} - ${job.id}`);
  }

  @OnWorkerEvent('completed')
  onQueueCompleted(job: Job) {
    this.logger.log(`Job has been finished: ${job.name} - ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onQueueFailed(job: Job, err: any) {
    this.logger.warn(`Job has been failed: ${job.name} - ${job.id}`);
    this.logger.error(`Job failed error: ${err.message}`, err.stack);
  }

  @OnWorkerEvent('error')
  onQueueError(err: any) {
    this.logger.log(`Job has got error: ${err.message}`, err.stack);
  }

  async process(job: Job, token?: string): Promise<any> {
    const payload = job.data;

    switch (job.name) {
      case JobNameEnum.SEND_MAIL:
        await this.mailService.sendMail(
          payload.email,
          payload.subject,
          payload.html,
        );
        break;
    }
  }
}
