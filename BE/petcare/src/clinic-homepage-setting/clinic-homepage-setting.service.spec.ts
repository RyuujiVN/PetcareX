import { Test, TestingModule } from '@nestjs/testing';
import { ClinicHomepageSettingService } from './clinic-homepage-setting.service';

describe('ClinicHomepageSettingService', () => {
  let service: ClinicHomepageSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicHomepageSettingService],
    }).compile();

    service = module.get<ClinicHomepageSettingService>(ClinicHomepageSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
