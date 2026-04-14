import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClinicReview } from './entities/clinic-review.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateClinicReviewDTO } from './dtos/create-clinic-review.dto';
import { Clinic } from 'src/clinic/entities/clinic.entity';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { ClinicReviewPagination } from './types/clinic-review.type';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';

@Injectable()
export class ClinicReviewService {
  constructor(
    @InjectRepository(ClinicReview)
    private readonly reviewRepository: Repository<ClinicReview>,
    private readonly dataSource: DataSource,
  ) {}

  // Lấy danh sách review
  async findOneById(id: string) {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('clinicReview')
      .leftJoin('clinicReview.user', 'user')
      .addSelect(['user.id', 'user.fullName', 'user.avatarUrl'])
      .where('clinicReview.id = :id', { id: id })
      .orderBy('clinicReview.createdAt', 'DESC');

    return await queryBuilder.getOne();
  }

  // Lấy danh sách review
  async findAllReviewPagination(
    options: ClinicReviewPagination,
  ): Promise<Pagination<ClinicReview>> {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('clinicReview')
      .leftJoin('clinicReview.user', 'user')
      .addSelect(['user.id', 'user.fullName', 'user.avatarUrl'])
      .where('clinicReview.clinicId = :id', { id: options.clinicId })
      .orderBy('clinicReview.createdAt', 'DESC');

    return paginate<ClinicReview>(queryBuilder, options);
  }

  // Thêm mới review
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
