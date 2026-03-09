import { CreateMedicalRecordDTO } from './dtos/create-medical-record.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Repository } from 'typeorm';
import { UpdateMedicalRecordDTO } from './dtos/update-medical-record.dto';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecord: Repository<MedicalRecord>,
  ) {}

  // Tạo phiếu khám
  async createMedicalRecord(
    createDTO: CreateMedicalRecordDTO,
    clinicId: string,
  ) {
    const medicalRecord = this.medicalRecord.create(createDTO);
    medicalRecord.clinicId = clinicId;
    return await this.medicalRecord.save(medicalRecord);
  }

  // Chỉnh sửa phiếu khám
  async updateMedicalRecord(updateDTO: UpdateMedicalRecordDTO, id: string) {
    const medicalRecord = await this.medicalRecord.findOne({
      where: { id: id },
    });

    if (!medicalRecord)
      throw new NotFoundException('Không tìm thấy phiếu khám');

    Object.assign(medicalRecord, updateDTO);

    await this.medicalRecord.save(medicalRecord);
  }
}
