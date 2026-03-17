import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

class ErrorHandler {
  static String getLocalizedError(String? error, BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (error == null) return l10n.failed;

    switch (error) {
      case 'errorConnection':
        return l10n.connectionError;
      case 'errorUnknown':
        return l10n.errorUnknown;
      case 'errorNetwork':
        return l10n.errorNetwork;
      case 'errorFirebase':
        return l10n.errorFirebase;
      case 'errorGoogleAuth':
        return l10n.errorGoogleAuth;
      default:
        return error;
    }
  }
}