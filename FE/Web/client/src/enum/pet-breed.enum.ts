import { PetSpeciesEnum } from './pet-species.enum';

export enum PetBreedEnum {
  // Chó
  DOG_GOLDEN_RETRIEVER = 'DOG_GOLDEN_RETRIEVER',
  DOG_POODLE = 'DOG_POODLE',
  DOG_POMERANIAN = 'DOG_POMERANIAN',
  DOG_CORGI = 'DOG_CORGI',
  DOG_HUSKY = 'DOG_HUSKY',
  DOG_LABRADOR = 'DOG_LABRADOR',
  DOG_SHIBA_INU = 'DOG_SHIBA_INU',

  // Mèo
  CAT_BRITISH_SHORTHAIR = 'CAT_BRITISH_SHORTHAIR',
  CAT_BRITISH_LONGHAIR = 'CAT_BRITISH_LONGHAIR',
  CAT_PERSIAN = 'CAT_PERSIAN',
  CAT_SIAMESE = 'CAT_SIAMESE',
  CAT_BENGAL = 'CAT_BENGAL',

  // Chim
  BIRD_RED_WHISKERED_BULBUL = 'BIRD_RED_WHISKERED_BULBUL',
  BIRD_PARROT = 'BIRD_PARROT',
  BIRD_BUDGERIGAR = 'BIRD_BUDGERIGAR',

  // Thỏ
  RABBIT_DUTCH = 'RABBIT_DUTCH',
  RABBIT_LIONHEAD = 'RABBIT_LIONHEAD',
}

export const PET_BREEDS_BY_SPECIES: Record<PetSpeciesEnum, PetBreedEnum[]> = {
  [PetSpeciesEnum.DOG]: [
    PetBreedEnum.DOG_GOLDEN_RETRIEVER,
    PetBreedEnum.DOG_POODLE,
    PetBreedEnum.DOG_POMERANIAN,
    PetBreedEnum.DOG_CORGI,
    PetBreedEnum.DOG_HUSKY,
    PetBreedEnum.DOG_LABRADOR,
    PetBreedEnum.DOG_SHIBA_INU,
  ],
  [PetSpeciesEnum.CAT]: [
    PetBreedEnum.CAT_BRITISH_SHORTHAIR,
    PetBreedEnum.CAT_BRITISH_LONGHAIR,
    PetBreedEnum.CAT_PERSIAN,
    PetBreedEnum.CAT_SIAMESE,
    PetBreedEnum.CAT_BENGAL,
  ],
  [PetSpeciesEnum.BIRD]: [
    PetBreedEnum.BIRD_RED_WHISKERED_BULBUL,
    PetBreedEnum.BIRD_PARROT,
    PetBreedEnum.BIRD_BUDGERIGAR,
  ],
  [PetSpeciesEnum.RABBIT]: [
    PetBreedEnum.RABBIT_DUTCH,
    PetBreedEnum.RABBIT_LIONHEAD,
  ],
};
