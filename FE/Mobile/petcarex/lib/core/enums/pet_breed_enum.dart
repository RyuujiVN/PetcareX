import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';
import 'pet_species_enum.dart';

enum PetBreedEnum {
  DOG_GOLDEN_RETRIEVER('DOG_GOLDEN_RETRIEVER'),
  DOG_POODLE('DOG_POODLE'),
  DOG_POMERANIAN('DOG_POMERANIAN'),
  DOG_CORGI('DOG_CORGI'),
  DOG_HUSKY('DOG_HUSKY'),
  DOG_LABRADOR('DOG_LABRADOR'),
  DOG_SHIBA_INU('DOG_SHIBA_INU'),
  CAT_BRITISH_SHORTHAIR('CAT_BRITISH_SHORTHAIR'),
  CAT_BRITISH_LONGHAIR('CAT_BRITISH_LONGHAIR'),
  CAT_PERSIAN('CAT_PERSIAN'),
  CAT_SIAMESE('CAT_SIAMESE'),
  CAT_BENGAL('CAT_BENGAL'),
  BIRD_RED_WHISKERED_BULBUL('BIRD_RED_WHISKERED_BULBUL'),
  BIRD_PARROT('BIRD_PARROT'),
  BIRD_BUDGERIGAR('BIRD_BUDGERIGAR'),
  RABBIT_DUTCH('RABBIT_DUTCH'),
  RABBIT_LIONHEAD('RABBIT_LIONHEAD');

  final String value;
  const PetBreedEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case PetBreedEnum.DOG_GOLDEN_RETRIEVER:
        return l10n.petBreedDogGoldenRetriever;
      case PetBreedEnum.DOG_POODLE:
        return l10n.petBreedDogPoodle;
      case PetBreedEnum.DOG_POMERANIAN:
        return l10n.petBreedDogPomeranian;
      case PetBreedEnum.DOG_CORGI:
        return l10n.petBreedDogCorgi;
      case PetBreedEnum.DOG_HUSKY:
        return l10n.petBreedDogHusky;
      case PetBreedEnum.DOG_LABRADOR:
        return l10n.petBreedDogLabrador;
      case PetBreedEnum.DOG_SHIBA_INU:
        return l10n.petBreedDogShibaInu;
      case PetBreedEnum.CAT_BRITISH_SHORTHAIR:
        return l10n.petBreedCatBritishShorthair;
      case PetBreedEnum.CAT_BRITISH_LONGHAIR:
        return l10n.petBreedCatBritishLonghair;
      case PetBreedEnum.CAT_PERSIAN:
        return l10n.petBreedCatPersian;
      case PetBreedEnum.CAT_SIAMESE:
        return l10n.petBreedCatSiamese;
      case PetBreedEnum.CAT_BENGAL:
        return l10n.petBreedCatBengal;
      case PetBreedEnum.BIRD_RED_WHISKERED_BULBUL:
        return l10n.petBreedBirdRedWhiskeredBulbul;
      case PetBreedEnum.BIRD_PARROT:
        return l10n.petBreedBirdParrot;
      case PetBreedEnum.BIRD_BUDGERIGAR:
        return l10n.petBreedBirdBudgerigar;
      case PetBreedEnum.RABBIT_DUTCH:
        return l10n.petBreedRabbitDutch;
      case PetBreedEnum.RABBIT_LIONHEAD:
        return l10n.petBreedRabbitLionhead;
    }
  }

  static PetBreedEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final breed in PetBreedEnum.values) {
      if (breed.name.toUpperCase() == normalized ||
          breed.value.toUpperCase() == normalized) {
        return breed;
      }
    }

    return null;
  }
}

const Map<PetSpeciesEnum, List<PetBreedEnum>> petBreedsBySpecies = {
  PetSpeciesEnum.DOG: [
    PetBreedEnum.DOG_GOLDEN_RETRIEVER,
    PetBreedEnum.DOG_POODLE,
    PetBreedEnum.DOG_POMERANIAN,
    PetBreedEnum.DOG_CORGI,
    PetBreedEnum.DOG_HUSKY,
    PetBreedEnum.DOG_LABRADOR,
    PetBreedEnum.DOG_SHIBA_INU,
  ],
  PetSpeciesEnum.CAT: [
    PetBreedEnum.CAT_BRITISH_SHORTHAIR,
    PetBreedEnum.CAT_BRITISH_LONGHAIR,
    PetBreedEnum.CAT_PERSIAN,
    PetBreedEnum.CAT_SIAMESE,
    PetBreedEnum.CAT_BENGAL,
  ],
  PetSpeciesEnum.BIRD: [
    PetBreedEnum.BIRD_RED_WHISKERED_BULBUL,
    PetBreedEnum.BIRD_PARROT,
    PetBreedEnum.BIRD_BUDGERIGAR,
  ],
  PetSpeciesEnum.RABBIT: [
    PetBreedEnum.RABBIT_DUTCH,
    PetBreedEnum.RABBIT_LIONHEAD,
  ],
};
