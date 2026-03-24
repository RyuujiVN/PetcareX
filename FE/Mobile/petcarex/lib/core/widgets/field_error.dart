import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class FieldError extends StatefulWidget {
  final String message;
  final bool visible;

  const FieldError({
    super.key,
    required this.message,
    required this.visible,
  });

  @override
  State<FieldError> createState() => _FieldErrorState();
}

class _FieldErrorState extends State<FieldError>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
      value: widget.visible ? 1 : 0,
    );
    _opacity = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
  }

  @override
  void didUpdateWidget(covariant FieldError oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.visible && !oldWidget.visible) {
      _controller.forward(from: 0);
    } else if (!widget.visible && oldWidget.visible) {
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.visible && _controller.value == 0) {
      return const SizedBox.shrink();
    }

    return FadeTransition(
      opacity: _opacity,
      child: Padding(
        padding: const EdgeInsets.only(top: 6, left: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(
              Icons.error_outline,
              size: 13,
              color: AppColors.fieldErrorText,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                widget.message,
                style: const TextStyle(
                  fontSize: 12,
                  height: 16 / 12,
                  color: AppColors.fieldErrorText,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
