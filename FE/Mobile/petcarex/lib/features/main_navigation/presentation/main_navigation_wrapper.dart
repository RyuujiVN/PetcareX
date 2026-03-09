import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../features/account/presentation/account_page.dart';
import '../../../../features/booking/presentation/booking_page.dart';
import '../../../../features/community/presentation/community_page.dart';
import '../../../../features/home/presentation/home_page.dart';

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  static _MainNavigationWrapperState? of(BuildContext context) =>
      context.findAncestorStateOfType<_MainNavigationWrapperState>();

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _selectedIndex = 0;

  void setSelectedIndex(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  final List<Widget> _pages = [
    const HomePage(),
    const BookingPage(),
    const Scaffold(body: Center(child: Text("Lịch hẹn"))), // Placeholder
    const CommunityPage(),
    const AccountPage(),
  ];

  void _onItemTapped(int index) {
    if (index == _selectedIndex) return;
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _pages),
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home_outlined, Icons.home, "TRANG CHỦ", 0),
              _buildNavItem(
                Icons.edit_calendar_outlined,
                Icons.edit_calendar,
                "ĐẶT LỊCH",
                1,
              ),
              _buildNavItem(
                Icons.calendar_month_outlined,
                Icons.calendar_month,
                "LỊCH HẸN",
                2,
              ),
              _buildNavItem(Icons.forum_outlined, Icons.forum, "CỘNG ĐỒNG", 3),
              _buildNavItem(Icons.person_outline, Icons.person, "CÁ NHÂN", 4),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    IconData icon,
    IconData activeIcon,
    String label,
    int index,
  ) {
    bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => _onItemTapped(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSelected ? activeIcon : icon,
            color: isSelected ? AppColors.primary : Colors.grey[400],
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: isSelected ? AppColors.primary : Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }
}
