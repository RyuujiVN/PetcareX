import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';

class ErrorHandler {
  static String getLocalizedError(String? error, BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (error == null) return l10n.failed;
    final normalized = error.trim().toLowerCase();

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
        if (normalized == 'email không hợp lệ' ||
            normalized == 'invalid email address') {
          return l10n.invalidEmail;
        }

        if (normalized ==
                'mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số' ||
            normalized ==
                'password must contain at least one uppercase letter, one lowercase letter, and one number') {
          return l10n.passwordComplexityError;
        }

        if (normalized == 'otp đã hết hạn' ||
            normalized == 'mã otp đã hết hạn' ||
            normalized == 'otp code has expired') {
          return l10n.otpExpired;
        }

        if (normalized == 'mã otp không đúng' ||
            normalized == 'otp không đúng' ||
            normalized == 'invalid otp code') {
          return l10n.invalidOtp;
        }

        if (normalized == 'bad request exception' || normalized == 'bad request') {
          return l10n.failed;
        }

        return error;
    }
  }
}