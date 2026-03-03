import { Test, TestingModule } from '@nestjs/testing';
import { VeterinarianService } from './veterinarian.service';

describe('VeterinarianService', () => {
  let service: VeterinarianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VeterinarianService],
    }).compile();

    service = module.get<VeterinarianService>(VeterinarianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
