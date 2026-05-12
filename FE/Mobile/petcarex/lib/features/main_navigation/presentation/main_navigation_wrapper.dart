import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../features/account/presentation/account_page.dart';
import '../../../../features/appointment/presentation/appointment_navigation_controller.dart';
import '../../../../features/appointment/presentation/appointment_page.dart';
import '../../../../features/appointment/presentation/provider/appointment_provider.dart';
import '../../../../features/community/presentation/community_page.dart';
import '../../../../features/community/presentation/provider/community_provider.dart';
import '../../../../features/home/presentation/home_page.dart';
import '../../../../features/notification/presentation/provider/notification_provider.dart';
import '../../../l10n/generated/app_localizations.dart';

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  static MainNavigationWrapperState? _activeState;

  static MainNavigationWrapperState? of(BuildContext context) =>
      context.findAncestorStateOfType<MainNavigationWrapperState>();

  static MainNavigationWrapperState? get activeState => _activeState;

  static void switchToTab(int index) {
    _activeState?.setSelectedIndex(index);
  }

  @override
  State<MainNavigationWrapper> createState() => MainNavigationWrapperState();
}

class MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _selectedIndex = 0;
  final AppointmentNavigationController _appointmentNavigationController =
      AppointmentNavigationController();
  final HomeChatbotHintController _homeChatbotHintController =
      HomeChatbotHintController();

  final Set<int> _initializedPages = {0};
  final List<Widget?> _pages = List<Widget?>.filled(4, null);

  @override
  void initState() {
    super.initState();
    MainNavigationWrapper._activeState = this;
    // Init notification socket + fetch initial data after login
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().init();
    });
  }

  @override
  void dispose() {
    if (identical(MainNavigationWrapper._activeState, this)) {
      MainNavigationWrapper._activeState = null;
    }
    super.dispose();
  }

  void setSelectedIndex(int index) {
    final previousIndex = _selectedIndex;
    final wasInitialized = _initializedPages.contains(index);

    setState(() {
      _selectedIndex = index;
      _initializedPages.add(index);
    });

    if (index == 0) {
      _homeChatbotHintController.restartCountdown();
    }

    if (index == 1 && wasInitialized) {
      unawaited(context.read<AppointmentProvider>().fetchAppointments());
    }

    if (index == 2 && wasInitialized && previousIndex != 2) {
      unawaited(context.read<CommunityProvider>().setSearchKeyword(''));
    }
  }

  void openAppointmentDetail(
    String appointmentId, {
    bool expandAiDiagnosis = false,
  }) {
    _appointmentNavigationController.openAppointmentDetails(
      appointmentId,
      expandAiDiagnosis: expandAiDiagnosis,
    );
    setSelectedIndex(1);
  }

  Widget _buildPage(int index) {
    return switch (index) {
      0 => HomePage(chatbotHintController: _homeChatbotHintController),
      1 => AppointmentPage(
          navigationController: _appointmentNavigationController),
      2 => const CommunityPage(),
      3 => const AccountPage(),
      _ => const SizedBox(),
    };
  }

  void _onItemTapped(int index) {
    if (index == _selectedIndex) {
      if (index == 0) {
        _homeChatbotHintController.restartCountdown();
      }
      if (index == 1) {
        unawaited(context.read<AppointmentProvider>().fetchAppointments());
      }
      return;
    }

    setSelectedIndex(index);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    for (final i in _initializedPages) {
      _pages[i] ??= _buildPage(i);
    }

    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages.map((page) => page ?? const SizedBox()).toList(),
      ),
      bottomNavigationBar: BottomAppBar(
        color: AppColors.secondary,
        surfaceTintColor: AppColors.transparent,
        elevation: 0,
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home_outlined, Icons.home, l10n.navHome, 0),
              _buildNavItem(
                Icons.calendar_month_outlined,
                Icons.calendar_month,
                l10n.navAppointments,
                1,
              ),
              _buildNavItem(
                Icons.forum_outlined,
                Icons.forum,
                l10n.navCommunity,
                2,
              ),
              _buildNavItem(
                Icons.person_outline,
                Icons.person,
                l10n.navProfile,
                3,
              ),
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
            color: isSelected ? AppColors.primary : AppColors.navInactive,
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: isSelected ? AppColors.primary : AppColors.navInactive,
            ),
          ),
        ],
      ),
    );
  }
}
