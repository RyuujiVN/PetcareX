import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/error_handler.dart';
import '../../../../core/widgets/password_text_field.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../main_navigation/presentation/main_navigation_wrapper.dart';
import 'providers/auth_provider.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  bool _agreeToTerms = false;
  bool _isLoading = false;

  final ApiClient _apiClient = ApiClient();

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    final l10n = AppLocalizations.of(context)!;
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.agreeToTermsError),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await _apiClient
          .post(AppConstants.END_POINT_AUTH_REGISTER, {
            'fullName': nameController.text,
            'email': emailController.text,
            'password': passwordController.text,
            'role': 'CUSTOMER',
          });

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.registerSuccess),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      } else {
        dynamic errorData;
        try {
          errorData = jsonDecode(response.body);
        } catch (_) {
          errorData = <String, dynamic>{};
        }
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              (errorData is Map ? errorData['message'] : null) ?? l10n.failed,
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ErrorHandler.getLocalizedError('errorConnection', context),
          ),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _registerWithGoogle() async {
    final l10n = AppLocalizations.of(context)!;
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.loginWithGoogle();

    if (success) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.loginGoogleSuccess),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
        (route) => false,
      );
    } else {
      if (!mounted) return;
      if (authProvider.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ErrorHandler.getLocalizedError(
                authProvider.errorMessage,
                context,
              ),
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 5,
                  ),
                  child: _buildRegisterCard(l10n),
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
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      decoration: const BoxDecoration(
        color: AppColors.appBarBackground,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const SizedBox(width: 30),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.textDark, width: 1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Image.asset(
                  'assets/images/icon.png',
                  width: 24,
                  height: 24,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                l10n.appName,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          const Icon(Icons.help_outline, color: AppColors.iconGrey, size: 20),
        ],
      ),
    );
  }

  Widget _buildRegisterCard(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            Text(
              l10n.register,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              l10n: l10n,
              label: l10n.fullName,
              hint: l10n.fullName,
              controller: nameController,
              icon: Icons.person_outline,
            ),
            const SizedBox(height: 10),
            _buildTextField(
              l10n: l10n,
              label: l10n.email,
              hint: l10n.emailHint,
              controller: emailController,
              icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 10),
            PasswordTextField(
              controller: passwordController,
              label: l10n.password,
            ),
            const SizedBox(height: 10),
            PasswordTextField(
              controller: confirmPasswordController,
              label: l10n.confirmPassword,
            ),
            const SizedBox(height: 12),
            _buildTermsCheckbox(l10n),
            const SizedBox(height: 16),
            _buildRegisterButton(l10n),
            const SizedBox(height: 12),
            _buildGoogleButton(l10n),
            const SizedBox(height: 12),
            _buildLoginText(l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required AppLocalizations l10n,
    required String label,
    required String hint,
    required TextEditingController controller,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          controller: controller,
          style: const TextStyle(color: AppColors.textDark),
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 18, color: AppColors.iconGrey),
            filled: true,
            fillColor: AppColors.formFill,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.formBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.formBorder),
            ),
          ),
          validator: (value) =>
              (value == null || value.isEmpty) ? l10n.pleaseEnter(label) : null,
        ),
      ],
    );
  }

  Widget _buildTermsCheckbox(AppLocalizations l10n) {
    return Row(
      children: [
        Checkbox(
          value: _agreeToTerms,
          activeColor: AppColors.primary,
          onChanged: (val) => setState(() => _agreeToTerms = val ?? false),
        ),
        Expanded(
          child: Text(
            l10n.agreeTerms,
            style: const TextStyle(fontSize: 11, color: AppColors.textGrey),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterButton(AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _register,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: AppColors.onPrimary,
                  strokeWidth: 2,
                ),
              )
            : Text(
                l10n.createAccount,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
      ),
    );
  }

  Widget _buildGoogleButton(AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton(
        onPressed: _isLoading ? null : _registerWithGoogle,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.formBorder),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/images/google.png', width: 24, height: 24),
            const SizedBox(width: 12),
            Text(
              l10n.loginWithGoogle,
              style: const TextStyle(
                color: AppColors.textDark,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginText(AppLocalizations l10n) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          l10n.alreadyHaveAccount,
          style: const TextStyle(color: AppColors.textGrey),
        ),
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Text(
            l10n.loginNow,
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooter(AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(
        l10n.footerCopyright,
        style: const TextStyle(color: AppColors.textGrey, fontSize: 9),
      ),
    );
  }
}
