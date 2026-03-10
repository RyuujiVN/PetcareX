import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Medicine } from './entities/medicine.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MedicineService {
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
  ) {}

  async findAllMedicine(): Promise<Medicine[]> {
    return await this.medicineRepository.find({});
  }
}
