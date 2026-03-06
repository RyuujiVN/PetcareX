import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
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

  bool _isObscure = true;
  bool _rememberMe = false;
  bool _isAutoFilled = false;

  String? _emailError;
  String? _passwordError;

  //Tk test admin
  void _quickAdminLogin() {
    setState(() {
      _emailController.text = "admin";
      _passwordController.text = "12345";
    });
    _login();
  }
  // ---------------------------------------------------------

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
        if (!mounted) return;
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
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    setState(() {
      _emailError = null;
      _passwordError = null;
    });

    if (email.isEmpty) {
      setState(() => _emailError = "Vui lòng nhập email");
      return;
    }
    if (password.isEmpty) {
      setState(() => _passwordError = "Vui lòng nhập mật khẩu");
      return;
    }

    // bypass tk, phải xóa sau khi release-
    if (email == "admin" && password == "12345") {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
      );
      return;
    }
    // --------------------------

    // GỌI LOGIC QUA PROVIDER
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(email, password, rememberMe: _rememberMe);

    if (success) {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
      );
    } else {
      // Thông báo lỗi đã được AuthProvider quản lý, ta chỉ cần hiển thị SnackBar
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.errorMessage ?? 'Đăng nhập thất bại'),
        ),
      );
    }
  }

  Future<void> _loginWithGoogle() async {
    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.loginWithGoogle();

    if (success) {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainNavigationWrapper()),
      );
    } else {
      if (!mounted) return;
      if (authProvider.errorMessage != null) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(authProvider.errorMessage!)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Quan sát trạng thái Loading từ Provider
    final isLoading = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              _buildHeader(),
              const SizedBox(height: 20),
              _buildLoginCard(isLoading),
              _buildFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
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
          const Text(
            'PetCareX',
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginCard(bool isLoading) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onLongPress:
                _quickAdminLogin, // Long press to auto-fill admin & login
            child: const Center(
              child: Icon(Icons.account_circle_outlined, size: 60),
            ),
          ),
          const SizedBox(height: 12),
          const Center(child: Text('Đăng nhập', style: AppTextStyles.title)),
          const SizedBox(height: 24),

          const Text('Email', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _emailController,
            decoration: InputDecoration(
              hintText: "example@email.com",
              prefixIcon: const Icon(Icons.email_outlined),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              errorText: _emailError,
            ),
          ),

          const SizedBox(height: 16),

          const Text('Mật khẩu', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _passwordController,
            obscureText: _isObscure,
            decoration: InputDecoration(
              hintText: '● ● ● ● ● ● ● ●',
              hintStyle: TextStyle(
                color: AppColors.grey.withValues(alpha: 0.3),
                fontSize: 10,
                letterSpacing: 2,
              ),
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  _isObscure ? Icons.visibility_off : Icons.visibility,
                ),
                onPressed: () => setState(() => _isObscure = !_isObscure),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              errorText: _passwordError,
            ),
          ),

          const SizedBox(height: 8),
          _buildRememberAndForgot(),
          const SizedBox(height: 24),

          _buildLoginButton(isLoading),
          const SizedBox(height: 16),
          _buildGoogleLoginButton(isLoading),
          const SizedBox(height: 16),
          _buildRegisterText(),
        ],
      ),
    );
  }

  Widget _buildGoogleLoginButton(bool isLoading) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton(
        onPressed: isLoading ? null : _loginWithGoogle,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFFE0E0E0)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/images/google.png', width: 24, height: 24),
            const SizedBox(width: 12),
            const Text(
              'Đăng nhập với Google',
              style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRememberAndForgot() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Checkbox(
              value: _rememberMe,
              activeColor: AppColors.primary,
              onChanged: (val) => setState(() => _rememberMe = val ?? false),
            ),
            const Text('Ghi nhớ đăng nhập', style: TextStyle(fontSize: 13)),
          ],
        ),
        TextButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ForgotPasswordPage()),
          ),
          child: const Text(
            'Quên mật khẩu?',
            style: TextStyle(color: AppColors.primary, fontSize: 13),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginButton(bool isLoading) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: isLoading ? null : _login,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : const Text(
                'Đăng nhập',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }

  Widget _buildRegisterText() {
    return Center(
      child: GestureDetector(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const RegisterPage()),
        ),
        child: RichText(
          text: const TextSpan(
            text: "Chưa có tài khoản? ",
            style: TextStyle(color: Colors.grey),
            children: [
              TextSpan(
                text: "Đăng ký ngay",
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Text(
        '© 2026 PetCareX Vietnam.',
        style: TextStyle(color: Colors.grey, fontSize: 10),
      ),
    );
  }
}
