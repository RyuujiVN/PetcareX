import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationFilter } from './types/notification-pagination.type';

@Controller('notification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('')
  @ApiOperation({ summary: 'Lấy danh sách thông báo người dùng' })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 20 })
  @ApiQuery({ name: 'filter', required: true, type: String })
  @ApiQuery({ name: 'createdAt', required: false, type: Date })
  getAllNotification(
    @Req() req,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('filter') filter: NotificationFilter,
    @Query('createdAt') createdAt?: Date,
  ) {
    return this.notificationService.findAllNotification({
      recipientId: req?.user?.id,
      limit,
      filter,
      createdAt,
    });
  }
}
