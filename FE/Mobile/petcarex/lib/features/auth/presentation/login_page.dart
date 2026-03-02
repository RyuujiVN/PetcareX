import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import 'register_page.dart';
import 'forgot_password_page.dart';
import 'home_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final _storage = const FlutterSecureStorage();

  bool _isObscure = true;
  bool _isLoading = false;
  bool _rememberMe = false;
  bool _isAutoFilled = false;

  String? _emailError;
  String? _passwordError;
  String? _loginError;

  final String baseUrl = 'http://localhost:3000';

  @override
  void initState() {
    super.initState();
    _loadSavedCredentials();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _loadSavedCredentials() async {
    String? rememberMeStr = await _storage.read(key: 'remember_me');
    if (rememberMeStr == 'true') {
      String? savedEmail = await _storage.read(key: 'saved_email');
      String? savedPassword = await _storage.read(key: 'saved_password');
      setState(() {
        _rememberMe = true;
        _isAutoFilled = true;
        _emailController.text = savedEmail ?? '';
        _passwordController.text = savedPassword ?? '';
      });
    }
  }

  Future<void> _handleRememberMe() async {
    if (_rememberMe) {
      await _storage.write(key: 'remember_me', value: 'true');
      await _storage.write(key: 'saved_email', value: _emailController.text);
      await _storage.write(key: 'saved_password', value: _passwordController.text);
    } else {
      await _storage.delete(key: 'remember_me');
      await _storage.delete(key: 'saved_email');
      await _storage.delete(key: 'saved_password');
    }
  }

  Future<void> _login() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    setState(() {
      _emailError = null;
      _passwordError = null;
      _loginError = null;
    });

    if (email.isEmpty) {
      setState(() => _emailError = "Vui lòng nhập email");
      return;
    }
    if (password.isEmpty) {
      setState(() => _passwordError = "Vui lòng nhập mật khẩu");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"email": email, "password": password}),
      ).timeout(const Duration(seconds: 10));

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (body["accessToken"] != null) {
          await _storage.write(key: "accessToken", value: body["accessToken"]);
          await _handleRememberMe();
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else {
          setState(() => _loginError = "Không lấy được token từ server");
        }
      } else {
        setState(() => _loginError = body["message"] ?? "Email hoặc mật khẩu không đúng");
      }
    } catch (e) {
      setState(() {
        if (e is SocketException) {
          _loginError = "Lỗi kết nối: Kiểm tra Wi-Fi (phải cùng mạng 192.168.30.x)";
        } else {
          _loginError = "Lỗi: $e";
        }
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              _buildHeader(),
              const SizedBox(height: 20),
              _buildLoginCard(),
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
          const Text('PetCareX', style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildLoginCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Center(child: Icon(Icons.account_circle_outlined, size: 60)),
          const SizedBox(height: 12),
          const Center(child: Text('Đăng nhập', style: AppTextStyles.title)),
          const SizedBox(height: 24),
          
          const Text('Email', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _emailController,
            onChanged: (_) => setState(() => _isAutoFilled = false),
            decoration: InputDecoration(
              hintText: "example@email.com",
              prefixIcon: const Icon(Icons.email_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              errorText: _emailError,
            ),
          ),
          
          const SizedBox(height: 16),

          const Text('Mật khẩu', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _passwordController,
            obscureText: _isObscure,
            onChanged: (_) => setState(() => _isAutoFilled = false),
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: _isAutoFilled ? null : IconButton(
                icon: Icon(_isObscure ? Icons.visibility_off : Icons.visibility),
                onPressed: () => setState(() => _isObscure = !_isObscure),
              ),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              errorText: _passwordError,
            ),
          ),

          if (_loginError != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(_loginError!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ),

          const SizedBox(height: 8),
          _buildRememberAndForgot(),
          const SizedBox(height: 24),
          
          _buildLoginButton(),
          const SizedBox(height: 16),
          _buildRegisterText(),
        ],
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
            const Text('Ghi nhớ', style: TextStyle(fontSize: 13)),
          ],
        ),
        TextButton(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForgotPasswordPage())),
          child: const Text('Quên mật khẩu?', style: TextStyle(color: AppColors.primary, fontSize: 13)),
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _login,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _isLoading 
          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Text('Đăng nhập', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildRegisterText() {
    return Center(
      child: GestureDetector(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterPage())),
        child: RichText(
          text: const TextSpan(
            text: "Chưa có tài khoản? ",
            style: TextStyle(color: Colors.grey),
            children: [TextSpan(text: "Đăng ký ngay", style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))],
          ),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Text('© 2026 PetCareX Vietnam.', style: TextStyle(color: Colors.grey, fontSize: 10)),
    );
  }
}
