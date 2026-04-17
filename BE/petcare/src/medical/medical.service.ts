import { CreateMedicalRecordDTO } from './dtos/create-medical-record.dto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { DataSource, Repository } from 'typeorm';
import { UpdateMedicalRecordDTO } from './dtos/update-medical-record.dto';
import { MedicalRecordPagination } from './types/medial.type';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { User } from 'src/user/entities/user.entity';
import { RoleEnum } from 'src/common/enums/role.enum';
import { Pet } from 'src/pet/entities/pet.entity';
import { MedicalRecordOrder } from './entities/medical-record-order.entity';
import { CreateMedicalRecordOrderDTO } from './dtos/create-medical-record-order';
import { UpdateMedicalRecordOrderDTO } from './dtos/update-medical-record-order';
import { MedicalRecordMedicine } from './entities/medical-record-medicine.entity';
import { CreateMedicalRecordMedicineDTO } from './dtos/create-medical-record-medicine';
import { UpdateMedicalRecordMedicineDTO } from './dtos/update-medical-record-medicine';
import { UserService } from 'src/user/user.service';
import bcrypt from 'bcryptjs';
import { MailService } from 'src/mail/mail.service';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { JobNameEnum, QueueNameEnum } from 'src/common/enums/queue.enum';
import { Queue } from 'bullmq';

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    @InjectRepository(MedicalRecordOrder)
    private readonly medicalRecordOrderRepo: Repository<MedicalRecordOrder>,
    @InjectRepository(MedicalRecordMedicine)
    private readonly medicalRecordMedicineRepo: Repository<MedicalRecordMedicine>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectQueue(QueueNameEnum.EMAIL)
    private readonly emailQueue: Queue,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  // Kiếm tra xem phiếu thuốc đã có hoá đơn thanh toán chưa
  private async checkMedicalRecordInvoice(medicalRecordId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { medicalRecordId },
      select: ['status'],
    });

    if (invoice?.status === InvoiceStatusEnum.PAID) {
      throw new ForbiddenException(
        'Không thể thao tác trên phiếu khám đã có hoá đơn thanh toán',
      );
    }
  }

  // ------------------------ Phiếu chỉ định ---------------------------
  // Lấy tất cả phiếu chỉ định của phiếu khám
  async findAllMedicalOrder(id: string) {
    return await this.medicalRecordOrderRepo
      .createQueryBuilder('medical_record_order')
      .leftJoin('medical_record_order.medicalOrder', 'medical_order')
      .addSelect([
        'medical_order.nameVn',
        'medical_order.nameEng',
        'medical_order.price',
      ])
      .where('medical_record_order.medicalRecordId = :id', {
        id: id,
      })
      .getMany();
  }

  // Thêm mới phiếu chỉ định vào phiếu khám
  async createMedicalRecordOrder(createDTO: CreateMedicalRecordOrderDTO) {
    await this.checkMedicalRecordInvoice(createDTO.medicalRecordId);

    const saved = await this.medicalRecordOrderRepo.save(createDTO);

    return this.medicalRecordOrderRepo.findOne({
      where: {
        id: saved.id,
      },
      relations: {
        medicalOrder: true,
      },
    });
  }

  // Cập nhật phiếu chỉ định của phòng khám
  async updateMedicalRecordOrder(
    updateDTO: UpdateMedicalRecordOrderDTO,
    id: string,
  ) {
    const record = await this.medicalRecordOrderRepo.findOne({
      where: {
        id: id,
      },
    });

    if (!record) throw new NotFoundException('Không tìm thấy phiếu chỉ định');

    await this.checkMedicalRecordInvoice(record.medicalRecordId);

    Object.assign(record, updateDTO);

    await this.medicalRecordOrderRepo.save(record);
  }

  // Xoá phiếu chỉ định của phòng khám
  async deleteMedicalRecordOrder(id: string) {
    const record = await this.medicalRecordOrderRepo.findOne({
      where: { id },
      select: ['id', 'medicalRecordId'],
    });

    if (!record) throw new NotFoundException('Không tìm thấy phiếu chỉ định');

    await this.checkMedicalRecordInvoice(record.medicalRecordId);

    await this.medicalRecordOrderRepo.delete({ id: id });
  }

  // ------------------------ Thuốc ---------------------------
  // Lấy danh sách thuốc của phiếu khám
  async findAllMedicine(id: string) {
    return await this.medicalRecordMedicineRepo
      .createQueryBuilder('medical_record_medicine')
      .leftJoin('medical_record_medicine.medicine', 'medicine')
      .addSelect(['medicine.name', 'medicine.unit', 'medicine.note'])
      .where('medical_record_medicine.medicalRecordId = :id', {
        id: id,
      })
      .getMany();
  }

  // Thêm thuốc vào phiếu khám
  async createMedicalRecordMedicine(createDTO: CreateMedicalRecordMedicineDTO) {
    await this.checkMedicalRecordInvoice(createDTO.medicalRecordId);

    const saved = await this.medicalRecordMedicineRepo.save(createDTO);

    return await this.medicalRecordMedicineRepo.findOne({
      where: { id: saved.id },
      relations: {
        medicine: true,
      },
    });
  }

  // Chỉnh sửa thuốc của phiếu khám
  async updateMedicalRecordMedicine(
    updateDTO: UpdateMedicalRecordMedicineDTO,
    id: string,
  ) {
    const record = await this.medicalRecordMedicineRepo.findOne({
      where: {
        id: id,
      },
    });

    if (!record)
      throw new NotFoundException('Không tìm thấy thuốc trong phiếu khám này');

    await this.checkMedicalRecordInvoice(record.medicalRecordId);

    Object.assign(record, updateDTO);
    await this.medicalRecordMedicineRepo.save(record);
  }

  // Xoá thuốc của phiếu khám
  async deleteMedicalRecordMedicine(id: string) {
    const medicine = await this.medicalRecordMedicineRepo.findOne({
      where: { id: id },
      select: ['id', 'medicalRecordId'],
    });

    if (!medicine)
      throw new NotFoundException('Không tìm thấy thuốc trong phiếu khám này');

    await this.checkMedicalRecordInvoice(medicine.medicalRecordId);

    await this.medicalRecordMedicineRepo.delete({ id: id });
  }

  // ------------------------ Phiếu khám -----------------------------
  // Lấy thông tin chi tiết phiếu khám
  async findOneById(id: string) {
    const record = await this.medicalRecordRepository.findOne({
      where: { id },
      relations: [
        'pet',
        'pet.owner',
        'clinic',
        'veterinarian',
        'veterinarian.user',
      ],
    });

    if (!record) {
      throw new NotFoundException('Không tìm thấy phiếu khám');
    }

    return {
      id: record.id,
      name: record.name,
      temperature: record.temperature,
      heartRate: record.heartRate,
      systolic: record.systolic,
      diastolic: record.diastolic,
      weight: record.weight,
      diagnosis: record.diagnosis,
      symptoms: record.symptoms,
      conclusion: record.conclusion,
      note: record.note,
      createdAt: record.createdAt,
      followUpDate: record.followUpDate,

      clinic: record.clinic && {
        id: record.clinic.id,
        name: record.clinic.name,
      },

      pet: record.pet && {
        id: record.pet.id,
        name: record.pet.name,
        avatar: record.pet.avatar,
        species: record.pet.species,
        breed: record.pet.breed,
        owner: record.pet.owner && {
          id: record.pet.owner.id,
          fullName: record.pet.owner.fullName,
        },
      },

      veterinarian: record.veterinarian && {
        id: record.veterinarian.user?.id,
        fullName: record.veterinarian.user?.fullName,
        specialty: record.veterinarian.specialty,
      },
    };
  }

  // Danh sách phiếu khám theo bệnh viện
  async findAllPaginationByClinic(
    options: MedicalRecordPagination,
  ): Promise<Pagination<MedicalRecord>> {
    const queryBuilder = this.medicalRecordRepository
      .createQueryBuilder('medical_record')
      .leftJoin('medical_record.pet', 'pet')
      .leftJoin('pet.owner', 'owner')
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
        'pet.species',
        'pet.breed',

        'owner.id',
        'owner.fullName',
      ])
      .orderBy('medical_record.createdAt', 'DESC');

    return paginate<MedicalRecord>(queryBuilder, options);
  }

  // Danh sách phiếu khám theo pet của user
  async findAllPaginationByPet(options: MedicalRecordPagination) {
    const queryBuilder = this.medicalRecordRepository
      .createQueryBuilder('medical_record')
      .leftJoin('medical_record.pet', 'pet')
      .leftJoin('medical_record.clinic', 'clinic')
      .leftJoin('medical_record.veterinarian', 'veterinarian')
      .leftJoin('veterinarian.user', 'user')
      .where('pet.id = :petId', {
        petId: options.petId,
      })
      .select([
        'medical_record.id',
        'medical_record.name',
        'medical_record.diagnosis',
        'medical_record.symptoms',
        'medical_record.conclusion',
        'medical_record.note',
        'medical_record.createdAt',
        'medical_record.followUpDate',
        'medical_record.isReview',

        'clinic.id',
        'clinic.name',

        'pet.id',
        'pet.name',
        'pet.avatar',
        'pet.species',
        'pet.breed',

        'veterinarian.specialty',

        'user.id',
        'user.fullName',
      ])
      .orderBy('medical_record.createdAt', 'DESC');

    const pagination = await paginate<MedicalRecord>(queryBuilder, options);

    const items = pagination.items.map((record) => ({
      ...record,
      pet: {
        id: record.pet?.id,
        name: record.pet?.name,
        avatar: record.pet?.avatar,
        species: record.pet?.species,
        breed: record.pet?.breed,
      },
      veterinarian: {
        id: record.veterinarian?.user?.id,
        specialty: record.veterinarian?.specialty,
        fullName: record.veterinarian?.user?.fullName,
      },
    }));

    return {
      items: items,
      meta: pagination.meta,
    };
  }

  // Danh sách phiếu khám theo pet của phòng khám
  async findAllPaginationByPetOfClinic(
    options: MedicalRecordPagination,
    clinicId: string,
  ) {
    const queryBuilder = this.medicalRecordRepository
      .createQueryBuilder('medical_record')
      .leftJoin('medical_record.pet', 'pet')
      .leftJoin('medical_record.clinic', 'clinic')
      .leftJoin('medical_record.veterinarian', 'veterinarian')
      .leftJoin('veterinarian.user', 'user')
      .where('pet.id = :petId', {
        petId: options.petId,
      })
      .andWhere('medical_record.clinicId = :clinicId', {
        clinicId: clinicId,
      })
      .select([
        'medical_record.id',
        'medical_record.name',
        'medical_record.diagnosis',
        'medical_record.symptoms',
        'medical_record.conclusion',
        'medical_record.note',
        'medical_record.createdAt',
        'medical_record.followUpDate',

        'clinic.id',
        'clinic.name',

        'pet.id',
        'pet.name',
        'pet.avatar',
        'pet.species',
        'pet.breed',

        'veterinarian.specialty',

        'user.id',
        'user.fullName',
      ])
      .orderBy('medical_record.createdAt', 'DESC');

    const pagination = await paginate<MedicalRecord>(queryBuilder, options);

    const items = pagination.items.map((record) => ({
      ...record,
      pet: {
        id: record.pet?.id,
        name: record.pet?.name,
        avatar: record.pet?.avatar,
        species: record.pet?.species,
        breed: record.pet?.breed,
      },
      veterinarian: {
        id: record.veterinarian?.user?.id,
        specialty: record.veterinarian?.specialty,
        fullName: record.veterinarian?.user?.fullName,
      },
    }));

    return {
      items: items,
      meta: pagination.meta,
    };
  }

  // Tạo phiếu khám
  async createMedicalRecord(
    createDTO: CreateMedicalRecordDTO,
    clinicId: string,
    veterinarianId: string,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const petRepo = manager.getRepository(Pet);
      let savedPet;
      let password;

      // 1. Kiểm tra tồn tại sđt
      const existedPhone = await userRepo.findOne({
        where: { phone: createDTO.phone },
      });

      if (existedPhone)
        throw new ConflictException(
          'Số điện thoại đã được sử dụng bởi người khác',
        );

      // 2. Kiểm tra xem user đã tồn tại chưa
      const existedEmail = await userRepo.findOne({
        where: { email: createDTO.email },
      });

      // 3. Nếu chưa có thì sẽ tạo user
      if (!existedEmail) {
        const userPayload = {
          fullName: createDTO.customerName,
          email: createDTO.email,
          role: RoleEnum.CUSTOMER,
          phone: createDTO.phone,
        };

        password = this.userService.generatePassword();

        const savedUser = await userRepo.save({
          ...userPayload,
          password: await bcrypt.hash(password, 10),
        });

        // 4. Tạo pet cho user
        const petPayload = {
          name: createDTO.petName,
          species: createDTO.species,
          breed: createDTO.breed,
          weight: createDTO.weight,
          ownerId: savedUser.id,
        };

        savedPet = await petRepo.save(petPayload);
      } else {
        // 5. Nếu có rồi thì lấy pet
        savedPet = await petRepo.findOne({
          where: {
            id: createDTO.petId,
          },
        });

        if (!savedPet) throw new NotFoundException('Không tìm thấy pet');
      }

      // 6. Tạo mới phiếu khám
      const medicalRepo = manager.getRepository(MedicalRecord);

      const medicalRecord = medicalRepo.create(createDTO);
      medicalRecord.clinicId = clinicId;
      medicalRecord.petId = savedPet.id;
      medicalRecord.veterinarianId = veterinarianId;

      const savedMedicalRecord = await medicalRepo.save(medicalRecord);

      // 6=7. Gửi mail thông tin đăng nhập
      if (password) {
        const subject = 'Thông tin tài khoản đăng nhập của bạn';
        const html = `
          <div style="font-family: Arial, sans-serif; line-height:1.6">
            <h2>PetcareX xin chào,</h2>

            <p>Tài khoản của bạn đã được tạo thành công.</p>

            <p><strong>Thông tin đăng nhập:</strong></p>

            <div style="background:#f5f5f5; padding:16px; border-radius:6px; max-width:400px">
                
                <div style="margin-bottom:12px">
                  <div style="font-weight:bold; color:#555">Tên tài khoản</div>
                  <div>${createDTO.email}</div>
                </div>

                <div>
                  <div style="font-weight:bold; color:#555">Mật khẩu tạm thời</div>
                  <div>${password}</div>
                </div>

              </div>

            <p style="margin-top:16px">
              Vì lý do bảo mật, vui lòng đăng nhập và thay đổi mật khẩu ngay sau khi sử dụng lần đầu.
            </p>

            <p>Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này.</p>

            <br/>

            <p>Trân trọng,<br/>PetcareX</p>
          </div>`;

        const payload = {
          email: createDTO.email,
          subject: subject,
          html: html,
        };

        // 8. Thêm job vào emailQueue
        await this.emailQueue.add(JobNameEnum.SEND_MAIL, payload, {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: true,
          backoff: {
            type: 'exponential',
            delay: 4000,
          },
        });
      }

      return savedMedicalRecord;
    });
  }

  // Chỉnh sửa phiếu khám
  async updateMedicalRecord(updateDTO: UpdateMedicalRecordDTO, id: string) {
    const medicalRecord = await this.medicalRecordRepository.findOne({
      where: { id: id },
    });

    if (!medicalRecord)
      throw new NotFoundException('Không tìm thấy phiếu khám');

    Object.assign(medicalRecord, updateDTO);

    await this.medicalRecordRepository.save(medicalRecord);
  }
}
