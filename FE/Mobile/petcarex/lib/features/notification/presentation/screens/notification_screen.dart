import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../main_navigation/presentation/main_navigation_wrapper.dart';
import '../../data/models/notification_model.dart';
import '../provider/notification_provider.dart';
import '../widgets/notification_item.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({
    super.key,
    this.onOpenAppointmentsTab,
    this.onOpenCommunityTab,
    this.onOpenAppointmentDetail,
  });

  final VoidCallback? onOpenAppointmentsTab;
  final VoidCallback? onOpenCommunityTab;
  final void Function(
    String appointmentId, {
    bool expandAiDiagnosis,
  })? onOpenAppointmentDetail;

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().fetchNotifications(refresh: true);
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<NotificationProvider>().loadMore();
    }
  }

  void _onNotificationTap(NotificationModel notification) {
    final provider = context.read<NotificationProvider>();
    final mainNavState = MainNavigationWrapper.of(context);

    void openAppointmentsTab() {
      if (widget.onOpenAppointmentsTab != null) {
        widget.onOpenAppointmentsTab!();
        return;
      }
      mainNavState?.setSelectedIndex(2);
    }

    void openCommunityTab() {
      if (widget.onOpenCommunityTab != null) {
        widget.onOpenCommunityTab!();
        return;
      }
      mainNavState?.setSelectedIndex(3);
    }

    void openAppointmentDetail(String appointmentId, {bool expandAi = false}) {
      if (widget.onOpenAppointmentDetail != null) {
        widget.onOpenAppointmentDetail!(
          appointmentId,
          expandAiDiagnosis: expandAi,
        );
        return;
      }
      mainNavState?.openAppointmentDetail(
        appointmentId,
        expandAiDiagnosis: expandAi,
      );
    }

    // Mark as read
    if (!notification.isRead) {
      provider.markAsRead(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'APPOINTMENT_BOOKED':
      case 'APPOINTMENT_CANCELLED':
      case 'APPOINTMENT_STATUS_UPDATED_BY_CLIENT':
      case 'APPOINTMENT_REMINDER':
        Navigator.pop(context); // pop notification screen
        openAppointmentsTab();
        break;
      case 'AI_DIAGNOSIS':
        Navigator.pop(context);
        if (notification.appointmentId != null &&
            notification.appointmentId!.isNotEmpty) {
          openAppointmentDetail(
            notification.appointmentId!,
            expandAi: true,
          );
        } else {
          openAppointmentsTab();
        }
        break;
      case 'COMMENT_REPLY':
        Navigator.pop(context);
        openCommunityTab();
        break;
      case 'FOLLOW_UP_REMINDER':
        Navigator.pop(context);
        openAppointmentsTab();
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.appBarBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.notifTitle,
          style: const TextStyle(
            color: AppColors.textDark,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, provider, _) {
              if (provider.totalUnread == 0) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => provider.markAllAsRead(),
                child: Text(
                  l10n.notifMarkAllRead,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterBar(l10n),
          Expanded(child: _buildNotificationList(l10n)),
        ],
      ),
    );
  }

  Widget _buildFilterBar(AppLocalizations l10n) {
    return Consumer<NotificationProvider>(
      builder: (context, provider, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: const BoxDecoration(
            color: AppColors.background,
            border: Border(
              bottom: BorderSide(color: AppColors.divider, width: 1),
            ),
          ),
          child: Row(
            children: [
              _buildFilterChip(
                label: l10n.notifFilterAll,
                isSelected: provider.filter == 'ALL',
                onTap: () => provider.setFilter('ALL'),
              ),
              const SizedBox(width: 8),
              _buildFilterChip(
                label: l10n.notifFilterUnread,
                isSelected: provider.filter == 'UNREAD',
                onTap: () => provider.setFilter('UNREAD'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.formFillDisabled,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppColors.onPrimary : AppColors.textGrey,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationList(AppLocalizations l10n) {
    return Consumer<NotificationProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.notifications.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }

        if (provider.notifications.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.notifications_off_outlined,
                  size: 64,
                  color: AppColors.iconGrey,
                ),
                const SizedBox(height: 16),
                Text(
                  l10n.notifEmpty,
                  style: const TextStyle(
                    color: AppColors.textGrey,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => provider.fetchNotifications(refresh: true),
          child: ListView.builder(
            controller: _scrollController,
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount:
                provider.notifications.length + (provider.hasMore ? 1 : 0),
            itemBuilder: (context, index) {
              if (index >= provider.notifications.length) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                );
              }

              final notification = provider.notifications[index];
              return NotificationItem(
                notification: notification,
                onTap: () => _onNotificationTap(notification),
              );
            },
          ),
        );
      },
    );
  }
}
