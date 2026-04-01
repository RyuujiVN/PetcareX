import { Test, TestingModule } from '@nestjs/testing';
import { AiDiagnosisService } from './ai-diagnosis.service';

describe('AiDiagnosisService', () => {
  let service: AiDiagnosisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiDiagnosisService],
    }).compile();

    service = module.get<AiDiagnosisService>(AiDiagnosisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
