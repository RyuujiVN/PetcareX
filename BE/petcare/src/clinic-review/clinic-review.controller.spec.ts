import { Test, TestingModule } from '@nestjs/testing';
import { ClinicReviewController } from './clinic-review.controller';

describe('ClinicReviewController', () => {
  let controller: ClinicReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicReviewController],
    }).compile();

    controller = module.get<ClinicReviewController>(ClinicReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
