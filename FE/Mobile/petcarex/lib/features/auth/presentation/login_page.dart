import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/password_text_field.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../main_navigation/presentation/main_navigation_wrapper.dart';
import 'forgot_password_page.dart';
import 'providers/auth_provider.dart';
import 'register_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _rememberMe = false;

  String? _emailError;
  String? _passwordError;

  void _quickAdminLogin() {
    setState(() {
      _emailController.text = "admin";
      _passwordController.text = "12345";
    });
    _login();
  }

  @override
  void initState() {
    super.initState();
    _loadSavedInfo();
  }

  Future<void> _loadSavedInfo() async {
    final authProvider = context.read<AuthProvider>();
    final savedEmail = await authProvider.getSavedEmail();
    final rememberMe = await authProvider.getRememberMe();

    if (!mounted) return;
    if (savedEmail != null) {
      setState(() {
        _emailController.text = savedEmail;
        _rememberMe = rememberMe;
      });
    }

    if (rememberMe) {
      await authProvider.checkAuthStatus();
      if (!mounted) return;
      if (authProvider.isAuthenticated) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
        );
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final l10n = AppLocalizations.of(context)!;
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    setState(() {
      _emailError = null;
      _passwordError = null;
    });

    if (email.isEmpty) {
      setState(() => _emailError = l10n.enterEmail);
      return;
    }
    if (password.isEmpty) {
      setState(() => _passwordError = l10n.enterPassword);
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(email, password, rememberMe: _rememberMe);

    if (success) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.loginSuccess),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? l10n.loginFailed),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _loginWithGoogle() async {
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
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? l10n.loginFailed),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              _buildHeader(l10n),
              const SizedBox(height: 20),
              _buildLoginCard(isLoading, l10n),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(AppLocalizations l10n) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
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
          Text(l10n.appName, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: AppColors.textDark)),
        ],
      ),
    );
  }

  Widget _buildLoginCard(bool isLoading, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: AppColors.black.withValues(alpha: 0.03), blurRadius: 20),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onLongPress: _quickAdminLogin,
            child: const Center(child: Icon(Icons.account_circle_outlined, size: 60, color: AppColors.primary)),
          ),
          const SizedBox(height: 12),
          Center(child: Text(l10n.login, style: AppTextStyles.title)),
          const SizedBox(height: 24),
          Text(l10n.email, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark)),
          const SizedBox(height: 8),
          TextField(
            controller: _emailController,
            style: const TextStyle(color: AppColors.textDark),
            decoration: InputDecoration(
              hintText: l10n.emailHint,
              prefixIcon: const Icon(Icons.email_outlined, color: AppColors.iconGrey),
              filled: true,
              fillColor: AppColors.formFill,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.formBorder)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.formBorder)),
              errorText: _emailError,
            ),
          ),
          const SizedBox(height: 16),
          PasswordTextField(
            controller: _passwordController,
            label: l10n.password,
            errorText: _passwordError,
          ),
          const SizedBox(height: 8),
          _buildRememberAndForgot(l10n),
          const SizedBox(height: 24),
          _buildLoginButton(isLoading, l10n),
          const SizedBox(height: 16),
          _buildGoogleLoginButton(isLoading, l10n),
          const SizedBox(height: 16),
          _buildRegisterText(l10n),
        ],
      ),
    );
  }

  Widget _buildGoogleLoginButton(bool isLoading, AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton(
        onPressed: isLoading ? null : _loginWithGoogle,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.formBorder),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/images/google.png', width: 24, height: 24),
            const SizedBox(width: 12),
            Text(l10n.loginWithGoogle, style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildRememberAndForgot(AppLocalizations l10n) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(children: [
          Checkbox(value: _rememberMe, activeColor: AppColors.primary, onChanged: (val) => setState(() => _rememberMe = val ?? false)),
          Text(l10n.rememberMe, style: const TextStyle(fontSize: 13, color: AppColors.textDark)),
        ]),
        TextButton(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForgotPasswordPage())),
          child: Text(l10n.forgotPassword, style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _buildLoginButton(bool isLoading, AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: isLoading ? null : _login,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: isLoading 
          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: AppColors.onPrimary, strokeWidth: 2)) 
          : Text(l10n.login, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }

  Widget _buildRegisterText(AppLocalizations l10n) {
    return Center(
      child: GestureDetector(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterPage())),
        child: RichText(
          text: TextSpan(
            text: l10n.dontHaveAccount,
            style: const TextStyle(color: AppColors.textGrey),
            children: [TextSpan(text: l10n.registerNow, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))],
          ),
        ),
      ),
    );
  }
}
