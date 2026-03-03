import { Module } from '@nestjs/common';
import { VeterinarianService } from './veterinarian.service';
import { VeterinarianController } from './veterinarian.controller';

@Module({
  providers: [VeterinarianService],
  controllers: [VeterinarianController]
})
export class VeterinarianModule {}
