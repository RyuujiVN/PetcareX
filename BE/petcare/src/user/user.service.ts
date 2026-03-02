import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { AdminClinic } from './entities/admin-clinic.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminClinic)
    private readonly adminClinicRepository: Repository<AdminClinic>,
    private readonly dataSource: DataSource,
  ) {}

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email: email } });
  }

  // Lấy admin clinic
  async findOneAdminClinicById(id: string) {
    return await this.adminClinicRepository.findOne({ where: { userId: id } });
  }

  // Tạo user
  async createUser(
    userDTO: CreateUserDTO,
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
    Object.assign(newUser, userDTO);

    return await repo.save(newUser);
  }
}
