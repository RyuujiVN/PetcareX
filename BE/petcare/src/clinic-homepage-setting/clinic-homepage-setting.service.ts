import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClinicHomepageSetting } from './entities/clinic-homepage-setting.entity';
import { Repository } from 'typeorm';
import { CreateClinicHomepageSettingDTO } from './dtos/clinic-homepage-setting.dto';

@Injectable()
export class ClinicHomepageSettingService {
  constructor(
    @InjectRepository(ClinicHomepageSetting)
    private readonly clinicHomepageSettingRepo: Repository<ClinicHomepageSetting>,
  ) {}

  async getClinicHomepageSetting(clinicId: string) {
    const setting = await this.clinicHomepageSettingRepo.findOne({
      where: { clinicId: clinicId },
    });

    if (!setting) throw new NotFoundException('Không tìm thấy setting');

    return setting.settings;
  }

  async createClinicHomepageSetting(
    createDTO: CreateClinicHomepageSettingDTO,
    clinicId: string,
  ) {
    const payload = new ClinicHomepageSetting();
    payload.clinicId = clinicId;
    payload.settings = createDTO.settings;

    await this.clinicHomepageSettingRepo.save(payload);
  }

  async updateClinicHomepageSetting(
    createDTO: CreateClinicHomepageSettingDTO,
    clinicId: string,
  ) {
    const setting = await this.clinicHomepageSettingRepo.findOne({
      where: { clinicId: clinicId },
    });

    if (!setting) await this.createClinicHomepageSetting(createDTO, clinicId);
    else
      await this.clinicHomepageSettingRepo.update(
        { clinicId: clinicId },
        createDTO,
      );
  }
}
