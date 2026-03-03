import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(email: string, subject: string, html: string) {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: subject,
      html: html,
    };

    try {
      await this.mailerService.sendMail(mailOptions);
      console.log(`Đã gửi otp tới email: ${email}`);
    } catch (error) {
      console.log('Lỗi', error);
    }
  }
}
