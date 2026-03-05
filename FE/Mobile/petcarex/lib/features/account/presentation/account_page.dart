import 'package:flutter/material.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  int _selectedIndex = 3;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tài khoản',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1C1E),
            ),
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.person_outline,
            iconColor: const Color(0xFF13ECDA),
            title: 'Thông tin cá nhân',
            subtitle: 'Xem và chỉnh sửa thông tin cá nhân',
            borderColor: const Color(0xFF13ECDA).withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.pets_outlined,
            iconColor: Colors.grey,
            title: 'Thông tin thú cưng',
            subtitle: 'Xem và chỉnh sửa thông tin thú cưng',
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.lock_outline,
            iconColor: Colors.grey,
            title: 'Đổi mật khẩu',
            subtitle: 'Cập nhật mật khẩu của bạn',
          ),
          const SizedBox(height: 32),
          const Text(
            'Khác',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1C1E),
            ),
          ),
          const SizedBox(height: 16),
          _buildAccountItem(
            icon: Icons.logout_outlined,
            iconColor: Colors.redAccent,
            title: 'Đăng xuất',
            subtitle: 'Thoát khỏi tài khoản',
            titleColor: Colors.redAccent,
            bgColor: Colors.red.withOpacity(0.05),
          ),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  Widget _buildAccountItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    Color? borderColor,
    Color? titleColor,
    Color? bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor ?? Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: borderColor ?? Colors.grey.withOpacity(0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
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
                    fontWeight: FontWeight.bold,
                    color: titleColor ?? const Color(0xFF1A1C1E),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: Colors.grey[400]),
        ],
      ),
    );
  }
}
