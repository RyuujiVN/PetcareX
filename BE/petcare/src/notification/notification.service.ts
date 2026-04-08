import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { NotificationPagination } from './types/notification-pagination.type';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAllNotification(options: NotificationPagination) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notify')
      .where('notify.recipientId = :id', { id: options.recipientId })
      .limit(options.limit)
      .orderBy('notify.createdAt', 'DESC');

    if (options.createdAt)
      queryBuilder.andWhere('notify.createdAt < :time', {
        time: new Date(options.createdAt),
      });
  }
}
