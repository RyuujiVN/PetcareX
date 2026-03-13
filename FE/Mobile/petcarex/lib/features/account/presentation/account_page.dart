import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'package:petcarex/features/auth/presentation/login_page.dart';
import 'package:petcarex/features/auth/presentation/providers/auth_provider.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/language_provider.dart'; // Import mới
import '../../auth/presentation/change_password_page.dart';
import 'my_pets_page.dart';
import 'profile_page.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  void _showLogoutDialog(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(l10n.confirmLogout),
          content: Text(l10n.logoutMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(l10n.cancel, style: const TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                final authProvider = context.read<AuthProvider>();
                await authProvider.logout();
                if (mounted) {
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
              child: Text(l10n.logout),
            ),
          ],
        );
      },
    );
  }

  void _showLanguageDialog(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Chọn ngôn ngữ / Select Language'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Text('🇻🇳', style: TextStyle(fontSize: 24)),
              title: const Text('Tiếng Việt'),
              onTap: () async {
                await context.read<LanguageProvider>().setLocale(const Locale('vi'));
                if (mounted) Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Text('🇺🇸', style: TextStyle(fontSize: 24)),
              title: const Text('English'),
              onTap: () async {
                await context.read<LanguageProvider>().setLocale(const Locale('en'));
                if (mounted) Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAboutUsDialog(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Image.asset('assets/images/icon.png', width: 24, height: 24),
              const SizedBox(width: 10),
              Text(l10n.aboutAppName),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Capstone 2 Project - Comprehensive Pet Care System.',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text('${l10n.version}: 1.0.0'),
              const Text('Developed by: PetCareX Team'),
              const SizedBox(height: 12),
              const Text(
                'This application helps you manage health, appointments, and connect with reputable veterinarians quickly.',
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(l10n.close, style: const TextStyle(color: Color(0xFF00CFE8))),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final langProvider = context.watch<LanguageProvider>();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          l10n.account,
          style: const TextStyle(
            color: Color(0xFF1E1E1E),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.account,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1E1E1E),
              ),
            ),
            const SizedBox(height: 16),
            _buildAccountItem(
              icon: Icons.person_outline_rounded,
              iconColor: const Color(0xFF00CFE8),
              title: l10n.personalInfo,
              subtitle: l10n.personalInfoSubtitle,
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
              title: l10n.petInfo,
              subtitle: l10n.petInfoSubtitle,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const MyPetsPage()),
                );
              },
            ),
            const SizedBox(height: 16),
            _buildAccountItem(
              icon: Icons.language_rounded,
              iconColor: const Color(0xFF00CFE8),
              title: langProvider.locale.languageCode == 'vi' ? 'Ngôn ngữ' : 'Language',
              subtitle: langProvider.locale.languageCode == 'vi' ? 'Tiếng Việt' : 'English',
              onTap: () => _showLanguageDialog(l10n),
            ),
            const SizedBox(height: 16),
            _buildAccountItem(
              icon: Icons.lock_outline_rounded,
              iconColor: const Color(0xFF7367F0),
              title: l10n.changePassword,
              subtitle: l10n.changePasswordSubtitle,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ChangePasswordPage()),
                );
              },
            ),
            const SizedBox(height: 32),
            Text(
              l10n.others,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E1E1E),
              ),
            ),
            const SizedBox(height: 16),
            _buildAccountItem(
              icon: Icons.info_outline_rounded,
              iconColor: const Color(0xFF7367F0),
              title: l10n.aboutUs,
              subtitle: l10n.aboutUsSubtitle,
              onTap: () => _showAboutUsDialog(l10n),
            ),
            const SizedBox(height: 16),
            _buildAccountItem(
              icon: Icons.logout_rounded,
              iconColor: const Color(0xFFEA5455),
              title: l10n.logout,
              subtitle: l10n.exitAccount,
              titleColor: const Color(0xFFEA5455),
              isDestructive: true,
              onTap: () => _showLogoutDialog(l10n),
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
