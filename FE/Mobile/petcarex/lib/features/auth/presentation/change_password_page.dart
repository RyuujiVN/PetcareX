import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/password_text_field.dart';
import 'providers/auth_provider.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController oldPasswordController = TextEditingController();
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    oldPasswordController.dispose();
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    final l10n = AppLocalizations.of(context)!;
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.changePassword(
      oldPassword: oldPasswordController.text,
      newPassword: newPasswordController.text,
      confirmPassword: confirmPasswordController.text,
    );

    if (!mounted) return;

    if (success) {
      _showQuickSnackBar(l10n.save, isError: false);
      Navigator.pop(context);
    } else {
      _showQuickSnackBar(authProvider.errorMessage ?? l10n.failed, isError: true);
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
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(l10n.changePassword, style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: _buildChangeCard(isLoading, l10n),
          ),
        ),
      ),
    );
  }

  Widget _buildChangeCard(bool isLoading, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20)],
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
                child: const Icon(Icons.lock_reset, size: 40, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 24),
            Text(l10n.updatePassword, textAlign: TextAlign.center, style: AppTextStyles.title),
            const SizedBox(height: 12),
            Text(l10n.changePasswordMessage, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.grey, fontSize: 14, height: 1.5)),
            const SizedBox(height: 32),
            PasswordTextField(controller: oldPasswordController, label: l10n.oldPassword),
            const SizedBox(height: 16),
            PasswordTextField(controller: newPasswordController, label: l10n.newPassword),
            const SizedBox(height: 16),
            PasswordTextField(controller: confirmPasswordController, label: l10n.confirmNewPassword),
            const SizedBox(height: 32),
            _buildSubmitButton(isLoading, l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton(bool isLoading, AppLocalizations l10n) {
    return SizedBox(
      height: 54,
      child: ElevatedButton(
        onPressed: isLoading ? null : _changePassword,
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
        child: isLoading 
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
            : Text(l10n.updatePassword, style: AppTextStyles.button),
      ),
    );
  }
}
