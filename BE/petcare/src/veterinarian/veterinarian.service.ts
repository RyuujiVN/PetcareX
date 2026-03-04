import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateVeterinarianDTO } from './dtos/create-veterinarian.dto';
import { UserService } from 'src/user/user.service';
import { RoleEnum } from 'src/common/enums/role.enum';
import { UpdateVeterinarianDTO } from './dtos/update-veterinarian.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { VetFilterPagination } from './types/filter-veterinarian.type';

@Injectable()
export class VeterinarianService {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  async findOneByid(userId: string) {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: {
        userId: userId,
      },
      relations: ['user'],
    });

    if (!veterinarian) throw new NotFoundException('Không tìm thấy user');

    return veterinarian;
  }

  async findAllPagination(
    options: VetFilterPagination,
  ): Promise<Pagination<Veterinarian>> {
    const queryBuilder = this.veterinarianRepository
      .createQueryBuilder('veterinarian')
      .leftJoinAndSelect('veterinarian.user', 'user')
      .where('veterinarian.clinicId = :clinicId', {
        clinicId: options.clinicId,
      });

    if (options.search)
      queryBuilder
        .andWhere('user.fullName ILIKE :name', {
          name: `%${options.search}`,
        })
        .orWhere('user.email ILIKE :email', {
          email: `%${options.search}%`,
        });

    if (options.specialty)
      queryBuilder.andWhere('veterinarian.specialty = :specialty', {
        specialty: options.specialty,
      });

    return paginate<Veterinarian>(queryBuilder, options);
  }

  // Tạo mới bác sĩ
  async createVeterinarian(createDTO: CreateVeterinarianDTO) {
    const record = await this.dataSource.transaction(async (manager) => {
      // Tạo mới user
      const data = {
        email: createDTO.email,
        fullName: createDTO.fullName,
        password: createDTO.password,
      };

      const user = await this.userService.createUser(
        data,
        RoleEnum.VETERINARIAN,
        manager,
      );

      // Tạo mới veterinarian
      const vetRepo = manager.getRepository(Veterinarian);
      const veterinarian = new Veterinarian();
      veterinarian.clinicId = createDTO.clinicId;
      veterinarian.userId = user.id;
      veterinarian.specialty = createDTO.specialty;

      const newVeterinarian = await vetRepo.save(veterinarian);

      return newVeterinarian;
    });

    return await this.findOneByid(record.userId);
  }

  async updateVeterinarian(
    veterinarianId: string,
    updateDTO: UpdateVeterinarianDTO,
  ) {
    await this.dataSource.transaction(async (manager) => {
      // Cập nhật ở bảng user trước
      await this.userService.updateUser(
        veterinarianId,
        updateDTO,
        RoleEnum.VETERINARIAN,
        manager,
      );

      // Cập nhật bên bảng veterinarian
      const veterinarianRepo = manager.getRepository(Veterinarian);

      const veterinarian = await veterinarianRepo.findOne({
        where: { userId: veterinarianId },
      });

      if (!veterinarian)
        throw new NotFoundException('Không tìm thấy người dùng');

      veterinarian.specialty = updateDTO.specialty ?? veterinarian.specialty;
      await veterinarianRepo.save(veterinarian);
    });
  }

  async deleteVeterinarian(vetenarianId: string) {
    // Chạy transaction
    await this.dataSource.transaction(async (manager) => {
      // Xoá bảng bác sĩ trước
      const vetRepo = manager.getRepository(Veterinarian);
      const result = await vetRepo.delete({
        userId: vetenarianId,
      });

      if (result.affected === 0)
        throw new NotFoundException('Không tìm thấy bác sĩ');

      // Xoá ở bảng user
      await this.userService.deleteUser(vetenarianId, manager);
    });
  }
}
