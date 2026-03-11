import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'db/data-source';
import { ConfigModule } from '@nestjs/config';
import { CatchEverythingFilter } from './common/filters/global-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { ClinicModule } from './clinic/clinic.module';
import { MailModule } from './mail/mail.module';
import { OtpModule } from './otp/otp.module';
import { VeterinarianModule } from './veterinarian/veterinarian.module';
import { PetModule } from './pet/pet.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AppointmentModule } from './appointment/appointment.module';
import { MedicalModule } from './medical/medical.module';
import { MedicalOrderModule } from './medical-order/medical-order.module';
import { MedicineModule } from './medicine/medicine.module';
import { ForumModule } from './forum/forum.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClinicModule,
    MailModule,
    OtpModule,
    VeterinarianModule,
    PetModule,
    CloudinaryModule,
    AppointmentModule,
    MedicalModule,
    MedicalOrderModule,
    MedicineModule,
    ForumModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
