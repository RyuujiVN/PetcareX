import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class PasswordTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? errorText;
  final String hintText;

  const PasswordTextField({
    super.key,
    required this.controller,
    required this.label,
    this.errorText,
    this.hintText = '••••••••',
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
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: widget.controller,
          obscureText: _isObscure,
          // 1. Chỉnh ký tự dấu chấm khi đang nhập (nhỏ và thanh hơn)
          obscuringCharacter: '•',
          style: const TextStyle(letterSpacing: 2.0),
          decoration: InputDecoration(
            // 2. Chỉnh dấu chấm gợi ý (Hint)
            hintText: widget.hintText,
            hintStyle: TextStyle(
              color: AppColors.grey.withOpacity(0.3),
              fontSize: 10,
              letterSpacing: 2.0,
            ),
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(_isObscure ? Icons.visibility_off : Icons.visibility),
              onPressed: () => setState(() => _isObscure = !_isObscure),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            errorText: widget.errorText,
          ),
        ),
      ],
    );
  }
}
