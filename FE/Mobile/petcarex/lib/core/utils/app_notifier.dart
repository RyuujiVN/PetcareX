import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

enum AppNoticeType { info, success, error }

class AppNotifier {
  static OverlayEntry? _activeEntry;
  static Timer? _dismissTimer;

  static void showInfo(
    BuildContext context,
    String message, {
    Duration duration = const Duration(milliseconds: 2200),
  }) {
    _show(context, message, AppNoticeType.info, duration: duration);
  }

  static void showSuccess(
    BuildContext context,
    String message, {
    Duration duration = const Duration(milliseconds: 2200),
  }) {
    _show(context, message, AppNoticeType.success, duration: duration);
  }

  static void showError(
    BuildContext context,
    String message, {
    Duration duration = const Duration(milliseconds: 2200),
  }) {
    _show(context, message, AppNoticeType.error, duration: duration);
  }

  static void _show(
    BuildContext context,
    String message,
    AppNoticeType type, {
    required Duration duration,
  }) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) {
      return;
    }

    _clearActive();

    final topInset = MediaQuery.of(context).padding.top;
    final colors = _resolveColors(type);
    final icon = _resolveIcon(type);

    _activeEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: topInset + 8,
        left: 14,
        right: 14,
        child: SafeArea(
          bottom: false,
          child: TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 180),
            tween: Tween(begin: 0, end: 1),
            curve: Curves.easeOutCubic,
            builder: (context, value, child) {
              return Opacity(
                opacity: value,
                child: Transform.translate(
                  offset: Offset(0, (1 - value) * -10),
                  child: child,
                ),
              );
            },
            child: Material(
              color: Colors.transparent,
              child: Container(
                decoration: BoxDecoration(
                  color: colors.background,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: colors.border),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.black.withValues(alpha: 0.09),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 11,
                  ),
                  child: Row(
                    children: [
                      Icon(icon, color: colors.foreground, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          message,
                          style: TextStyle(
                            color: colors.foreground,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    overlay.insert(_activeEntry!);
    _dismissTimer = Timer(duration, _clearActive);
  }

  static void _clearActive() {
    _dismissTimer?.cancel();
    _dismissTimer = null;
    _activeEntry?.remove();
    _activeEntry = null;
  }

  static _NoticeColors _resolveColors(AppNoticeType type) {
    return switch (type) {
      AppNoticeType.info => _NoticeColors(
        background: AppColors.primaryAlpha(0.12),
        foreground: AppColors.primary,
        border: AppColors.primaryAlpha(0.28),
      ),
      AppNoticeType.success => _NoticeColors(
        background: AppColors.successAlpha(0.14),
        foreground: AppColors.success,
        border: AppColors.successAlpha(0.3),
      ),
      AppNoticeType.error => _NoticeColors(
        background: AppColors.errorAlpha(0.12),
        foreground: AppColors.error,
        border: AppColors.errorAlpha(0.28),
      ),
    };
  }

  static IconData _resolveIcon(AppNoticeType type) {
    return switch (type) {
      AppNoticeType.info => Icons.info_outline,
      AppNoticeType.success => Icons.check_circle_outline,
      AppNoticeType.error => Icons.error_outline,
    };
  }
}

class _NoticeColors {
  final Color background;
  final Color foreground;
  final Color border;

  const _NoticeColors({
    required this.background,
    required this.foreground,
    required this.border,
  });
}
