import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClinicReview } from './entities/clinic-review.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateClinicReviewDTO } from './dtos/create-clinic-review.dto';
import { Clinic } from 'src/clinic/entities/clinic.entity';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';

@Injectable()
export class ClinicReviewService {
  constructor(
    @InjectRepository(ClinicReview)
    private readonly reviewRepository: Repository<ClinicReview>,
    private readonly dataSource: DataSource,
  ) {}

  async createClinicReview(createDTO: CreateClinicReviewDTO, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const reviewRepo = manager.getRepository(ClinicReview);
      const clinicRepo = manager.getRepository(Clinic);
      const medicalRecordRepo = manager.getRepository(MedicalRecord);

      // 1. Tạo mới bài review
      const review = reviewRepo.create(createDTO);
      review.userId = userId;

      const savedReview = await reviewRepo.save(review);

      // 2. Cập nhật lại rating và số lượt review cho Clinic
      const clinic = await clinicRepo.findOne({
        where: { id: savedReview.clinicId },
      });

      if (!clinic) throw new NotFoundException('Không tìm thấy clinic');

      const newTotalReviews = clinic.totalReviews + 1;
      const newAvgRating =
        (Number(clinic.avgRating) * clinic.totalReviews + savedReview.rating) /
        newTotalReviews;

      clinic.totalReviews = newTotalReviews;
      clinic.avgRating = newAvgRating;

      // 3. Cập nhật lại cả clinic và đồng thời đánh dấu medicalRecord đã được đánh giá
      await Promise.all([
        clinicRepo.save(clinic),
        medicalRecordRepo.update(
          { id: savedReview.medicalRecordId },
          { isReview: true },
        ),
      ]);
    });
  }
}
