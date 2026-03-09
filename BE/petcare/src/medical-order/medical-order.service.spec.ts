import { Test, TestingModule } from '@nestjs/testing';
import { MedicalOrderService } from './medical-order.service';

describe('MedicalOrderService', () => {
  let service: MedicalOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalOrderService],
    }).compile();

    service = module.get<MedicalOrderService>(MedicalOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
