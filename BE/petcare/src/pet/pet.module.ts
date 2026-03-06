import { Module } from '@nestjs/common';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { Species } from './entities/species.entity';
import { Breed } from './entities/breed.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, Species, Breed]), CloudinaryModule],
  providers: [PetService],
  controllers: [PetController],
})
export class PetModule {}
