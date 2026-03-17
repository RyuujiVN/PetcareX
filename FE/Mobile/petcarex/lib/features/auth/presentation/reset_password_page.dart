import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/password_text_field.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'providers/auth_provider.dart';

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

  bool _isResending = false;

  Timer? _timer;
  int _start = 60;
  bool _canResend = true;

  void startTimer() {
    if (!mounted) return;
    setState(() {
      _canResend = false;
      _start = 60;
    });
    _timer = Timer.periodic(
      const Duration(seconds: 1),
      (Timer timer) {
        if (!mounted) {
          timer.cancel();
          return;
        }
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
    final l10n = AppLocalizations.of(context)!;
    if (_isResending || !_canResend) return;

    setState(() {
      _isResending = true;
    });

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.forgotPassword(widget.email);

    if (!mounted) return;

    setState(() {
      _isResending = false;
    });

    if (success) {
      _showQuickSnackBar(l10n.otpSent, isError: false);
      startTimer();
    } else {
      _showQuickSnackBar(authProvider.errorMessage ?? l10n.connectionError, isError: true);
    }
  }

  Future<void> _resetPassword() async {
    final l10n = AppLocalizations.of(context)!;
    if (!(_formKey.currentState?.validate() ?? false)) return;

    if (passwordController.text != confirmPasswordController.text) {
      _showQuickSnackBar(l10n.passwordsNotMatch, isError: true);
      return;
    }

    final authProvider = context.read<AuthProvider>();
    
    final success = await authProvider.resetPassword(
      email: widget.email,
      otp: otpController.text.trim(),
      newPassword: passwordController.text,
      confirmPassword: confirmPasswordController.text,
    );

    if (!mounted) return;

    if (success) {
      _showQuickSnackBar(l10n.resetPasswordSuccess, isError: false);
      await Future.delayed(const Duration(milliseconds: 1000));
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      _showQuickSnackBar(authProvider.errorMessage ?? l10n.connectionError, isError: true);
    }
  }

  void _showQuickSnackBar(String message, {bool isError = true}) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        duration: const Duration(milliseconds: 1500),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(l10n),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: _buildResetCard(isLoading, l10n),
                ),
              ),
            ),
            _buildFooter(l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.appBarBackground,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.textDark, width: 1), 
              borderRadius: BorderRadius.circular(8)
            ),
            child: Image.asset('assets/images/icon.png', width: 30, height: 30),
          ),
          const SizedBox(width: 12),
          Text(l10n.appName, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textDark)),
        ],
      ),
    );
  }

  Widget _buildResetCard(bool isLoading, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: AppColors.black.withValues(alpha: 0.03), blurRadius: 20, offset: const Offset(0, 10)),
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
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: const Icon(Icons.restart_alt, size: 40, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 24),
            Text(l10n.resetPassword, textAlign: TextAlign.center, style: AppTextStyles.title),
            const SizedBox(height: 12),
            Text('${l10n.otpSentTo}:\n${widget.email}', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textGrey, fontSize: 13)),
            const SizedBox(height: 24),
            _buildOTPField(isLoading, l10n),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: (isLoading || _isResending || !_canResend) ? null : _resendOTP,
                child: Text(
                  _canResend ? l10n.resendOTP : '${l10n.resendAfter} ${_start}s',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 16),
            PasswordTextField(controller: passwordController, label: l10n.enterNewPassword),
            const SizedBox(height: 16),
            PasswordTextField(controller: confirmPasswordController, label: l10n.reEnterPassword),
            const SizedBox(height: 32),
            _buildSubmitButton(isLoading, l10n),
            const SizedBox(height: 24),
            _buildBackToForgot(isLoading, l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildOTPField(bool isLoading, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.otpLabel, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textDark)),
        const SizedBox(height: 8),
        TextFormField(
          controller: otpController,
          style: const TextStyle(color: AppColors.textDark),
          keyboardType: TextInputType.number,
          enabled: !isLoading,
          decoration: InputDecoration(
            hintText: l10n.otpLabel, 
            prefixIcon: const Icon(Icons.security, size: 20, color: AppColors.iconGrey), 
            filled: true, 
            fillColor: AppColors.formFill, 
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.formBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.formBorder)),
          ),
          validator: (value) => (value == null || value.isEmpty) ? l10n.pleaseEnter(l10n.otpLabel) : null,
        ),
      ],
    );
  }

  Widget _buildSubmitButton(bool isLoading, AppLocalizations l10n) {
    return SizedBox(
      height: 54,
      child: ElevatedButton(
        onPressed: isLoading ? null : _resetPassword, 
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary, 
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ), 
        child: isLoading 
          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: AppColors.onPrimary, strokeWidth: 2))
          : Text(l10n.resetPassword, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }

  Widget _buildBackToForgot(bool isLoading, AppLocalizations l10n) {
    return Center(
      child: GestureDetector(
        onTap: isLoading ? null : () => Navigator.pop(context), 
        child: Text(l10n.backToForgot, style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600))
      )
    );
  }

  Widget _buildFooter(AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16), 
      child: Text(l10n.footerCopyright, style: const TextStyle(color: AppColors.textGrey, fontSize: 11))
    );
  }
}
