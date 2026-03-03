import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

class ResetPasswordPage extends StatefulWidget {
  final String email;
  const ResetPasswordPage({super.key, required this.email});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController otpController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();
  final ApiClient _apiClient = ApiClient();

  bool _isLoading = false;
  bool _isResending = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  Timer? _timer;
  int _start = 60;
  bool _canResend = true;

  void startTimer() {
    setState(() {
      _canResend = false;
      _start = 60;
    });
    _timer = Timer.periodic(
      const Duration(seconds: 1),
      (Timer timer) {
        if (_start == 0) {
          setState(() {
            _canResend = true;
            timer.cancel();
          });
        } else {
          setState(() {
            _start--;
          });
        }
      },
    );
  }

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    otpController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _resendOTP() async {
    if (_isResending || !_canResend) return;

    setState(() {
      _isResending = true;
    });

    try {
      final response = await _apiClient.post('/auth/forgot-password', {
        'email': widget.email,
      });

      if (!mounted) return;

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        _showQuickSnackBar('Mã OTP đã được gửi lại thành công', isError: false);
        startTimer();
      } else {
        _showQuickSnackBar(data['message'] ?? 'Không thể gửi lại mã OTP', isError: true);
      }
    } catch (e) {
      if (!mounted) return;
      _showQuickSnackBar('Lỗi kết nối: $e', isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _isResending = false;
        });
      }
    }
  }

  Future<void> _resetPassword() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiClient.post('/auth/reset-password', {
        'email': widget.email,
        'otp': otpController.text.trim(),
        'newPassword': passwordController.text,
        'cofirmPassword': confirmPasswordController.text,
      });

      if (!mounted) return;

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        _showQuickSnackBar(data['message'] ?? 'Đổi mật khẩu thành công', isError: false);
        
        await Future.delayed(const Duration(milliseconds: 1000));
        if (!mounted) return;
        
        Navigator.of(context).popUntil((route) => route.isFirst);
      } else {
        String errorMessage = 'Có lỗi xảy ra';
        
        if (data['message'] != null) {
          errorMessage = data['message'];
        } else if (data['error'] != null && data['error']['message'] != null) {
          errorMessage = data['error']['message'];
        }
        
        _showQuickSnackBar(errorMessage, isError: true);
      }
    } catch (e) {
      if (!mounted) return;
      _showQuickSnackBar('Không thể kết nối đến máy chủ: $e', isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showQuickSnackBar(String message, {bool isError = true}) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        duration: const Duration(milliseconds: 1500),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: _buildResetCard(),
                ),
              ),
            ),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEEF2F3))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const SizedBox(width: 32),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.black, width: 1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Image.asset(
                  'assets/images/icon.png',
                  width: 30,
                  height: 30,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'PetCareX',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.help_outline, color: AppColors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildResetCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.grey.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.restart_alt,
                  size: 40,
                  color: AppColors.primary,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Thiết lập lại mật khẩu',
              textAlign: TextAlign.center,
              style: AppTextStyles.title,
            ),
            const SizedBox(height: 12),
            Text(
              'Mã OTP đã được gửi đến:\n${widget.email}',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.grey, fontSize: 13),
            ),
            const SizedBox(height: 24),
            _buildOTPField(),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: (_isLoading || _isResending || !_canResend) ? null : _resendOTP,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 30),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: _isResending
                    ? const SizedBox(
                        height: 14,
                        width: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      )
                    : Text(
                        _canResend ? 'Gửi lại mã OTP' : 'Gửi lại sau ${_start}s',
                        style: TextStyle(
                          color: _canResend ? AppColors.primary : AppColors.grey,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 16),
            _buildPasswordField(
              label: 'Nhập mật khẩu mới',
              controller: passwordController,
              obscureText: _obscurePassword,
              onToggle: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            const SizedBox(height: 16),
            _buildPasswordField(
              label: 'Nhập lại mật khẩu',
              controller: confirmPasswordController,
              obscureText: _obscureConfirmPassword,
              onToggle: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
            ),
            const SizedBox(height: 32),
            _buildSubmitButton(),
            const SizedBox(height: 24),
            _buildBackToForgot(),
          ],
        ),
      ),
    );
  }

  Widget _buildOTPField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mã OTP',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: otpController,
          keyboardType: TextInputType.number,
          enabled: !_isLoading,
          decoration: InputDecoration(
            hintText: 'Nhập mã OTP',
            hintStyle: TextStyle(color: AppColors.grey.withValues(alpha: 0.5)),
            prefixIcon: const Icon(Icons.security, size: 20, color: AppColors.grey),
            contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            filled: true,
            fillColor: const Color(0xFFF8F9FA),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Vui lòng nhập OTP';
            if (value.length < 4) return 'OTP không hợp lệ';
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildPasswordField({
    required String label,
    required TextEditingController controller,
    required bool obscureText,
    required VoidCallback onToggle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          decoration: InputDecoration(
            hintText: '● ● ● ● ● ● ● ●',
            hintStyle: TextStyle(
              color: AppColors.grey.withValues(alpha: 0.3),
              fontSize: 10,
              letterSpacing: 2,
            ),
            prefixIcon: const Icon(Icons.lock_outline, size: 20, color: AppColors.grey),
            suffixIcon: IconButton(
              icon: Icon(
                obscureText ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                size: 20,
                color: AppColors.grey,
              ),
              onPressed: onToggle,
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            filled: true,
            fillColor: const Color(0xFFF8F9FA),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Vui lòng nhập mật khẩu';
            if (label == 'Nhập lại mật khẩu' && value != passwordController.text) {
              return 'Mật khẩu không khớp';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      height: 54,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _resetPassword,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : const Text(
                'Thiết lập lại mật khẩu',
                style: AppTextStyles.button,
              ),
      ),
    );
  }

  Widget _buildBackToForgot() {
    return Center(
      child: GestureDetector(
        onTap: (_isLoading || _isResending) ? null : () => Navigator.pop(context),
        child: const Text(
          'Quay lại quên mật khẩu',
          style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 16),
      child: Text(
        ' 2026 PetCareX Vietnam. Tất cả quyền được bảo lưu.',
        style: TextStyle(color: AppColors.grey, fontSize: 11),
      ),
    );
  }
}
