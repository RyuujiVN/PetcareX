import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

enum VeterinarySpecialtyEnum {
  GENERAL_EXAMINATION('Khám tổng quát'),
  INTERNAL_MEDICINE('Nội khoa'),
  SURGERY('Phẫu thuật'),
  ULTRASOUND('Siêu âm'),
  VACCINATION_AND_PREVENTION('Tiêm phòng & phòng ngừa');

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
    try {
      return VeterinarySpecialtyEnum.values.firstWhere((e) => e.value == value);
    } catch (_) {
      return null;
    }
  }
}
