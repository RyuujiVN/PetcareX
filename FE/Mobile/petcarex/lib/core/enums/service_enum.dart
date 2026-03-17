import 'package:flutter/material.dart';
import '../../l10n/generated/app_localizations.dart';

enum ServiceEnum {
  PERIODIC_HEALTH_CHECK('Khám sức khoẻ định kỳ'),
  MEDICAL_EXAMINATION('Khám bệnh'),
  VACCINATION('Tiêm chủng'),
  DEWORMING('Tẩy giun'),
  ULTRASOUND_AND_TEST('Siêu âm xét nghiệm'),
  SURGERY('Phẫu thuật'),
  EMERGENCY('Cấp cứu');

  final String value;
  const ServiceEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case ServiceEnum.PERIODIC_HEALTH_CHECK:
        return l10n.servicePeriodicHealthCheck;
      case ServiceEnum.MEDICAL_EXAMINATION:
        return l10n.serviceMedicalExamination;
      case ServiceEnum.VACCINATION:
        return l10n.serviceVaccination;
      case ServiceEnum.DEWORMING:
        return l10n.serviceDeworming;
      case ServiceEnum.ULTRASOUND_AND_TEST:
        return l10n.serviceUltrasoundAndTest;
      case ServiceEnum.SURGERY:
        return l10n.serviceSurgery;
      case ServiceEnum.EMERGENCY:
        return l10n.serviceEmergency;
    }
  }

  static ServiceEnum? fromValue(String val) {
    try {
      return ServiceEnum.values.firstWhere((e) => e.value == val);
    } catch (_) {
      return null;
    }
  }
}
