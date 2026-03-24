import 'package:flutter/material.dart';

class AppColors {
  // Core semantic colors
  static const primary = Color(0xFF4672B4);
  static const onPrimary = Color(0xFFFFFFFF);
  static const secondary = Color(0xFFFFFFFF);
  static const background = Color(0xFFFFFFFF);
  static const appBarBackground = secondary;
  static const surface = secondary;
  static const cardBackground = secondary;

  static const text = Color(0xFF1A1C1E);
  static const textDark = text;
  static const formLabel = Color(0xFF495057);
  static const border = Color(0xFFE0E0E0);
  static const divider = Color(0xFFEEEEEE);

  static const white = secondary;
  static const black = Color(0xFF000000);
  static const transparent = Color(0x00000000);

  // Grayscale and muted semantic colors
  static const grey = Color(0xFF9E9E9E);
  static const textGrey = Color(0xFF6C757D);
  static const borderGrey = Color(0xFFE0E0E0);
  static const iconGrey = Color(0xFFBDBDBD);
  static const navInactive = Color(0xFFBDBDBD);

  // Form and action surfaces
  static const formBorder = border;
  static const formFill = secondary;
  static const formFillDisabled = Color(0xFFF5F5F5);
  static const buttonSecondary = Color(0xFFE9ECEF);
  static const buttonSecondaryText = Color(0xFF495057);

  // Status colors
  static const error = Color(0xFFEA5455);
  static const errorLight = Color(0xFFFFEAEA);
  static const errorBorder = Color(0xFFFFC1C1);
  static const fieldErrorBorder = Color(0xFFE24B4A);
  static const fieldErrorBackground = Color(0xFFFFF5F5);
  static const fieldErrorText = Color(0xFFA32D2D);
  static const success = Color(0xFF43A047);
  static const successLight = Color(0xFFE8F5E9);
  static const warning = Color(0xFFFF9800);
  static const primaryLight = Color(0xFFE0F7F4);

  // Toast palette
  static const toastBackground = Color(0xFF1C1C1E);
  static const toastText = Color(0xFFFFFFFF);
  static const toastSubText = Color(0x99FFFFFF);
  static const toastSuccess = Color(0xFF63D68D);
  static const toastError = Color(0xFFF07070);
  static const toastWarning = Color(0xFFF5B942);
  static const toastErrorBackground = Color(0xFFA32D2D);
  static const toastWarningBackground = Color(0xFF854F0B);

  // In-app notice palette (top notifier)
  static const noticeInfoIcon = Color(0xFF185FA5);
  static const noticeInfoBackground = Color(0xFFE6F1FB);
  static const noticeInfoBorder = Color(0xFF85B7EB);
  static const noticeInfoText = Color(0xFF0C447C);

  static const noticeSuccessIcon = Color(0xFF3B6D11);
  static const noticeSuccessBackground = Color(0xFFEAF3DE);
  static const noticeSuccessBorder = Color(0xFF97C459);
  static const noticeSuccessText = Color(0xFF27500A);

  static const noticeErrorIcon = fieldErrorText;
  static const noticeErrorBackground = Color(0xFFFCEBEB);
  static const noticeErrorBorder = Color(0xFFF09595);
  static const noticeErrorText = Color(0xFF791F1F);

  static const noticeWarningIcon = toastWarningBackground;
  static const noticeWarningBackground = Color(0xFFFAEEDA);
  static const noticeWarningBorder = Color(0xFFEF9F27);
  static const noticeWarningText = Color(0xFF633806);

  // Domain accents
  static const male = Color(0xFF2196F3);
  static const female = Color(0xFFE91E63);
  static const infoAccent = Color(0xFF00CFE8);
  static const petAccent = Color(0xFFFAAF00);
  static const securityAccent = Color(0xFF7367F0);

  // Derived colors from core palette
  static Color textAlpha(double alpha) => text.withValues(alpha: alpha);
  static Color primaryAlpha(double alpha) => primary.withValues(alpha: alpha);
  static Color errorAlpha(double alpha) => error.withValues(alpha: alpha);
  static Color successAlpha(double alpha) => success.withValues(alpha: alpha);
}
