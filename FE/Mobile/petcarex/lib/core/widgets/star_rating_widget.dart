import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class StarRatingWidget extends StatelessWidget {
  final double rating;
  final double size;
  final Color color;
  final int maxStars;

  const StarRatingWidget({
    super.key,
    required this.rating,
    this.size = 14,
    this.color = AppColors.warning,
    this.maxStars = 5,
  });

  @override
  Widget build(BuildContext context) {
    final clamped = rating.clamp(0, maxStars.toDouble()).toDouble();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(maxStars, (i) {
        final position = i + 1;
        IconData icon;
        if (clamped >= position) {
          icon = Icons.star_rounded;
        } else if (clamped >= position - 0.5) {
          icon = Icons.star_half_rounded;
        } else {
          icon = Icons.star_outline_rounded;
        }
        return Icon(icon, size: size, color: color);
      }),
    );
  }
}
