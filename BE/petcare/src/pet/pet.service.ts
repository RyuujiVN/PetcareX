import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Repository } from 'typeorm';
import { CreatePetDTO } from './dtos/create-pet.dto';
import { UpdatePetDTO } from './dtos/update-pet.dto.';
import { PetSpeciesEnum } from 'src/common/enums/pet-species.enum';
import {
  PET_BREEDS_BY_SPECIES,
  PetBreedEnum,
} from 'src/common/enums/pet-breed.enum';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
  ) {}

  async findOneById(petId: string) {
    const pet = await this.petRepository.findOne({ where: { id: petId } });

    if (!pet) throw new NotFoundException('Không tìm thấy thú cưng');

    return pet;
  }

  // Danh sách thú cưng của riêng mình
  async findPetsByOwnerId(ownerId: string) {
    return await this.petRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  // Danh sách loài
  async findAllSpecies(): Promise<PetSpeciesEnum[]> {
    return Object.values(PetSpeciesEnum);
  }

  // Danh sách giống
  async findAllBreed(species: PetSpeciesEnum): Promise<PetBreedEnum[]> {
    const speciesEnum = Object.values(PetSpeciesEnum).includes(species)
      ? species
      : undefined;

    if (!speciesEnum) {
      throw new BadRequestException('Loài không hợp lệ');
    }

    return PET_BREEDS_BY_SPECIES[speciesEnum];
  }

  // Tạo mới thú cưng
  async createPet(createDTO: CreatePetDTO, ownerId: string) {
    const pet = this.petRepository.create(createDTO);
    pet.ownerId = ownerId;

    const savedPet = await this.petRepository.save(pet);

    return await this.findOneById(savedPet.id);
  }

  // Cập nhật thông tin thú cưng
  async updatePet(updateDTO: UpdatePetDTO, petId: string) {
    const pet = await this.petRepository.findOne({ where: { id: petId } });

    if (!pet) throw new NotFoundException('Không tìm thấy thú cưng');

    Object.assign(pet, updateDTO);
    await this.petRepository.save(pet);
  }

  // Xoá thú cưng
  async deletePet(petId: string, userId: string) {
    const pet = await this.petRepository.findOne({
      where: { id: petId, ownerId: userId },
    });

    if (!pet) throw new NotFoundException('Không tìm thấy pet');
    await this.petRepository.delete({ id: petId });
  }
}
