import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { FilterPagination } from 'src/common/types/pagination.type';
import { ClinicSearchService, FilterNearClinic } from './clinic-search.service';
import axios from 'axios';

@Injectable()
export class ClinicService {
  private logger = new Logger(ClinicService.name);

  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly clinicSearchService: ClinicSearchService,
  ) {}

  // Phân trang phòng khám
  async findAllPagination(
    options: FilterPagination,
  ): Promise<Pagination<Clinic>> {
    const queryBuilder = this.clinicRepository
      .createQueryBuilder('clinic')
      .where('clinic.deleted = :deleted', {
        deleted: false,
      });

    const normalizedSearch = String(options?.search || '').trim();
    if (normalizedSearch) {
      queryBuilder.andWhere(
        '(clinic.name ILIKE :keyword OR clinic.phone ILIKE :keyword)',
        {
          keyword: `%${normalizedSearch}%`,
        },
      );
    }

    return paginate<Clinic>(queryBuilder, options);
  }

  // Phân trang phòng khám cho user
  async findAllPaginationUser(options: FilterNearClinic) {
    const clinicNears = await this.clinicSearchService.searchClinics(options);

    const locations: string[] = clinicNears.map((clinic) => {
      const lat = clinic?.location?.lat;
      const lon = clinic?.location?.lon;

      return `${lon},${lat}`;
    });

    const coordinates = [`${options.lon},${options.lat}`, ...locations].join(
      ';',
    );

    try {
      const url = `http://router.project-osrm.org/table/v1/driving/${coordinates}?sources=0&annotations=distance`;

      const result = await axios.get(url);

      const distance: number[] = result.data.distances[0];

      distance.shift();

      return clinicNears.map((clinic, index) => ({
        ...clinic,
        distance: distance[index] / 1000,
      }));
    } catch (error) {
      this.logger.error(error.message, error.stack);
    }
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
    const saved = await this.dataSource.transaction(async (manager) => {
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

    await this.clinicSearchService.createClinic(saved);

    return saved;
  }

  // Chỉnh sửa thông tin phòng khám
  async updateClinic(id: string, clinicDTO: UpdateClinicDTO) {
    if (
      clinicDTO?.closingTime &&
      clinicDTO?.openingTime &&
      clinicDTO?.openingTime >= clinicDTO?.closingTime
    )
      throw new BadRequestException('Giờ đóng cửa phải lớn hơn giờ mở cửa');

    const clinic = await this.findOneById(id);

    Object.assign(clinic, clinicDTO);
    const updatedClinic = await this.clinicRepository.save(clinic);

    await this.clinicSearchService.updateClinic(updatedClinic);
  }

  // Xoá phòng khám
  async deleteClinic(id: string) {
    const result = await this.clinicRepository.delete({
      id: id,
    });

    if (result.affected === 0) throw new NotFoundException();

    await this.clinicSearchService.deleteClinic(id);
  }
}
