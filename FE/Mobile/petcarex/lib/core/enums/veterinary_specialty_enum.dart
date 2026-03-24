import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';
// bỏ qua lỗi về tên 
// ignore_for_file: constant_identifier_names
enum VeterinarySpecialtyEnum {
  GENERAL_EXAMINATION('GENERAL_EXAMINATION'),
  INTERNAL_MEDICINE('INTERNAL_MEDICINE'),
  SURGERY('SURGERY'),
  ULTRASOUND('ULTRASOUND'),
  VACCINATION_AND_PREVENTION('VACCINATION_AND_PREVENTION');

  final String value;
  const VeterinarySpecialtyEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case VeterinarySpecialtyEnum.GENERAL_EXAMINATION:
        return l10n.specialtyGeneralExamination;
      case VeterinarySpecialtyEnum.INTERNAL_MEDICINE:
        return l10n.specialtyInternalMedicine;
      case VeterinarySpecialtyEnum.SURGERY:
        return l10n.specialtySurgery;
      case VeterinarySpecialtyEnum.ULTRASOUND:
        return l10n.specialtyUltrasound;
      case VeterinarySpecialtyEnum.VACCINATION_AND_PREVENTION:
        return l10n.specialtyVaccinationAndPrevention;
    }
  }

  static VeterinarySpecialtyEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final specialty in VeterinarySpecialtyEnum.values) {
      if (specialty.name.toUpperCase() == normalized ||
          specialty.value.toUpperCase() == normalized) {
        return specialty;
      }
    }

    return null;
  }
}
