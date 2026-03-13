import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart'; // Import mới
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
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

  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

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
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.changePassword,
          style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold, fontSize: 18),
        ),
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
                child: const Icon(Icons.lock_reset, size: 40, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 24),
            Text(l10n.updatePassword, textAlign: TextAlign.center, style: AppTextStyles.title),
            const SizedBox(height: 12),
            Text(l10n.changePasswordMessage, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.grey, fontSize: 14, height: 1.5)),
            const SizedBox(height: 32),
            _buildPasswordField(label: l10n.oldPassword, controller: oldPasswordController, obscureText: _obscureOld, onToggle: () => setState(() => _obscureOld = !_obscureOld), l10n: l10n),
            const SizedBox(height: 16),
            _buildPasswordField(label: l10n.newPassword, controller: newPasswordController, obscureText: _obscureNew, onToggle: () => setState(() => _obscureNew = !_obscureNew), l10n: l10n),
            const SizedBox(height: 16),
            _buildPasswordField(label: l10n.confirmNewPassword, controller: confirmPasswordController, obscureText: _obscureConfirm, onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm), l10n: l10n),
            const SizedBox(height: 32),
            _buildSubmitButton(isLoading, l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordField({required String label, required TextEditingController controller, required bool obscureText, required VoidCallback onToggle, required AppLocalizations l10n}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          decoration: InputDecoration(
            hintText: '● ● ● ● ● ● ● ●',
            prefixIcon: const Icon(Icons.lock_outline, size: 20, color: AppColors.grey),
            suffixIcon: IconButton(icon: Icon(obscureText ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20, color: AppColors.grey), onPressed: onToggle),
            filled: true,
            fillColor: const Color(0xFFF8F9FA),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return label;
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
        onPressed: isLoading ? null : _changePassword,
        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
        child: isLoading ? const CircularProgressIndicator(color: Colors.white) : Text(l10n.updatePassword),
      ),
    );
  }
}
