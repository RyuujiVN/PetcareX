import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

enum RoleEnum {
  ADMIN('ADMIN'),
  ADMIN_CLINIC('ADMIN_CLINIC'),
  VETERINARIAN('VETERINARIAN'),
  CUSTOMER('CUSTOMER');

  final String value;
  const RoleEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case RoleEnum.ADMIN:
        return l10n.roleAdmin;
      case RoleEnum.ADMIN_CLINIC:
        return l10n.roleAdminClinic;
      case RoleEnum.VETERINARIAN:
        return l10n.roleVeterinarian;
      case RoleEnum.CUSTOMER:
        return l10n.roleCustomer;
    }
  }

  static RoleEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final role in RoleEnum.values) {
      if (role.name.toUpperCase() == normalized ||
          role.value.toUpperCase() == normalized) {
        return role;
      }
    }

    return null;
  }
}
