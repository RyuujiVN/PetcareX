import { Module } from '@nestjs/common';
import { ClinicHomepageSettingService } from './clinic-homepage-setting.service';
import { ClinicHomepageSettingController } from './clinic-homepage-setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicHomepageSetting } from './entities/clinic-homepage-setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicHomepageSetting])],
  providers: [ClinicHomepageSettingService],
  controllers: [ClinicHomepageSettingController],
})
export class ClinicHomepageSettingModule {}
