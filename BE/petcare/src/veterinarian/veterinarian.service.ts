import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateVeterinarianDTO } from './dtos/create-veterinarian.dto';
import { UserService } from 'src/user/user.service';
import { RoleEnum } from 'src/common/enums/role.enum';

@Injectable()
export class VeterinarianService {
  constructor(
    @InjectRepository(Veterinarian)
    private readonly veterinarian: Repository<Veterinarian>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  async findOneByid(userId: string) {
    const veterinarian = await this.veterinarian.findOne({
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
}
