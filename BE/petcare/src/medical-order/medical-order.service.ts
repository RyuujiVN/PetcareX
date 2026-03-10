import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalOrder } from './entities/medical-order.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MedicalOrderService {
  constructor(
    @InjectRepository(MedicalOrder)
    private readonly medicalOrderRepository: Repository<MedicalOrder>,
  ) {}

  async findAll(): Promise<MedicalOrder[]> {
    return await this.medicalOrderRepository.find({});
  }
}
