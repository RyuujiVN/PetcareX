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
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final AutovalidateMode? autovalidateMode;

  const PasswordTextField({
    super.key,
    required this.controller,
    required this.label,
    this.errorText,
    this.hintText = '••••••••',
    this.focusNode,
    this.textInputAction,
    this.onSubmitted,
    this.onChanged,
    this.validator,
    this.autovalidateMode,
  });

  @override
  State<PasswordTextField> createState() => _PasswordTextFieldState();
}

class _PasswordTextFieldState extends State<PasswordTextField> {
  bool _isObscure = true;

  @override
  Widget build(BuildContext context) {
    final bool hasError =
      widget.errorText != null && widget.errorText!.trim().isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textDark),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: widget.controller,
          obscureText: _isObscure,
          focusNode: widget.focusNode,
          textInputAction: widget.textInputAction,
          onFieldSubmitted: widget.onSubmitted,
          onChanged: widget.onChanged,
          validator: widget.validator,
          autovalidateMode: widget.autovalidateMode,
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
            fillColor: hasError
                ? AppColors.fieldErrorBackground
                : AppColors.formFill,
            errorText: widget.errorText,
            errorStyle: const TextStyle(
              color: AppColors.fieldErrorText,
              fontSize: 12,
              height: 1.4,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: hasError
                    ? AppColors.fieldErrorBorder
                    : AppColors.formBorder,
                width: hasError ? 1.5 : 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: hasError
                    ? AppColors.fieldErrorBorder
                    : AppColors.formBorder,
                width: hasError ? 1.5 : 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: hasError
                    ? AppColors.fieldErrorBorder
                    : AppColors.primary,
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: AppColors.fieldErrorBorder,
                width: 1.5,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: AppColors.fieldErrorBorder,
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
