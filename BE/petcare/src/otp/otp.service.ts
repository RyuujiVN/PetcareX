import { Injectable, NotFoundException } from '@nestjs/common';
import { Otp } from './entities/otp.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}
  generateCode(length: number): string {
    let code = '';

    for (let i = 1; i <= length; i++) {
      const character = Math.floor(Math.random() * 10);
      code += character;
    }

    return code;
  }

  async findOneByEmailOtp(email: string, code: string): Promise<Otp> {
    const otpRecord = await this.otpRepository.findOne({
      where: {
        email: email,
        code: code,
      },
    });

    if (!otpRecord) throw new NotFoundException('Mã OTP không đúng');

    return otpRecord;
  }

  async createOtp(email: string) {
    const code = this.generateCode(6);
    const expired = new Date(Date.now() + 3 * 60 * 1000); // Hết hạn trong 3 phút
    const otp = new Otp();
    otp.email = email;
    otp.code = code;
    otp.expiredAt = expired;

    await this.otpRepository.save(otp);
    return otp.code;
  }
}
