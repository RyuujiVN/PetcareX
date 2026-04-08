import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import {
  NotificationFilter,
  NotificationPagination,
} from './types/notification-pagination.type';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async countUnread(userId: string) {
    return await this.notificationRepository.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

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

    if (options.filter === NotificationFilter.UNREAD)
      queryBuilder.andWhere('notify.isRead = :isRead', { isRead: false });

    const [data, totalUnread] = await Promise.all([
      queryBuilder.getMany(),
      this.countUnread(options.recipientId),
    ]);

    return {
      data,
      totalUnread,
    };
  }

  async markOneAsRead(id: string) {
    const result = await this.notificationRepository.update(
      { id: id },
      { isRead: true },
    );

    if (result.affected === 0)
      throw new NotFoundException('Không tìm thấy thông báo');
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );

    if (result.affected === 0)
      throw new NotFoundException('Không tìm thấy thông báo');
  }
}
