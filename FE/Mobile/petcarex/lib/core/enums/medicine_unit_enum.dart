import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

enum MedicineUnitEnum {
  PILL('PILL'),
  BLISTER('BLISTER'),
  CAPSULE('CAPSULE'),
  SACHET('SACHET'),
  BOTTLE('BOTTLE'),
  VIAL('VIAL'),
  AMPOULE('AMPOULE'),
  ML('ML'),
  MG('MG');

  final String value;
  const MedicineUnitEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case MedicineUnitEnum.PILL:
        return l10n.medicineUnitPill;
      case MedicineUnitEnum.BLISTER:
        return l10n.medicineUnitBlister;
      case MedicineUnitEnum.CAPSULE:
        return l10n.medicineUnitCapsule;
      case MedicineUnitEnum.SACHET:
        return l10n.medicineUnitSachet;
      case MedicineUnitEnum.BOTTLE:
        return l10n.medicineUnitBottle;
      case MedicineUnitEnum.VIAL:
        return l10n.medicineUnitVial;
      case MedicineUnitEnum.AMPOULE:
        return l10n.medicineUnitAmpoule;
      case MedicineUnitEnum.ML:
        return l10n.medicineUnitMl;
      case MedicineUnitEnum.MG:
        return l10n.medicineUnitMg;
    }
  }

  static MedicineUnitEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final unit in MedicineUnitEnum.values) {
      if (unit.name.toUpperCase() == normalized ||
          unit.value.toUpperCase() == normalized) {
        return unit;
      }
    }

    return null;
  }
}
