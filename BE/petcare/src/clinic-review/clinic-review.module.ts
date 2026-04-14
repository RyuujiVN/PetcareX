import { Module } from '@nestjs/common';
import { ClinicReviewService } from './clinic-review.service';
import { ClinicReviewController } from './clinic-review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicReview } from './entities/clinic-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicReview])],
  providers: [ClinicReviewService],
  controllers: [ClinicReviewController],
})
export class ClinicReviewModule {}
