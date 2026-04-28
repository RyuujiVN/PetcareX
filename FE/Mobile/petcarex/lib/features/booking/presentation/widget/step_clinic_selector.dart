import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/utils/distance_formatter.dart';
import '../../../../../core/widgets/star_rating_widget.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../data/models/booking_models.dart';

class StepClinicSelector extends StatelessWidget {
  final String? selectedClinicId;
  final ValueChanged<Clinic> onSelected;
  final List<Clinic> clinics;
  final bool isLoadingMore;
  final bool hasMore;

  const StepClinicSelector({
    super.key,
    required this.selectedClinicId,
    required this.onSelected,
    required this.clinics,
    this.isLoadingMore = false,
    this.hasMore = false,
  });

  @override
  Widget build(BuildContext context) {
    return SliverMainAxisGroup(
      slivers: [
        SliverList.builder(
          itemCount: clinics.length,
          itemBuilder: (context, i) {
            final clinic = clinics[i];
            return _ClinicCard(
              clinic: clinic,
              isSelected: clinic.id == selectedClinicId,
              onTap: () => onSelected(clinic),
            );
          },
        ),
        if (isLoadingMore)
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: AppColors.primary,
                    strokeWidth: 2,
                  ),
                ),
              ),
            ),
          )
        else if (!hasMore && clinics.isNotEmpty)
          const SliverToBoxAdapter(child: SizedBox(height: 8)),
      ],
    );
  }
}

class _ClinicCard extends StatelessWidget {
  final Clinic clinic;
  final bool isSelected;
  final VoidCallback onTap;

  const _ClinicCard({
    required this.clinic,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final hasReviews = clinic.totalReviews > 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.divider,
            width: 1.5,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.medical_services_outlined,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    clinic.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    clinic.address,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textGrey,
                    ),
                  ),
                  if (formatDistance(clinic.distance).isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 14,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          formatDistance(clinic.distance),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 6),
                  if (hasReviews)
                    Row(
                      children: [
                        StarRatingWidget(rating: clinic.avgRating),
                        const SizedBox(width: 6),
                        Text(
                          clinic.avgRating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textDark,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            '(${l10n.clinicReviewCount(clinic.totalReviews)})',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textGrey,
                            ),
                          ),
                        ),
                      ],
                    )
                  else
                    Text(
                      l10n.clinicNoReviews,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textGrey,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                ],
              ),
            ),
            if (isSelected)
              const Padding(
                padding: EdgeInsets.only(left: 8, top: 4),
                child: Icon(
                  Icons.check_circle,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
