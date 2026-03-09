import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Repository } from 'typeorm';
import { CreatePetDTO } from './dtos/create-pet.dto';
import { UpdatePetDTO } from './dtos/update-pet.dto.';
import { Species } from './entities/species.entity';
import { Breed } from './entities/breed.entity';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @InjectRepository(Species)
    private readonly speciesRepository: Repository<Species>,
    @InjectRepository(Breed)
    private readonly breedRepository: Repository<Breed>,
  ) {}

  async findOneById(petId: string) {
    const pet = await this.petRepository
      .createQueryBuilder('pet')
      .innerJoinAndSelect('pet.breed', 'breed')
      .innerJoinAndSelect('breed.species', 'species')
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

  // Danh sách thú cưng của riêng mình
  async findPetsByOwnerId(ownerId: string) {
    const queryBuilder = this.petRepository
      .createQueryBuilder('pet')
      .innerJoinAndSelect('pet.breed', 'breed')
      .where('pet.ownerId = :ownerId', {
        ownerId: ownerId,
      })
      .getMany();

    return queryBuilder;
  }

  // Danh sách loài
  async findAllSpecies(): Promise<Species[]> {
    return await this.speciesRepository.find();
  }

  // Danh sách giống
  async findAllBreed(speciesId: string): Promise<Breed[]> {
    return await this.breedRepository.find({
      where: {
        speciesId: speciesId,
      },
    });
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
  async deletePet(petId: string) {
    const result = await this.petRepository.delete({ id: petId });

    if (result.affected === 0)
      throw new NotFoundException('Không tìm thấy thú cưng');
  }
}
