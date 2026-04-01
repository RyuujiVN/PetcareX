import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryProvider } from './cloudinary.provider';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryController } from './cloudinary.controller';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService, CloudinaryProvider],
  controllers: [CloudinaryController],
})
export class CloudinaryModule {}
