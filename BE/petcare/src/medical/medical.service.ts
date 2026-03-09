import { CreateMedicalRecordDTO } from './dtos/create-medical-record.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecord: Repository<MedicalRecord>,
  ) {}

  async createMedicalRecord(
    createDTO: CreateMedicalRecordDTO,
    clinicId: string,
  ) {
    console.log(clinicId);
    const medicalRecord = this.medicalRecord.create(createDTO);
    medicalRecord.clinicId = clinicId;
    return await this.medicalRecord.save(medicalRecord);
  }
}
