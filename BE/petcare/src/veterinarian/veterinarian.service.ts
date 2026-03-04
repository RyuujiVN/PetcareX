import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateVeterinarianDTO } from './dtos/create-veterinarian.dto';
import { UserService } from 'src/user/user.service';
import { RoleEnum } from 'src/common/enums/role.enum';
import { UpdateVeterinarianDTO } from './dtos/update-veterinarian.dto';

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
      const vetRepo = manager.getRepository(Veterinarian);
      const result = await vetRepo.delete({
        userId: vetenarianId,
      });

      if (result.affected === 0)
        throw new NotFoundException('Không tìm thấy bác sĩ');

      await this.userService.deleteUser(vetenarianId, manager);
    });
  }
}
