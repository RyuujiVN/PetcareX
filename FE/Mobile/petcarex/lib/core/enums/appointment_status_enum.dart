import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

enum AppointmentStatusEnum {
  BOOKED('Hẹn thành công'),
  IN_PROGRESS('Đang khám'),
  COMPLETED('Đã khám xong'),
  CANCELLED('Đã huỷ');

  final String value;
  const AppointmentStatusEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case AppointmentStatusEnum.BOOKED:
        return l10n.statusUpcoming;
      case AppointmentStatusEnum.IN_PROGRESS:
        return l10n.statusInProgress;
      case AppointmentStatusEnum.COMPLETED:
        return l10n.statusCompleted;
      case AppointmentStatusEnum.CANCELLED:
        return l10n.statusCancelled;
    }
  }

  static AppointmentStatusEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final status in AppointmentStatusEnum.values) {
      if (status.name.toUpperCase() == normalized ||
          status.value.toUpperCase() == normalized) {
        return status;
      }
    }

    return null;
  }
}
