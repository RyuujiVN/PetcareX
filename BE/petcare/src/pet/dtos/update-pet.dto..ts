import { PartialType } from '@nestjs/swagger';
import { CreatePetDTO } from './create-pet.dto';

export class UpdatePetDTO extends PartialType(CreatePetDTO) {}
