import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateClinicDTO } from './dtos/create-clinic.dto';
import { CreateUserDTO } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { UpdateClinicDTO } from './dtos/update-clinic.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { RoleEnum } from 'src/common/enums/role.enum';
import { FilterPagintion } from 'src/common/types/pagination.type';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  // Phân trang phòng khám
  async findAllPagination(
    options: FilterPagintion,
  ): Promise<Pagination<Clinic>> {
    const queryBuilder = this.clinicRepository
      .createQueryBuilder('clinic')
      .where('clinic.deleted = :deleted', {
        deleted: false,
      });

    if (options?.search)
      queryBuilder.andWhere('clinic.name ILIKE :name', {
        name: options?.search,
      });

    return paginate<Clinic>(queryBuilder, options);
  }

  // Chi tiết phòng khám
  async findOneById(id: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({ where: { id: id } });

    if (!clinic) throw new NotFoundException();

    return clinic;
  }

  // Tạo mới phòng khám
  async createClinic(
    clinicDTO: CreateClinicDTO,
    userDTO: CreateUserDTO,
  ): Promise<Clinic> {
    // Bắt đầu transaction
    return await this.dataSource.transaction(async (manager) => {
      const clinicRepo = manager.getRepository(Clinic);
      const adminClinicRepo = manager.getRepository(AdminClinic);

      // 1. Tạo Clinic
      const clinic = clinicRepo.create(clinicDTO);
      const savedClinic = await clinicRepo.save(clinic);

      // 2. Tạo admin cho clinic
      const user = await this.userService.createUser(
        userDTO,
        RoleEnum.ADMIN_CLINIC,
        manager,
      );
      const adminClinic = adminClinicRepo.create({
        userId: user.id,
        clinicId: savedClinic.id,
      });

      await adminClinicRepo.save(adminClinic);

      return savedClinic;
    });
  }

  // Chỉnh sửa thông tin phòng khám
  async updateClinic(id: string, clinicDTO: UpdateClinicDTO) {
    const clinic = await this.findOneById(id);

    Object.assign(clinic, clinicDTO);
    await this.clinicRepository.save(clinic);
  }

  // Xoá phòng khám
  async deleteClinic(id: string) {
    const result = await this.clinicRepository.delete({
      id: id,
    });

    if (result.affected === 0) throw new NotFoundException();
  }
}
