import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';
// bỏ qua lỗi về tên 
// ignore_for_file: constant_identifier_names
enum ServiceEnum {
  PERIODIC_HEALTH_CHECK('PERIODIC_HEALTH_CHECK'),
  MEDICAL_EXAMINATION('MEDICAL_EXAMINATION'),
  VACCINATION('VACCINATION'),
  DEWORMING('DEWORMING'),
  ULTRASOUND_AND_TEST('ULTRASOUND_AND_TEST'),
  SURGERY('SURGERY'),
  EMERGENCY('EMERGENCY');

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

  static ServiceEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final service in ServiceEnum.values) {
      if (service.name.toUpperCase() == normalized ||
          service.value.toUpperCase() == normalized) {
        return service;
      }
    }

    return null;
  }
}
