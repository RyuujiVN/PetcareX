import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/providers/language_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_notifier.dart';
import '../../../../core/utils/error_handler.dart';
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
  
  final FocusNode _emailFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();

  bool _rememberMe = false;
  String? _emailError;
  String? _passwordError;

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
    _emailFocus.dispose();
    _passwordFocus.dispose();
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
      _emailFocus.requestFocus();
      return;
    }
    if (password.isEmpty) {
      setState(() => _passwordError = l10n.enterPassword);
      _passwordFocus.requestFocus();
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(email, password, rememberMe: _rememberMe);

    if (success) {
      if (!mounted) return;
      AppNotifier.showSuccess(context, l10n.loginSuccess);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
      );
    } else {
      if (!mounted) return;
      setState(() {
        _passwordError = ErrorHandler.getLocalizedError(
          authProvider.errorMessage,
          context,
        );
      });
      _passwordFocus.requestFocus();
    }
  }

  Future<void> _loginWithGoogle() async {
    final l10n = AppLocalizations.of(context)!;
    final authProvider = context.read<AuthProvider>();
    
    final success = await authProvider.loginWithGoogle();

    if (success) {
      if (!mounted) return;
      AppNotifier.showSuccess(context, l10n.loginSuccess);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
      );
    } else {
      if (!mounted) return;
      if (authProvider.errorMessage != null) {
        setState(() {
          _passwordError = ErrorHandler.getLocalizedError(
            authProvider.errorMessage,
            context,
          );
        });
        _passwordFocus.requestFocus();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerRight,
                  child: _buildLanguageSelector(),
                ),
                const SizedBox(height: 12),
                _buildHeader(l10n),
                const SizedBox(height: 32),
                _buildLoginCard(isLoading, l10n),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageSelector() {
    final currentLocale = context.watch<LanguageProvider>().locale.languageCode;
    return PopupMenuButton<String>(
      tooltip: '', // Tắt tooltip mặc định (Hiển thị menu)
      onSelected: (String languageCode) {
        context.read<LanguageProvider>().setLocale(Locale(languageCode));
      },
      offset: const Offset(0, 40),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: AppColors.black.withValues(alpha: 0.05), blurRadius: 10),
          ],
        ),
        child: const Icon(Icons.language, color: AppColors.primary, size: 24),
      ),
      itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
        PopupMenuItem<String>(
          value: 'vi',
          child: Row(
            children: [
              Image.asset('assets/images/vn.png', width: 20, height: 20),
              const SizedBox(width: 12),
              Text(
                'Tiếng Việt', 
                style: TextStyle(
                  fontWeight: currentLocale == 'vi' ? FontWeight.bold : FontWeight.normal,
                  color: currentLocale == 'vi' ? AppColors.primary : AppColors.textDark,
                ),
              ),
              if (currentLocale == 'vi') ...[
                const Spacer(),
                const Icon(Icons.check, color: AppColors.primary, size: 18),
              ]
            ],
          ),
        ),
        PopupMenuItem<String>(
          value: 'en',
          child: Row(
            children: [
              Image.asset('assets/images/eng.png', width: 20, height: 20),
              const SizedBox(width: 12),
              Text(
                'English', 
                style: TextStyle(
                  fontWeight: currentLocale == 'en' ? FontWeight.bold : FontWeight.normal,
                  color: currentLocale == 'en' ? AppColors.primary : AppColors.textDark,
                ),
              ),
              if (currentLocale == 'en') ...[
                const Spacer(),
                const Icon(Icons.check, color: AppColors.primary, size: 18),
              ]
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(AppLocalizations l10n) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: AppColors.black.withValues(alpha: 0.05), blurRadius: 10)],
          ),
          child: Image.asset('assets/images/icon.png', width: 50, height: 50),
        ),
        const SizedBox(height: 16),
        Text(l10n.appName, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.textDark)),
      ],
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
          Center(child: Text(l10n.login, style: AppTextStyles.title)),
          const SizedBox(height: 32),
          Text(l10n.email, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark)),
          const SizedBox(height: 8),
          TextField(
            controller: _emailController,
            focusNode: _emailFocus,
            autofocus: true,
            textInputAction: TextInputAction.next,
            onChanged: (_) {
              if (_emailError != null) {
                setState(() => _emailError = null);
              }
            },
            onSubmitted: (_) => _passwordFocus.requestFocus(),
            style: const TextStyle(color: AppColors.textDark),
            decoration: InputDecoration(
              hintText: l10n.emailHint,
              prefixIcon: const Icon(Icons.email_outlined, color: AppColors.iconGrey),
              filled: true,
              fillColor: _emailError != null
                  ? AppColors.fieldErrorBackground
                  : AppColors.formFill,
              errorText: _emailError,
              errorStyle: const TextStyle(
                color: AppColors.fieldErrorText,
                fontSize: 12,
                height: 1.4,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: _emailError != null
                      ? AppColors.fieldErrorBorder
                      : AppColors.formBorder,
                  width: _emailError != null ? 1.5 : 1,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: _emailError != null
                      ? AppColors.fieldErrorBorder
                      : AppColors.formBorder,
                  width: _emailError != null ? 1.5 : 1,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: _emailError != null
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
          const SizedBox(height: 16),
          PasswordTextField(
            controller: _passwordController,
            focusNode: _passwordFocus,
            label: l10n.password,
            errorText: _passwordError,
            textInputAction: TextInputAction.done,
            onChanged: (_) {
              if (_passwordError != null) {
                setState(() => _passwordError = null);
              }
            },
            onSubmitted: (_) => _login(),
          ),
          const SizedBox(height: 8),
          _buildRememberAndForgot(l10n),
          const SizedBox(height: 32),
          _buildLoginButton(isLoading, l10n),
          const SizedBox(height: 16),
          _buildGoogleLoginButton(isLoading, l10n),
          const SizedBox(height: 24),
          _buildRegisterText(l10n),
        ],
      ),
    );
  }

  Widget _buildRememberAndForgot(AppLocalizations l10n) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(children: [
          SizedBox(
            width: 24,
            height: 24,
            child: Checkbox(
              value: _rememberMe, 
              activeColor: AppColors.primary, 
              onChanged: (val) => setState(() => _rememberMe = val ?? false)
            ),
          ),
          const SizedBox(width: 8),
          Text(l10n.rememberMe, style: const TextStyle(fontSize: 13, color: AppColors.textDark)),
        ]),
        TextButton(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForgotPasswordPage())),
          child: Text(l10n.forgotPassword, style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildLoginButton(bool isLoading, AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: isLoading ? null : _login,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary, 
          foregroundColor: AppColors.onPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        child: isLoading 
          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: AppColors.onPrimary, strokeWidth: 2)) 
          : Text(l10n.login, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
    );
  }

  Widget _buildGoogleLoginButton(bool isLoading, AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 54,
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

  Widget _buildRegisterText(AppLocalizations l10n) {
    return Center(
      child: GestureDetector(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterPage())),
        child: RichText(
          text: TextSpan(
            text: l10n.dontHaveAccount,
            style: const TextStyle(color: AppColors.textGrey),
            children: [
              TextSpan(
                text: l10n.registerNow, 
                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)
              )
            ],
          ),
        ),
      ),
    );
  }
}
