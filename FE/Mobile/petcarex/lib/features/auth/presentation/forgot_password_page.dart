import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_notifier.dart';
import '../../../../core/utils/error_handler.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'providers/auth_provider.dart';
import 'reset_password_page.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController emailController = TextEditingController();

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  Future<void> _sendResetLink() async {
    final l10n = AppLocalizations.of(context)!;
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final authProvider = context.read<AuthProvider>();
    final email = emailController.text.trim();
    
    final success = await authProvider.forgotPassword(email);

    if (!mounted) return;

    if (success) {
      _showQuickSnackBar(l10n.otpSent, isError: false);
      
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ResetPasswordPage(email: email),
        ),
      );
    } else {
      _showQuickSnackBar(ErrorHandler.getLocalizedError(authProvider.errorMessage, context), isError: true);
    }
  }

  void _showQuickSnackBar(String message, {bool isError = true}) {
    if (isError) {
      AppNotifier.showError(
        context,
        message,
        duration: const Duration(milliseconds: 1500),
      );
      return;
    }
    AppNotifier.showSuccess(
      context,
      message,
      duration: const Duration(milliseconds: 1500),
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
                  child: _buildForgotCard(isLoading, l10n),
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
              borderRadius: BorderRadius.circular(8),
            ),
            child: Image.asset('assets/images/icon.png', width: 30, height: 30),
          ),
          const SizedBox(width: 12),
          Text(
            l10n.appName,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textDark),
          ),
        ],
      ),
    );
  }

  Widget _buildForgotCard(bool isLoading, AppLocalizations l10n) {
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
            Text(l10n.forgotPassword, textAlign: TextAlign.center, style: AppTextStyles.title),
            const SizedBox(height: 12),
            Text(
              l10n.forgotPasswordSubtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textGrey, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 32),
            _buildEmailField(isLoading, l10n),
            const SizedBox(height: 24),
            _buildSubmitButton(isLoading, l10n),
            const SizedBox(height: 24),
            _buildBackToLogin(isLoading, l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildEmailField(bool isLoading, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.email, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textDark)),
        const SizedBox(height: 8),
        TextFormField(
          controller: emailController,
          style: const TextStyle(color: AppColors.textDark),
          keyboardType: TextInputType.emailAddress,
          enabled: !isLoading,
          decoration: InputDecoration(
            hintText: l10n.emailHint,
            prefixIcon: const Icon(Icons.email_outlined, size: 20, color: AppColors.iconGrey),
            filled: true,
            fillColor: AppColors.formFill,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.formBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.formBorder)),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return l10n.enterEmail;
            final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
            if (!emailRegex.hasMatch(value)) return l10n.invalidEmail;
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildSubmitButton(bool isLoading, AppLocalizations l10n) {
    return SizedBox(
      height: 54,
      child: ElevatedButton(
        onPressed: isLoading ? null : _sendResetLink,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary, 
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: isLoading 
          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: AppColors.onPrimary, strokeWidth: 2)) 
          : Text(l10n.sendOTP, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }

  Widget _buildBackToLogin(bool isLoading, AppLocalizations l10n) {
    return GestureDetector(
      onTap: isLoading ? null : () => Navigator.pop(context),
      child: Center(child: Text(l10n.loginNow, style: const TextStyle(color: AppColors.textGrey, fontSize: 14, fontWeight: FontWeight.w600))),
    );
  }

  Widget _buildFooter(AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.all(24.0), 
      child: Text(l10n.footerCopyright, style: const TextStyle(color: AppColors.textGrey, fontSize: 10))
    );
  }
}
