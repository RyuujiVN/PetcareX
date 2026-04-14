import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../data/models/notification_model.dart';

class NotificationItem extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback? onTap;

  const NotificationItem({
    super.key,
    required this.notification,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: notification.isRead
              ? AppColors.background
              : AppColors.primaryAlpha(0.06),
          border: Border(
            bottom: BorderSide(color: AppColors.divider, width: 1),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildIcon(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getTitle(l10n),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight:
                          notification.isRead ? FontWeight.w400 : FontWeight.w600,
                      color: AppColors.textDark,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getDescription(l10n),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textGrey,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _formatRelativeTime(notification.createdAt, l10n),
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textGrey,
                    ),
                  ),
                ],
              ),
            ),
            if (!notification.isRead)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 8),
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildIcon() {
    final (IconData icon, Color color, Color bgColor) = switch (notification.type) {
      'APPOINTMENT_BOOKED' => (
          Icons.calendar_today_outlined,
          AppColors.primary,
          AppColors.primaryAlpha(0.12),
        ),
      'APPOINTMENT_CANCELLED' => (
          Icons.event_busy_outlined,
          AppColors.error,
          AppColors.errorLight,
        ),
      'APPOINTMENT_STATUS_UPDATED_BY_CLIENT' => (
          Icons.update_outlined,
          AppColors.warning,
          const Color(0xFFFFF3E0),
        ),
      'APPOINTMENT_REMINDER' => (
          Icons.alarm_outlined,
          AppColors.primary,
          AppColors.primaryAlpha(0.12),
        ),
      'AI_DIAGNOSIS' => (
          Icons.smart_toy_outlined,
          AppColors.success,
          AppColors.successLight,
        ),
      'FOLLOW_UP_REMINDER' => (
          Icons.medical_services_outlined,
          AppColors.warning,
          const Color(0xFFFFF3E0),
        ),
      'COMMENT' => (
          Icons.mode_comment_outlined,
          AppColors.primary,
          AppColors.primaryAlpha(0.12),
        ),
      'COMMENT_REPLY' => (
          Icons.chat_bubble_outline,
          AppColors.primary,
          AppColors.primaryAlpha(0.12),
        ),
      'LIKE' => (
          Icons.favorite_border,
          AppColors.error,
          AppColors.errorLight,
        ),
      _ => (
          Icons.notifications_outlined,
          AppColors.textGrey,
          AppColors.formFillDisabled,
        ),
    };

    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }

  String _getTitle(AppLocalizations l10n) {
    return switch (notification.type) {
      'APPOINTMENT_BOOKED' => l10n.notifAppointmentBooked,
      'APPOINTMENT_CANCELLED' => l10n.notifAppointmentCancelled,
      'APPOINTMENT_STATUS_UPDATED_BY_CLIENT' =>
        l10n.notifAppointmentStatusUpdated,
      'APPOINTMENT_REMINDER' => l10n.notifAppointmentReminder,
      'AI_DIAGNOSIS' => l10n.notifAiDiagnosis,
      'FOLLOW_UP_REMINDER' => l10n.notifFollowUpReminder,
      'COMMENT' => 'Co binh luan moi',
      'COMMENT_REPLY' => l10n.notifCommentReply,
      'LIKE' => 'Bai viet duoc yeu thich',
      _ => l10n.notifGeneral,
    };
  }

  String _getDescription(AppLocalizations l10n) {
    final n = notification;
    return switch (n.type) {
      'APPOINTMENT_BOOKED' => l10n.notifAppointmentBookedDesc(
          n.userName ?? '', n.appointmentDate ?? '', n.appointmentTime ?? ''),
      'APPOINTMENT_CANCELLED' => n.clinicName != null
          ? l10n.notifAppointmentCancelledByClinicDesc(n.clinicName!)
          : l10n.notifAppointmentCancelledDesc(
              n.appointmentDate ?? '', n.appointmentTime ?? ''),
      'APPOINTMENT_STATUS_UPDATED_BY_CLIENT' =>
        l10n.notifAppointmentStatusUpdatedDesc(n.userName ?? ''),
      'APPOINTMENT_REMINDER' => l10n.notifAppointmentReminderDesc(
          n.appointmentDate ?? '', n.appointmentTime ?? ''),
      'AI_DIAGNOSIS' =>
        l10n.notifAiDiagnosisDesc(n.petName ?? ''),
      'FOLLOW_UP_REMINDER' =>
        l10n.notifFollowUpReminderDesc(n.appointmentDate ?? ''),
      'COMMENT' => n.userName != null && n.userName!.trim().isNotEmpty
          ? '${n.userName} da binh luan bai viet cua ban'
          : 'Co binh luan moi tren bai viet cua ban',
      'COMMENT_REPLY' => n.userName != null && n.userName!.trim().isNotEmpty
          ? '${n.userName} da phan hoi binh luan cua ban'
          : l10n.notifCommentReplyDesc,
      'LIKE' => n.userName != null && n.userName!.trim().isNotEmpty
          ? '${n.userName} da thich bai viet cua ban'
          : 'Co nguoi vua thich bai viet cua ban',
      _ => '',
    };
  }

  String _formatRelativeTime(DateTime dateTime, AppLocalizations l10n) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inSeconds < 60) return l10n.notifTimeJustNow;
    if (diff.inMinutes < 60) return l10n.notifTimeMinutesAgo(diff.inMinutes);
    if (diff.inHours < 24) return l10n.notifTimeHoursAgo(diff.inHours);
    if (diff.inDays < 30) return l10n.notifTimeDaysAgo(diff.inDays);
    return l10n.notifTimeLongAgo;
  }
}
