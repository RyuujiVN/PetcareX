import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { ClinicController } from './clinic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { UserModule } from 'src/user/user.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clinic, AdminClinic]),
    UserModule,
    CloudinaryModule,
  ],
  providers: [ClinicService],
  controllers: [ClinicController],
})
export class ClinicModule {}
