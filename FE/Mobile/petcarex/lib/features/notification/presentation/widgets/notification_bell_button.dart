import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../provider/notification_provider.dart';
import '../screens/notification_screen.dart';

class NotificationBellButton extends StatelessWidget {
  final Color iconColor;
  final double iconSize;

  const NotificationBellButton({
    super.key,
    this.iconColor = AppColors.text,
    this.iconSize = 24,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        IconButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const NotificationScreen(),
              ),
            );
          },
          icon: Icon(
            Icons.notifications_none_outlined,
            color: iconColor,
            size: iconSize,
          ),
        ),
        Consumer<NotificationProvider>(
          builder: (context, notifProvider, _) {
            if (notifProvider.totalUnread <= 0) {
              return const SizedBox.shrink();
            }

            return Positioned(
              right: 8,
              top: 8,
              child: Container(
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  notifProvider.totalUnread > 99
                      ? '99+'
                      : '${notifProvider.totalUnread}',
                  style: const TextStyle(
                    color: AppColors.onPrimary,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
