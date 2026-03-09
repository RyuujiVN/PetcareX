import { Test, TestingModule } from '@nestjs/testing';
import { MedicalOrderController } from './medical-order.controller';

describe('MedicalOrderController', () => {
  let controller: MedicalOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalOrderController],
    }).compile();

    controller = module.get<MedicalOrderController>(MedicalOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
