import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportController } from './report.controller';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Notification, User]),
    NotificationModule,
  ],
  providers: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
