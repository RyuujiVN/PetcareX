import { Test, TestingModule } from '@nestjs/testing';
import { ClinicReviewService } from './clinic-review.service';

describe('ClinicReviewService', () => {
  let service: ClinicReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicReviewService],
    }).compile();

    service = module.get<ClinicReviewService>(ClinicReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
