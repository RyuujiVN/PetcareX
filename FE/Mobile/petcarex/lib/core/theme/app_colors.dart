import 'package:flutter/material.dart';

class AppColors {
  // Core semantic colors
  static const primary = Color(0xFF13ECDA);
  static const secondary = Color(0xFFFFFFFF);
  static const background = Color(0xFFF8F9FA);
  static const text = Color(0xFF1A1C1E);
  static const border = Color(0xFFE0E0E0);
  static const error = Color(0xFFEA5455);
  static const success = Color(0xFF2E7D32);

  static const onPrimary = secondary;
  static const transparent = Color(0x00000000);
  static const navInactive = Color(0xFFBDBDBD);

  // Derived colors from core palette
  static Color textAlpha(double alpha) => text.withValues(alpha: alpha);
  static Color primaryAlpha(double alpha) => primary.withValues(alpha: alpha);
  static Color errorAlpha(double alpha) => error.withValues(alpha: alpha);
  static Color successAlpha(double alpha) => success.withValues(alpha: alpha);

  // Legacy aliases for non-refactored modules
  static const appBarBackground = secondary;
  static const surface = secondary;
  static const cardBackground = secondary;

  static const textDark = text;
  static const white = secondary;
  static const black = text;
  static const divider = border;

  static const grey = text;
  static const textGrey = text;
  static const borderGrey = border;
  static const iconGrey = text;

  static const formBorder = border;
  static const formFill = secondary;
  static const formFillDisabled = background;
  static const formLabel = text;

  static const buttonSecondary = background;
  static const buttonSecondaryText = text;

  static const primaryLight = background;
  static const successLight = background;
  static const errorLight = background;
  static const errorBorder = error;
  static const warning = text;

  static const male = primary;
  static const female = error;

  static const infoAccent = primary;
  static const petAccent = primary;
  static const securityAccent = primary;
}
