import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { ClinicController } from './clinic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { AdminClinic } from 'src/user/entities/admin-clinic.entity';
import { UserModule } from 'src/user/user.module';
import { ElasticSearchModule } from 'src/elastic-search/elastic-search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clinic, AdminClinic]),
    ElasticSearchModule,
    UserModule,
  ],
  providers: [ClinicService],
  controllers: [ClinicController],
})
export class ClinicModule {}
