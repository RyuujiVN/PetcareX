import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Repository } from 'typeorm';
import { CreatePetDTO } from './dtos/create-pet.dto';
import { UpdatePetDTO } from './dtos/update-pet.dto.';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet) private readonly petRepository: Repository<Pet>,
  ) {}

  async findOneById(petId: string) {
    const pet = await this.petRepository
      .createQueryBuilder('pet')
      .leftJoinAndSelect('pet.breed', 'breed')
      .leftJoinAndSelect('breed.species', 'species')
      .where('pet.id = :id', { id: petId })
      .getOne();

    if (!pet) throw new NotFoundException('Không tìm thấy thú cưng');

    const petResponse = {
      ...pet,
      species: pet?.breed?.species,
      breed: {
        id: pet?.breed?.id,
        name: pet?.breed?.name,
      },
    };

    return petResponse;
  }

  async createPet(createDTO: CreatePetDTO, ownerId: string) {
    const pet = this.petRepository.create(createDTO);
    pet.ownerId = ownerId;

    const savedPet = await this.petRepository.save(pet);

    return await this.findOneById(savedPet.id);
  }

  async updatePet(updateDTO: UpdatePetDTO, petId: string) {
    const pet = await this.petRepository.findOne({ where: { id: petId } });

    if (!pet) throw new NotFoundException('Không tìm thấy thú cưng');

    Object.assign(pet, updateDTO);
    await this.petRepository.save(pet);
  }

  async deletePet(petId: string) {
    const result = await this.petRepository.delete({ id: petId });

    console.log(petId);

    if (result.affected === 0)
      throw new NotFoundException('Không tìm thấy thú cưng');
  }
}
