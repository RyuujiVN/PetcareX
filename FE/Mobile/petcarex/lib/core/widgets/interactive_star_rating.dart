import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class InteractiveStarRating extends StatelessWidget {
  final int rating;
  final double size;
  final Color activeColor;
  final Color inactiveColor;
  final int maxStars;
  final ValueChanged<int>? onRatingChanged;

  const InteractiveStarRating({
    super.key,
    required this.rating,
    this.size = 28,
    this.activeColor = AppColors.warning,
    this.inactiveColor = AppColors.iconGrey,
    this.maxStars = 5,
    this.onRatingChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(maxStars, (i) {
        final starValue = i + 1;
        final isFilled = starValue <= rating;
        return GestureDetector(
          onTap: onRatingChanged != null
              ? () => onRatingChanged!(starValue)
              : null,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Icon(
              isFilled ? Icons.star_rounded : Icons.star_outline_rounded,
              size: size,
              color: isFilled ? activeColor : inactiveColor,
            ),
          ),
        );
      }),
    );
  }
}
