import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email: email } });
  }

  // Tạo user
  async createUser(userDTO: CreateUserDTO) {
    // Kiểm tra email đã tồn tại hay chưa
    const existUser = await this.userRepository.findOne({
      where: { email: userDTO.email },
    });

    if (existUser) throw new ConflictException('Email đã tồn tại');

    // Hash lại password
    userDTO.password = await bcrypt.hash(userDTO.password, 10);

    const newUser = new User();
    Object.assign(newUser, userDTO);

    await this.userRepository.save(newUser);
  }
}
