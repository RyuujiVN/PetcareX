import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

enum PetSpeciesEnum {
  DOG('DOG'),
  CAT('CAT'),
  BIRD('BIRD'),
  RABBIT('RABBIT');

  final String value;
  const PetSpeciesEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case PetSpeciesEnum.DOG:
        return l10n.petSpeciesDog;
      case PetSpeciesEnum.CAT:
        return l10n.petSpeciesCat;
      case PetSpeciesEnum.BIRD:
        return l10n.petSpeciesBird;
      case PetSpeciesEnum.RABBIT:
        return l10n.petSpeciesRabbit;
    }
  }

  static PetSpeciesEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final species in PetSpeciesEnum.values) {
      if (species.name.toUpperCase() == normalized ||
          species.value.toUpperCase() == normalized) {
        return species;
      }
    }

    return null;
  }
}
