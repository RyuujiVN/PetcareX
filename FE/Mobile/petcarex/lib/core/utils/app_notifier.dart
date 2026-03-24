import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

enum AppNoticeType { info, success, error, warning }

class AppNotifier {
  static OverlayEntry? _activeEntry;

  static void showInfo(
    BuildContext context,
    String message, {
    String? subMessage,
    Duration duration = const Duration(seconds: 3),
  }) {
    _show(
      context,
      message,
      AppNoticeType.info,
      duration: duration,
      subMessage: subMessage,
    );
  }

  static void showSuccess(
    BuildContext context,
    String message, {
    String? subMessage,
    Duration duration = const Duration(seconds: 3),
  }) {
    _show(
      context,
      message,
      AppNoticeType.success,
      duration: duration,
      subMessage: subMessage,
    );
  }

  static void showError(
    BuildContext context,
    String message, {
    String? subMessage,
    Duration duration = const Duration(seconds: 3),
  }) {
    _show(
      context,
      message,
      AppNoticeType.error,
      duration: duration,
      subMessage: subMessage,
    );
  }

  static void showWarning(
    BuildContext context,
    String message, {
    String? subMessage,
    Duration duration = const Duration(seconds: 3),
  }) {
    _show(
      context,
      message,
      AppNoticeType.warning,
      duration: duration,
      subMessage: subMessage,
    );
  }

  static void _show(
    BuildContext context,
    String message,
    AppNoticeType type, {
    String? subMessage,
    required Duration duration,
  }) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;

    _activeEntry?.remove();
    _activeEntry = null;

    final topPadding = MediaQuery.of(context).padding.top + 60;
    final style = _resolveStyle(type);

    _activeEntry = OverlayEntry(
      builder: (entryContext) => Positioned(
        top: topPadding,
        left: 16,
        right: 16,
        child: Material(
          color: AppColors.transparent,
          child: _TopToast(
            icon: style.icon,
            iconColor: style.iconColor,
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
            textColor: style.textColor,
            message: message,
            subMessage: subMessage,
            duration: duration,
            onDismissed: () {
              _activeEntry?.remove();
              _activeEntry = null;
            },
          ),
        ),
      ),
    );

    overlay.insert(_activeEntry!);
  }

  static _NoticeStyle _resolveStyle(AppNoticeType type) {
    return switch (type) {
      // Info
      AppNoticeType.info => const _NoticeStyle(
        icon: Icons.info_rounded,
        iconColor: AppColors.noticeInfoIcon,
        backgroundColor: AppColors.noticeInfoBackground,
        borderColor: AppColors.noticeInfoBorder,
        textColor: AppColors.noticeInfoText,
      ),
      // Success
      AppNoticeType.success => const _NoticeStyle(
        icon: Icons.check_circle_rounded,
        iconColor: AppColors.noticeSuccessIcon,
        backgroundColor: AppColors.noticeSuccessBackground,
        borderColor: AppColors.noticeSuccessBorder,
        textColor: AppColors.noticeSuccessText,
      ),
      // Error
      AppNoticeType.error => const _NoticeStyle(
        icon: Icons.cancel_rounded,
        iconColor: AppColors.noticeErrorIcon,
        backgroundColor: AppColors.noticeErrorBackground,
        borderColor: AppColors.noticeErrorBorder,
        textColor: AppColors.noticeErrorText,
      ),
      // Warning
      AppNoticeType.warning => const _NoticeStyle(
        icon: Icons.warning_rounded,
        iconColor: AppColors.noticeWarningIcon,
        backgroundColor: AppColors.noticeWarningBackground,
        borderColor: AppColors.noticeWarningBorder,
        textColor: AppColors.noticeWarningText,
      ),
    };
  }
}

class _NoticeStyle {
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;

  const _NoticeStyle({
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
  });
}

class _TopToast extends StatefulWidget {
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;
  final String message;
  final String? subMessage;
  final Duration duration;
  final VoidCallback onDismissed;

  const _TopToast({
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
    required this.message,
    required this.subMessage,
    required this.duration,
    required this.onDismissed,
  });

  @override
  State<_TopToast> createState() => _TopToastState();
}

class _TopToastState extends State<_TopToast>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _slide;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _opacity = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _slide = Tween<Offset>(
      begin: const Offset(0, -0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    _controller.forward();
    _dismissTimer = Timer(widget.duration, () async {
      if (!mounted) return;
      await _controller.reverse();
      if (mounted) widget.onDismissed();
    });
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: Container(
          decoration: BoxDecoration(
            color: widget.backgroundColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: widget.borderColor, width: 1.0),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.08),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
          child: Row(
            mainAxisSize: MainAxisSize.max,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Icon(widget.icon, size: 18, color: widget.iconColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      widget.message,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: widget.textColor,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                    if (widget.subMessage != null &&
                        widget.subMessage!.trim().isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        widget.subMessage!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: widget.textColor.withOpacity(0.75),
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
