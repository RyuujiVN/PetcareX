import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart'; // Import mới
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
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
      _showQuickSnackBar('OTP Sent Successfully', isError: false);
      
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ResetPasswordPage(email: email),
        ),
      );
    } else {
      _showQuickSnackBar(authProvider.errorMessage ?? 'Error', isError: true);
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
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEEF2F3))),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.black, width: 1),
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
        ],
      ),
    );
  }

  Widget _buildForgotCard(bool isLoading, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 10)),
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
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                child: const Icon(Icons.restart_alt, size: 40, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 24),
            Text(l10n.forgotPassword, textAlign: TextAlign.center, style: AppTextStyles.title),
            const SizedBox(height: 12),
            const Text(
              'Enter your email and we will send you an OTP code to reset your password.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.grey, fontSize: 14, height: 1.5),
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
        Text(l10n.email, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        TextFormField(
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          enabled: !isLoading,
          decoration: InputDecoration(
            hintText: l10n.emailHint,
            prefixIcon: const Icon(Icons.email_outlined, size: 20, color: AppColors.grey),
            filled: true,
            fillColor: const Color(0xFFF8F9FA),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return l10n.enterEmail;
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
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: AppColors.white),
        child: isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Send OTP'),
      ),
    );
  }

  Widget _buildBackToLogin(bool isLoading, AppLocalizations l10n) {
    return GestureDetector(
      onTap: isLoading ? null : () => Navigator.pop(context),
      child: Center(child: Text(l10n.loginNow, style: const TextStyle(color: AppColors.grey, fontSize: 14))),
    );
  }

  Widget _buildFooter() {
    return const Padding(padding: EdgeInsets.all(24.0), child: Text('© 2026 PETCAREX INC.', style: TextStyle(color: AppColors.grey, fontSize: 10)));
  }
}
