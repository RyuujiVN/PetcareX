/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { RoleEnum } from 'src/common/enums/role.enum';
import { MailService } from 'src/mail/mail.service';
import { OtpService } from 'src/otp/otp.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { ChangePasswordDTO } from './dtos/change-password.dto';
import { ForgotPasswordDTO } from './dtos/forgot-password.dto';
import { LoginDTO } from './dtos/login.dto';
import { ResetPasswordDTO } from './dtos/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
  ) {}

  async login(loginDTO: LoginDTO) {
    const user = await this.userService.findOneByEmail(loginDTO.email);

    if (!user) throw new UnauthorizedException('Tài khoản hoặc mật khẩu sai');

    const passwordChecked = await bcrypt.compare(
      loginDTO.password,
      user.password,
    );

    if (!passwordChecked)
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu sai');

    // Tạo accessToken
    const payload: any = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar_url: user.avatarUrl,
    };

    if (user.role === RoleEnum.ADMIN_CLINIC) {
      const adminClinic = await this.userService.findOneAdminClinicById(
        user.id,
      );
      payload.clinicId = adminClinic?.clinicId;
    }

    if (user.role === RoleEnum.VETERINARIAN) {
      const veterinarian = await this.userService.findOneVeterinarianById(
        user.id,
      );
      payload.clinicId = veterinarian?.clinicId;
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN'),
      expiresIn: '7d',
    });

    return {
      userInfo: payload,
      accessToken: accessToken,
    };
  }

  async forgotPassword(forgot: ForgotPasswordDTO) {
    // Kiểm tra email có tồn tại hay không
    const user = await this.userService.findOneByEmail(forgot.email);
    if (!user) throw new NotFoundException('Không tồn tại tài khoản');

    // Gửi mail
    const code = await this.otpService.createOtp(forgot.email);
    const subject = 'Mã OTP xác thực đăng nhập';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Mã OTP của bạn</h2>
          <p>Đây là mã OTP để xác thực tài khoản của bạn:</p>

          <div style="
            display: inline-block;
            padding: 12px 20px;
            font-size: 24px;
            font-weight: bold;
            background-color: #4f46e5;
            color: #fff;
            border-radius: 8px;
            margin: 10px 0;
          ">
            ${code}
          </div>

          <p>Mã OTP có hiệu lực trong <b>5 phút</b>. Tuyệt đối không chia sẻ cho người khác.</p>
          <hr/>
          <p style="font-size:12px; color:#888;">© 2025 TasteBite. All rights reserved.</p>
        </div>
      `;

    await this.mailService.sendMail(forgot.email, subject, html);
  }

  async resetPassword(resetDTO: ResetPasswordDTO) {
    if (resetDTO.newPassword !== resetDTO.confirmPassword)
      throw new BadRequestException('Xác nhận mật khẩu không chính xác');

    const otp = await this.otpService.findOneByEmailOtp(
      resetDTO.email,
      resetDTO.otp,
    );

    if (otp.expiredAt < new Date())
      throw new BadRequestException('Otp đã hết hạn');

    const user = await this.userService.findOneByEmail(resetDTO.email);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    user.password = await bcrypt.hash(resetDTO.newPassword, 10);
    await this.userRepository.save(user);
  }

  async changePassword(id: string, changePassDTO: ChangePasswordDTO) {
    if (changePassDTO.newPassword !== changePassDTO.confirmPassword)
      throw new BadRequestException('Xác nhận mật khẩu không chính xác');

    const user = await this.userRepository.findOne({ where: { id: id } });

    if (!user) throw new BadRequestException('Không tìm thấy user');

    const passwordChecked = await bcrypt.compare(
      changePassDTO.oldPassword,
      user?.password,
    );
    if (!passwordChecked)
      throw new BadRequestException('Mật khẩu cũ không chính xác');

    const hashPassword = await bcrypt.hash(changePassDTO.newPassword, 10);
    user.password = hashPassword;

    await this.userRepository.save(user);

    // Trả về token mới sau khi đổi mật khẩu để update lại session
    const payload: any = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar_url: user.avatarUrl,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN'),
      expiresIn: '7d',
    });
  }
}
