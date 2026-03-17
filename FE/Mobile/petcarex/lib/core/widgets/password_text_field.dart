import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class PasswordTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? errorText;
  final String hintText;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;

  const PasswordTextField({
    super.key,
    required this.controller,
    required this.label,
    this.errorText,
    this.hintText = '••••••••',
    this.focusNode,
    this.textInputAction,
    this.onSubmitted,
  });

  @override
  State<PasswordTextField> createState() => _PasswordTextFieldState();
}

class _PasswordTextFieldState extends State<PasswordTextField> {
  bool _isObscure = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textDark),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: widget.controller,
          obscureText: _isObscure,
          focusNode: widget.focusNode,
          textInputAction: widget.textInputAction,
          onSubmitted: widget.onSubmitted,
          obscuringCharacter: '●',
          style: const TextStyle(letterSpacing: 2.0, fontSize: 16, color: AppColors.textDark),
          decoration: InputDecoration(
            hintText: widget.hintText,
            hintStyle: TextStyle(
              color: AppColors.iconGrey.withValues(alpha: 0.4),
              fontSize: 14,
              letterSpacing: 2.0,
            ),
            prefixIcon: const Icon(Icons.lock_outline, color: AppColors.iconGrey),
            suffixIcon: IconButton(
              icon: Icon(_isObscure ? Icons.visibility_off : Icons.visibility, color: AppColors.iconGrey),
              onPressed: () => setState(() => _isObscure = !_isObscure),
            ),
            filled: true,
            fillColor: AppColors.formFill,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.formBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.formBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorText: widget.errorText,
          ),
        ),
      ],
    );
  }
}
