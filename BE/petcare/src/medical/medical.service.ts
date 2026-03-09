import { CreateMedicalRecordDTO } from './dtos/create-medical-record.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { UpdateMedicalRecordDTO } from './dtos/update-medical-record.dto';
import { MedicalRecordPagination } from './types/medial.type';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { RoleEnum } from 'src/common/enums/role.enum';
import { Pet } from 'src/pet/entities/pet.entity';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecord: Repository<MedicalRecord>,
    private readonly dataSource: DataSource,
  ) {}

  // Danh sách phiếu khám theo bệnh viện
  async findAllPaginationByClinic(
    options: MedicalRecordPagination,
  ): Promise<Pagination<MedicalRecord>> {
    const queryBuilder = this.medicalRecord
      .createQueryBuilder('medical_record')
      .leftJoinAndSelect('medical_record.pet', 'pet')
      .leftJoinAndSelect('pet.breed', 'breed')
      .leftJoinAndSelect('pet.owner', 'owner')
      .where('medical_record.clinicId = :clinicId', {
        clinicId: options.clinicId,
      })
      .select([
        'medical_record.id',
        'medical_record.name',
        'medical_record.createdAt',
        'medical_record.followUpDate',
        'pet.id',
        'pet.name',
        'pet.avatar',
        'breed.name',
        'owner.id',
        'owner.fullName',
      ])
      .orderBy('medical_record.createdAt', 'DESC');

    if (options.search)
      queryBuilder.andWhere('medical_record.name ILIKE :name', {
        name: `%${options.search}%`,
      });

    return paginate<MedicalRecord>(queryBuilder, options);
  }

  // Tạo phiếu khám
  async createMedicalRecord(
    createDTO: CreateMedicalRecordDTO,
    clinicId: string,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Kiểm tra xem user đã tồn tại chưa
      const userRepo = manager.getRepository(User);
      const petRepo = manager.getRepository(Pet);
      let savedPet;
      const user = await userRepo.findOne({
        where: { email: createDTO.email },
      });

      // 2. Nếu chưa có thì sẽ tạo user
      if (!user) {
        const userPayload = {
          fullName: createDTO.customerName,
          email: createDTO.email,
          role: RoleEnum.CUSTOMER,
          password: undefined,
        };

        const savedUser = await userRepo.save(userPayload);

        // 3. Tạo pet cho user
        const petPayload = {
          name: createDTO.petName,
          breedId: createDTO.breedId,
          weight: createDTO.weight,
          ownerId: savedUser.id,
        };

        savedPet = await petRepo.save(petPayload);
      } else {
        // 4. Nếu có rồi thì lấy pet
        savedPet = await petRepo.findOne({
          where: {
            id: createDTO.petId,
          },
        });

        if (!savedPet) throw new NotFoundException('Không tìm thấy pet');
      }

      // 5. Tạo mới phiếu khám
      const medicalRepo = manager.getRepository(MedicalRecord);

      const medicalRecord = medicalRepo.create(createDTO);
      medicalRecord.clinicId = clinicId;
      medicalRecord.petId = savedPet.id;

      return await medicalRepo.save(medicalRecord);
    });
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
