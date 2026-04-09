import { Test, TestingModule } from '@nestjs/testing';
import { ClinicHomepageSettingController } from './clinic-homepage-setting.controller';

describe('ClinicHomepageSettingController', () => {
  let controller: ClinicHomepageSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicHomepageSettingController],
    }).compile();

    controller = module.get<ClinicHomepageSettingController>(ClinicHomepageSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
