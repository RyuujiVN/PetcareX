import 'package:flutter/material.dart';
import 'package:petcarex/features/auth/presentation/login_page.dart';
import 'package:petcarex/features/auth/presentation/providers/auth_provider.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/change_password_page.dart';
import 'profile_page.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Xác nhận đăng xuất'),
          content: const Text('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                final authProvider = context.read<AuthProvider>();
                await authProvider.logout();
                if (mounted) {
                  // Sau khi logout, AuthWrapper trong main.dart sẽ tự chuyển về LoginPage
                  // Tuy nhiên, nếu bạn muốn cưỡng chế thì dùng Navigator:
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginPage()),
                    (route) => false,
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEA5455),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Đăng xuất'),
            ),
          ],
        );
      },
    );
  }

  void _showAboutUsDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Image.asset('assets/images/icon.png', width: 24, height: 24),
              const SizedBox(width: 10),
              const Text('Về PetCareX'),
            ],
          ),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Dự án Capstone 2 - Hệ thống chăm sóc thú cưng toàn diện.',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 12),
              Text('Phiên bản: 1.0.0'),
              Text('Phát triển bởi: PetCareX Team'),
              SizedBox(height: 12),
              Text(
                'Ứng dụng này giúp bạn quản lý sức khỏe, lịch hẹn và kết nối với các bác sĩ thú y uy tín một cách nhanh chóng nhất.',
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Đóng', style: TextStyle(color: Color(0xFF00CFE8))),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'Tài khoản',
          style: TextStyle(
            color: Color(0xFF1E1E1E),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: Colors.grey.withOpacity(0.1),
            height: 1,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Tài khoản',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1E1E1E),
              ),
            ),
            const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.person_outline_rounded,
            iconColor: const Color(0xFF00CFE8),
            title: 'Thông tin cá nhân',
            subtitle: 'Xem và chỉnh sửa thông tin cá nhân',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfilePage()),
              );
            },
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.pets_outlined,
            iconColor: const Color(0xFFFAAF00),
            title: 'Thông tin thú cưng',
            subtitle: 'Xem và chỉnh sửa thông tin thú cưng',
            onTap: () {
              // TODO: Navigate to pet info
            },
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.lock_outline_rounded,
            iconColor: const Color(0xFF7367F0),
            title: 'Đổi mật khẩu',
            subtitle: 'Cập nhật mật khẩu của bạn',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ChangePasswordPage()),
              );
            },
          ),
          const SizedBox(height: 32),
          const Text(
            'Khác',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E1E1E),
            ),
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.info_outline_rounded,
            iconColor: const Color(0xFF7367F0),
            title: 'Về chúng tôi',
            subtitle: 'Thông tin về dự án PetCareX',
            onTap: _showAboutUsDialog,
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.logout_rounded,
            iconColor: const Color(0xFFEA5455),
            title: 'Đăng xuất',
            subtitle: 'Thoát khỏi tài khoản',
            titleColor: const Color(0xFFEA5455),
            isDestructive: true,
            onTap: _showLogoutDialog,
          ),
          const SizedBox(height: 100),
        ],
      ),
    ),
  );
}

  Widget _buildAccountItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? titleColor,
    bool isDestructive = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDestructive ? const Color(0xFFFFEAEA) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDestructive
                ? const Color(0xFFFFC1C1).withOpacity(0.5)
                : Colors.grey.withOpacity(0.12),
            width: 1,
          ),
          boxShadow: [
            if (!isDestructive)
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: titleColor ?? const Color(0xFF1E1E1E),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              color: Colors.grey[400],
              size: 16,
            ),
          ],
        ),
      ),
    );
  }
}
