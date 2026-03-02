import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool _rememberMe = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void _login() {
    if (_formKey.currentState!.validate()) {
      debugPrint("Email: ${emailController.text}");
      debugPrint("Password: ${passwordController.text}");
    }
  }

  Future<void> _loginWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) return;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      await FirebaseAuth.instance.signInWithCredential(credential);
      debugPrint("Đăng nhập Google thành công");
    } catch (e) {
      debugPrint("Google sign in error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: _buildLoginCard(),
                ),
              ),
            ),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  // ================= HEADER =================
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEEF2F3))),
      ),
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.black,
                  width: 1,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Image.asset(
                'assets/images/icon.png',
                width: 30,
                height: 30,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'PetCareX',
              style: TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ================= CARD =================
  Widget _buildLoginCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.grey.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(
              child: Icon(
                Icons.account_circle_outlined,
                size: 60, // Giảm kích thước icon
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 12),
            const Center(
              child: Text(
                'Đăng nhập',
                style: AppTextStyles.title,
              ),
            ),
            const SizedBox(height: 4),
            const Center(
              child: Text(
                'Chào mừng bạn đến với cộng đồng PetCareX',
                textAlign: TextAlign.center,
                style: AppTextStyles.body,
              ),
            ),
            const SizedBox(height: 20), // Giảm khoảng cách
            _buildEmailField(),
            const SizedBox(height: 12), // Giảm khoảng cách
            _buildPasswordField(),
            const SizedBox(height: 8),
            _buildRememberMe(),
            const SizedBox(height: 16),
            _buildLoginButton(),
            const SizedBox(height: 20),
            _buildDivider(),
            const SizedBox(height: 16),
            _buildGoogleButton(),
            const SizedBox(height: 16),
            _buildRegisterText(),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        const Expanded(child: Divider(color: Color(0xFFEEEEEE))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            "Hoặc tiếp đăng nhập với",
            style: TextStyle(color: AppColors.grey.withValues(alpha: 0.8), fontSize: 13),
          ),
        ),
        const Expanded(child: Divider(color: Color(0xFFEEEEEE))),
      ],
    );
  }

  // ================= EMAIL =================
  Widget _buildEmailField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Email',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            hintText: 'example@petcare.vn',
            hintStyle: TextStyle(color: AppColors.grey.withValues(alpha: 0.5)),
            prefixIcon: const Icon(Icons.email_outlined, size: 20, color: AppColors.grey),
            contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Vui lòng nhập email';
            if (!value.contains('@')) return 'Email không hợp lệ';
            return null;
          },
        ),
      ],
    );
  }

  // ================= PASSWORD =================
  Widget _buildPasswordField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Mật khẩu',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            GestureDetector(
              onTap: () {},
              child: const Text(
                'Quên mật khẩu?',
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: passwordController,
          obscureText: _obscurePassword,
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.lock_outline, size: 20, color: AppColors.grey),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                size: 20,
                color: AppColors.grey,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Vui lòng nhập mật khẩu';
            return null;
          },
        ),
      ],
    );
  }

  // ================= REMEMBER =================
  Widget _buildRememberMe() {
    return Row(
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: _rememberMe,
            activeColor: AppColors.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            onChanged: (val) => setState(() => _rememberMe = val ?? false),
          ),
        ),
        const SizedBox(width: 8),
        const Text('Ghi nhớ đăng nhập', style: TextStyle(fontSize: 14, color: AppColors.textDark)),
      ],
    );
  }

  // ================= BUTTONS =================
  Widget _buildLoginButton() {
    return SizedBox(
      height: 48, // Giảm chiều cao nút
      child: ElevatedButton(
        onPressed: _login,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: const Text(
          'Đăng nhập',
          style: AppTextStyles.button,
        ),
      ),
    );
  }

  Widget _buildGoogleButton() {
    return SizedBox(
      height: 48, // Giảm chiều cao nút
      child: OutlinedButton(
        onPressed: _loginWithGoogle,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFFE0E0E0)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/google.png',
              height: 18,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 12),
            const Text(
              'Google',
              style: TextStyle(
                color: AppColors.textDark,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRegisterText() {
    return Center(
      child: RichText(
        text: TextSpan(
          text: 'Bạn chưa có tài khoản? ',
          style: const TextStyle(color: AppColors.grey, fontSize: 13),
          children: [
            WidgetSpan(
              child: GestureDetector(
                onTap: () {},
                child: const Text(
                  'Đăng ký ngay',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ================= FOOTER =================
  Widget _buildFooter() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 12),
      child: Text(
        '© 2026 PetCareX Vietnam. Tất cả quyền được bảo lưu.',
        style: TextStyle(color: AppColors.grey, fontSize: 10),
      ),
    );
  }
}
