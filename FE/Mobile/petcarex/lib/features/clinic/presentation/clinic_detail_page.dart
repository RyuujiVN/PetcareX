import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/distance_formatter.dart';
import '../../../core/widgets/star_rating_widget.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../booking/data/models/booking_models.dart';
import '../../booking/presentation/booking_page.dart';
import '../../booking/presentation/provider/booking_provider.dart';
import '../data/models/clinic_homepage_setting.dart';
import '../data/models/clinic_review_models.dart';
import 'provider/nearby_clinic_provider.dart';

// Detail clinic page — banner gradient + summary header + sections (intro, working hours,
// contact, services, reviews) + bottom action bar có nút "Đặt lịch ngay".
class ClinicDetailPage extends StatefulWidget {
  final Clinic clinic;

  const ClinicDetailPage({super.key, required this.clinic});

  @override
  State<ClinicDetailPage> createState() => _ClinicDetailPageState();
}

class _ClinicDetailPageState extends State<ClinicDetailPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<NearbyClinicProvider>().fetchClinicDetail(widget.clinic.id);
    });
  }

  @override
  void dispose() {
    // Detail-state là per-page; clear ngay để page khác (mở clinic khác) không thấy stale data.
    final provider = context.read<NearbyClinicProvider>();
    provider.clearDetail();
    super.dispose();
  }

  void _onBookNowPressed() {
    final bookingProvider = context.read<BookingProvider>();
    bookingProvider.reset();
    bookingProvider.selectClinic(widget.clinic);
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const BookingPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Consumer<NearbyClinicProvider>(
        builder: (context, provider, _) {
          return CustomScrollView(
            slivers: [
              _buildSliverBanner(provider.homepageSetting),
              SliverToBoxAdapter(child: _buildSummaryHeader(l10n)),
              if (provider.isDetailLoading)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 32),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                )
              else if (provider.detailErrorMessage != null)
                SliverToBoxAdapter(
                  child: _buildDetailError(l10n, provider),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      _buildIntroSection(l10n, provider.homepageSetting),
                      const SizedBox(height: 16),
                      _buildContactSection(l10n, provider.homepageSetting),
                      const SizedBox(height: 16),
                      _buildServicesSection(l10n, provider.homepageSetting),
                      const SizedBox(height: 16),
                      _buildReviewsSection(l10n, provider.reviews),
                    ]),
                  ),
                ),
            ],
          );
        },
      ),
      bottomNavigationBar: _buildBottomActionBar(l10n),
    );
  }

  Widget _buildSliverBanner(ClinicHomepageSetting? setting) {
    final hasAvatar =
        widget.clinic.avatarUrl != null && widget.clinic.avatarUrl!.isNotEmpty;
    final title = (setting?.bannerTitle.isNotEmpty ?? false)
        ? setting!.bannerTitle
        : widget.clinic.name;
    final subtitle = setting?.bannerSubtitle ?? '';

    return SliverAppBar(
      pinned: true,
      expandedHeight: 220,
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.onPrimary,
      iconTheme: const IconThemeData(color: AppColors.onPrimary),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (hasAvatar)
              CachedNetworkImage(
                imageUrl: widget.clinic.avatarUrl!,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) =>
                    _buildBannerGradientFallback(),
              )
            else
              _buildBannerGradientFallback(),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.black.withValues(alpha: 0.05),
                    AppColors.black.withValues(alpha: 0.55),
                  ],
                ),
              ),
            ),
            Positioned(
              left: 20,
              right: 20,
              bottom: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.onPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                  ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppColors.onPrimary.withValues(alpha: 0.85),
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBannerGradientFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.infoAccent],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.local_hospital_outlined,
          size: 96,
          color: AppColors.onPrimary.withValues(alpha: 0.4),
        ),
      ),
    );
  }

  Widget _buildSummaryHeader(AppLocalizations l10n) {
    final clinic = widget.clinic;
    final hasReviews = clinic.totalReviews > 0;
    final distanceText = formatDistance(clinic.distance);

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(
            color: AppColors.textAlpha(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            clinic.name,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.location_on_outlined,
                size: 16,
                color: AppColors.textGrey,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  clinic.address,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textGrey,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
          if (distanceText.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(
                  Icons.near_me_outlined,
                  size: 16,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 6),
                Text(
                  distanceText,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 10),
          if (hasReviews)
            Row(
              children: [
                StarRatingWidget(rating: clinic.avgRating, size: 16),
                const SizedBox(width: 6),
                Text(
                  clinic.avgRating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
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
    );
  }

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildIntroSection(
    AppLocalizations l10n,
    ClinicHomepageSetting? setting,
  ) {
    final intro = setting?.introduction ?? '';
    final fallback = widget.clinic.description.isNotEmpty
        ? widget.clinic.description
        : l10n.clinicDetailIntroEmpty;
    final text = intro.isNotEmpty ? intro : fallback;
    return _buildSectionCard(
      icon: Icons.info_outline,
      title: l10n.clinicDetailIntroduction,
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          height: 1.5,
          color: AppColors.textDark,
        ),
      ),
    );
  }

  Widget _buildContactSection(
    AppLocalizations l10n,
    ClinicHomepageSetting? setting,
  ) {
    final workingHours = setting?.workingHours ?? '';
    final phone = setting?.contactPhone.isNotEmpty == true
        ? setting!.contactPhone
        : widget.clinic.phone;
    final email = widget.clinic.email;

    return _buildSectionCard(
      icon: Icons.contact_phone_outlined,
      title: l10n.clinicDetailContact,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (workingHours.isNotEmpty)
            _buildInfoRow(
              Icons.access_time_outlined,
              l10n.clinicDetailWorkingHours,
              workingHours,
            ),
          if (phone.isNotEmpty)
            _buildInfoRow(
              Icons.phone_outlined,
              l10n.clinicDetailPhone,
              phone,
            ),
          if (email.isNotEmpty)
            _buildInfoRow(
              Icons.email_outlined,
              l10n.clinicDetailEmail,
              email,
            ),
          if (workingHours.isEmpty && phone.isEmpty && email.isEmpty)
            Text(
              l10n.clinicDetailContactEmpty,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textGrey,
                fontStyle: FontStyle.italic,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.textGrey),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textGrey,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesSection(
    AppLocalizations l10n,
    ClinicHomepageSetting? setting,
  ) {
    final services = setting?.services ?? const <String>[];
    return _buildSectionCard(
      icon: Icons.medical_services_outlined,
      title: l10n.clinicDetailServices,
      child: services.isEmpty
          ? Text(
              l10n.clinicDetailServicesEmpty,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textGrey,
                fontStyle: FontStyle.italic,
              ),
            )
          : Wrap(
              spacing: 8,
              runSpacing: 8,
              children: services
                  .map(
                    (s) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Text(
                        s,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
    );
  }

  Widget _buildReviewsSection(
    AppLocalizations l10n,
    List<ClinicReviewItem> reviews,
  ) {
    return _buildSectionCard(
      icon: Icons.reviews_outlined,
      title: l10n.clinicDetailReviews,
      child: reviews.isEmpty
          ? Text(
              l10n.clinicNoReviews,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textGrey,
                fontStyle: FontStyle.italic,
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (int i = 0; i < reviews.length; i++) ...[
                  _buildReviewItem(reviews[i]),
                  if (i != reviews.length - 1)
                    const Divider(
                      height: 20,
                      color: AppColors.divider,
                    ),
                ],
              ],
            ),
    );
  }

  Widget _buildReviewItem(ClinicReviewItem review) {
    final author = review.user;
    final dateText = review.createdAt != null
        ? DateFormat('dd/MM/yyyy').format(review.createdAt!)
        : '';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipOval(
          child: (author?.avatarUrl != null && author!.avatarUrl!.isNotEmpty)
              ? CachedNetworkImage(
                  imageUrl: author.avatarUrl!,
                  width: 36,
                  height: 36,
                  fit: BoxFit.cover,
                  errorWidget: (_, _, _) => _reviewAvatarFallback(),
                )
              : _reviewAvatarFallback(),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      author?.fullName ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),
                  if (dateText.isNotEmpty)
                    Text(
                      dateText,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textGrey,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  StarRatingWidget(rating: review.rating, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    review.rating.toStringAsFixed(1),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textDark,
                    ),
                  ),
                ],
              ),
              if (review.content.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  review.content,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    color: AppColors.textDark,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _reviewAvatarFallback() {
    return Container(
      width: 36,
      height: 36,
      color: AppColors.background,
      child: const Icon(Icons.person, size: 20, color: AppColors.iconGrey),
    );
  }

  Widget _buildDetailError(
    AppLocalizations l10n,
    NearbyClinicProvider provider,
  ) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(
            Icons.error_outline,
            size: 48,
            color: AppColors.error,
          ),
          const SizedBox(height: 12),
          Text(
            l10n.failed,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () =>
                provider.fetchClinicDetail(widget.clinic.id),
            icon: const Icon(Icons.refresh, size: 16),
            label: Text(l10n.retry),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionBar(AppLocalizations l10n) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
        decoration: BoxDecoration(
          color: AppColors.background,
          border: const Border(top: BorderSide(color: AppColors.divider)),
          boxShadow: [
            BoxShadow(
              color: AppColors.textAlpha(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            onPressed: _onBookNowPressed,
            icon: const Icon(Icons.calendar_month, size: 20),
            label: Text(
              l10n.clinicDetailBookNow,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
