import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { AdminClinic } from './entities/admin-clinic.entity';
import { RoleEnum } from 'src/common/enums/role.enum';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { Veterinarian } from 'src/veterinarian/entities/veterinarian.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminClinic)
    private readonly adminClinicRepository: Repository<AdminClinic>,
    @InjectRepository(Veterinarian)
    private readonly veterinarianRepository: Repository<Veterinarian>,
  ) {}

  async findOneByid(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        veterinarian: true,
      },
    });

    if (user && user?.role !== RoleEnum.VETERINARIAN) delete user.veterinarian;

    return user;
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email: email, deleted: false },
    });
  }

  // Lấy admin clinic
  async findOneAdminClinicById(id: string) {
    return await this.adminClinicRepository.findOne({ where: { userId: id } });
  }

  // Lấy veterinarian
  async findOneVeterinarianById(id: string) {
    return await this.veterinarianRepository.findOne({ where: { userId: id } });
  }

  // Tạo user
  async createUser(
    userDTO: CreateUserDTO,
    role: RoleEnum,
    manager?: EntityManager,
  ): Promise<User> {
    // Kiểm tra xem thử có cần chạy transaction hay không
    const repo = manager ? manager.getRepository(User) : this.userRepository;

    // Kiểm tra email đã tồn tại hay chưa
    const existUser = await repo.findOne({
      where: { email: userDTO.email },
    });

    if (existUser) throw new ConflictException('Email đã tồn tại');

    // Hash lại password
    userDTO.password = await bcrypt.hash(userDTO.password, 10);

    const newUser = new User();
    newUser.role = role;
    Object.assign(newUser, userDTO);

    return await repo.save(newUser);
  }

  // Cập nhật user
  async updateUser(
    userId: string,
    updateDTO: UpdateUserDTO,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(User) : this.userRepository; // Kiểm tra xem thử có cần chạy transaction hay không

    // Kiểm tra email đã được sử dụng bởi người khác hay chưa
    const existedEmail = await repo.findOne({
      where: {
        id: Not(userId),
        email: updateDTO.email,
      },
    });

    if (existedEmail) throw new ConflictException('Email đã được sử dụng');

    const user = await repo.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    Object.assign(user, updateDTO);

    return await repo.save(user);
  }

  // Xoá User
  async deleteUser(userId: string, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(User) : this.userRepository; // Kiểm tra có chạy transaction hay không

    const result = await repo.delete({ id: userId });

    if (result.affected === 0)
      throw new NotFoundException('Không tìm thấy người dùng');
  }

  async softDeleteUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy user');

    await this.userRepository.update({ id: userId }, { deleted: true });
  }
}
