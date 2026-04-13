import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  @ApiQuery({
    name: 'filter',
    required: true,
    type: String,
    default: NotificationFilter.ALL,
  })
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

  @Patch('mark-one/:id')
  @ApiOperation({ summary: 'Cập nhật một thông báo đã đọc' })
  async updateOneNotification(@Param('id') id: string) {
    await this.notificationService.markOneAsRead(id);

    return {
      message: 'Cập nhật thành công',
    };
  }

  @Patch('mark-all')
  @ApiOperation({ summary: 'Cập nhật tất cả thông báo đã đọc' })
  async updateAllNotification(@Req() req) {
    await this.notificationService.markAllAsRead(req?.user?.id);

    return {
      message: 'Cập nhật thành công',
    };
  }
}
