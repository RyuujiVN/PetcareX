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
import { DoctorModule } from './doctor/doctor.module';
import { MailModule } from './mail/mail.module';
import { OtpModule } from './otp/otp.module';
import { VeterinarianModule } from './veterinarian/veterinarian.module';
import { PetModule } from './pet/pet.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClinicModule,
    DoctorModule,
    MailModule,
    OtpModule,
    VeterinarianModule,
    PetModule,
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
