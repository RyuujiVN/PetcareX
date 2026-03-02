import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateClinicDTO } from './dtos/create-clinic.dto';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  async createClinic(
    clinicDTO: CreateClinicDTO,
    userDTO: CreateUserDTO,
  ): Promise<Clinic> {
    return await this.dataSource.transaction(async (manager) => {
      const clinicRepo = manager.getRepository(Clinic);
      const adminClinicRepo = manager.getRepository(AdminClinic);

      // 1. Tạo Clinic
      const clinic = clinicRepo.create(clinicDTO);
      const savedClinic = await clinicRepo.save(clinic);

      // 2. Tạo admin cho clinic
      const user = await this.userService.createUser(userDTO, manager);
      const adminClinic = adminClinicRepo.create({
        userId: user.id,
        clinicId: savedClinic.id,
      });

      await adminClinicRepo.save(adminClinic);

      return savedClinic;
    });
  }
}
