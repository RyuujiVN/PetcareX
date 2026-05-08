import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/configs/app_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_notifier.dart';
import '../../../core/utils/distance_formatter.dart';
import '../../../core/widgets/star_rating_widget.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../booking/data/models/booking_models.dart';
import '../../booking/presentation/booking_page.dart';
import '../../booking/presentation/provider/booking_provider.dart';
import '../data/models/clinic_homepage_setting.dart';
import '../data/models/clinic_review_models.dart';
import 'provider/nearby_clinic_provider.dart';

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
    final provider = context.read<NearbyClinicProvider>();
    provider.clearDetail();
    super.dispose();
  }

  void _onBookNowPressed() {
    final bookingProvider = context.read<BookingProvider>();
    bookingProvider.reset();
    bookingProvider.selectClinic(widget.clinic);
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const BookingPage()));
  }

  Future<void> _openMap(ClinicLocationSection location) async {
    final launchUrlText = _resolveMapLaunchUrl(location);
    final mapQuery = _resolveMapQuery(location);
    final launchCandidates = _buildMapLaunchCandidates(
      mapQuery: mapQuery,
      fallbackUrlText: launchUrlText,
    );

    if (launchCandidates.isEmpty) {
      AppNotifier.showInfo(
        context,
        _localizedText(
          context,
          vi: 'Phòng khám chưa cập nhật liên kết bản đồ.',
          en: 'Map link is not available for this clinic yet.',
        ),
      );
      return;
    }

    for (final uri in launchCandidates) {
      try {
        final opened = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        if (opened) {
          return;
        }
      } catch (_) {
        // Keep trying next candidate.
      }
    }

    if (mounted) {
      AppNotifier.showError(
        context,
        _localizedText(
          context,
          vi: 'Không thể mở Google Maps.',
          en: 'Unable to open Google Maps.',
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Consumer<NearbyClinicProvider>(
        builder: (context, provider, _) {
          final setting =
              provider.homepageSetting ?? ClinicHomepageSetting.defaults();

          return CustomScrollView(
            slivers: [
              _buildSliverBanner(setting, l10n),
              SliverToBoxAdapter(child: _buildSummaryHeader(l10n)),
              if (provider.isDetailLoading)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
                    child: LinearProgressIndicator(
                      minHeight: 2,
                      color: AppColors.primary,
                      backgroundColor: AppColors.divider,
                    ),
                  ),
                ),
              if (provider.detailErrorMessage != null)
                SliverToBoxAdapter(child: _buildDetailWarning()),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildAboutSection(setting),
                    const SizedBox(height: 16),
                    _buildGallerySection(setting),
                    const SizedBox(height: 16),
                    _buildTeamSection(setting),
                    const SizedBox(height: 16),
                    _buildReviewsSection(l10n, provider.reviews),
                    const SizedBox(height: 16),
                    _buildLocationSection(setting),
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

  Widget _buildSliverBanner(
    ClinicHomepageSetting setting,
    AppLocalizations l10n,
  ) {
    final title = _firstNonBlank([setting.hero.title, widget.clinic.name]);
    final subtitle = _firstNonBlank([
      setting.hero.description,
      setting.about.description,
    ]);
    final ctaText = _firstNonBlank([
      setting.hero.ctaText,
      l10n.clinicDetailBookNow,
    ]);

    final heroImage = _firstNonBlank([
      _resolveImageUrl(setting.hero.bannerImage),
      widget.clinic.avatarUrl ?? '',
    ]);

    return SliverAppBar(
      pinned: true,
      expandedHeight: 250,
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.onPrimary,
      iconTheme: const IconThemeData(color: AppColors.onPrimary),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (heroImage.isNotEmpty)
              _buildImage(
                imagePath: heroImage,
                fit: BoxFit.cover,
                fallback: _buildBannerGradientFallback(),
              )
            else
              _buildBannerGradientFallback(),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.black.withValues(alpha: 0.08),
                    AppColors.black.withValues(alpha: 0.65),
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
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.onPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppColors.onPrimary.withValues(alpha: 0.9),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 40,
                    child: ElevatedButton.icon(
                      onPressed: _onBookNowPressed,
                      icon: const Icon(Icons.calendar_month, size: 18),
                      label: Text(
                        ctaText,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.onPrimary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
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
          color: AppColors.onPrimary.withValues(alpha: 0.35),
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

  Widget _buildAboutSection(ClinicHomepageSetting setting) {
    final about = setting.about;
    final locationAddress = _firstNonBlank([
      setting.locationSection.address,
      widget.clinic.address,
    ]);
    final aboutDescription = _resolveAboutDescription(
      about.description,
      locationAddress,
    );

    return _buildSectionCard(
      icon: Icons.info_outline,
      title: _localizedText(
        context,
        vi: 'GIỚI THIỆU BỆNH VIỆN',
        en: 'CLINIC INTRODUCTION',
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (about.label.isNotEmpty)
            Text(
              about.label,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textGrey,
                fontWeight: FontWeight.w600,
              ),
            ),
          if (about.title.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              about.title,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          ],
          if (aboutDescription.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              aboutDescription,
              style: const TextStyle(
                fontSize: 13,
                height: 1.5,
                color: AppColors.textDark,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: AppColors.primary.withValues(alpha: 0.06),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    about.highlightNumber,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    about.highlightLabel,
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGallerySection(ClinicHomepageSetting setting) {
    final title = _firstNonBlank([
      setting.gallerySection.title,
      _localizedText(context, vi: 'THƯ VIỆN ẢNH', en: 'PHOTO GALLERY'),
    ]);
    final subtitle = setting.gallerySection.subtitle;
    final images = setting.galleryImages
        .where((item) => item.image.trim().isNotEmpty)
        .toList();

    return _buildSectionCard(
      icon: Icons.photo_library_outlined,
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (subtitle.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                subtitle,
                style: const TextStyle(fontSize: 13, color: AppColors.textGrey),
              ),
            ),
          if (images.isEmpty)
            Text(
              _localizedText(
                context,
                vi: 'Phòng khám chưa cập nhật ảnh thư viện.',
                en: 'Gallery images have not been updated yet.',
              ),
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textGrey,
                fontStyle: FontStyle.italic,
              ),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: images.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.2,
              ),
              itemBuilder: (context, index) {
                final image = images[index];
                final imagePath = _resolveImageUrl(image.image);
                return Material(
                  color: AppColors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: imagePath.isEmpty
                        ? null
                        : () => _showImagePreview(
                            imagePath: imagePath,
                            title: image.alt,
                          ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          _buildImage(
                            imagePath: imagePath,
                            fit: BoxFit.cover,
                            fallback: _imagePlaceholder(label: image.alt),
                          ),
                          Container(
                            alignment: Alignment.bottomLeft,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  AppColors.black.withValues(alpha: 0),
                                  AppColors.black.withValues(alpha: 0.45),
                                ],
                              ),
                            ),
                            padding: const EdgeInsets.all(8),
                            child: Text(
                              image.alt,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.onPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildTeamSection(ClinicHomepageSetting setting) {
    final title = _firstNonBlank([
      setting.teamSection.title,
      _localizedText(context, vi: 'ĐỘI NGŨ PHÒNG KHÁM', en: 'CLINIC TEAM'),
    ]);

    final doctors = setting.doctors
        .where((doctor) => doctor.name.trim().isNotEmpty)
        .toList();

    return _buildSectionCard(
      icon: Icons.groups_2_outlined,
      title: title,
      child: doctors.isEmpty
          ? Text(
              _localizedText(
                context,
                vi: 'Phòng khám chưa cập nhật đội ngũ bác sĩ.',
                en: 'The doctor team has not been updated yet.',
              ),
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textGrey,
                fontStyle: FontStyle.italic,
              ),
            )
          : GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: doctors.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.72,
              ),
              itemBuilder: (context, index) {
                final doctor = doctors[index];
                final split = _splitDoctorLabel(doctor.name);

                return Container(
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(16),
                          ),
                          child: _buildImage(
                            imagePath: _resolveImageUrl(doctor.image),
                            fit: BoxFit.cover,
                            fallback: Container(
                              color: AppColors.background,
                              alignment: Alignment.center,
                              child: const Icon(
                                Icons.person,
                                size: 42,
                                color: AppColors.iconGrey,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              split.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textDark,
                              ),
                            ),
                            if (split.role.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                split.role,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textGrey,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Widget _buildLocationSection(ClinicHomepageSetting setting) {
    final location = setting.locationSection;
    final hasMapEmbed = _normalizeMapEmbedValue(location.mapEmbedUrl).isNotEmpty;
    final displayAddress = _firstNonBlank([
      location.address,
      widget.clinic.address,
    ]);

    return _buildSectionCard(
      icon: Icons.location_on_outlined,
      title: _firstNonBlank([
        location.title,
        _localizedText(context, vi: 'ĐỊA CHỈ PHÒNG KHÁM', en: 'CLINIC ADDRESS'),
      ]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (location.subtitle.isNotEmpty)
            Text(
              location.subtitle,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textGrey,
                height: 1.4,
              ),
            ),
          if (displayAddress.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(Icons.place, size: 16, color: AppColors.primary),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    displayAddress,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textDark,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (hasMapEmbed) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openMap(location),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: Text(
                  _localizedText(
                    context,
                    vi: 'Mở Google Maps',
                    en: 'Open Google Maps',
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.onPrimary,
                ),
              ),
            ),
          ],
        ],
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
                    const Divider(height: 20, color: AppColors.divider),
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

  Widget _buildDetailWarning() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.warning.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.warning.withValues(alpha: 0.35)),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AppColors.warning, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _localizedText(
                  context,
                  vi: 'Một phần nội dung phòng khám chưa tải được. Đang hiển thị dữ liệu mặc định.',
                  en: 'Some clinic content could not be loaded. Showing fallback content.',
                ),
                style: const TextStyle(fontSize: 12, color: AppColors.textDark),
              ),
            ),
          ],
        ),
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
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
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

  Widget _buildImage({
    required String imagePath,
    required BoxFit fit,
    required Widget fallback,
  }) {
    if (imagePath.isEmpty) {
      return fallback;
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return CachedNetworkImage(
        imageUrl: imagePath,
        fit: fit,
        errorWidget: (_, _, _) => fallback,
      );
    }

    if (imagePath.startsWith('assets/')) {
      return Image.asset(
        imagePath,
        fit: fit,
        errorBuilder: (_, _, _) => fallback,
      );
    }

    return fallback;
  }

  Widget _imagePlaceholder({required String label}) {
    return Container(
      color: AppColors.background,
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.photo, size: 28, color: AppColors.iconGrey),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 10, color: AppColors.textGrey),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showImagePreview({
    required String imagePath,
    required String title,
  }) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return Dialog(
          backgroundColor: AppColors.black,
          insetPadding: const EdgeInsets.all(12),
          child: Stack(
            children: [
              Positioned.fill(
                child: InteractiveViewer(
                  minScale: 0.8,
                  maxScale: 4,
                  child: _buildImage(
                    imagePath: imagePath,
                    fit: BoxFit.contain,
                    fallback: Container(
                      color: AppColors.black,
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.broken_image,
                        color: AppColors.onPrimary,
                        size: 42,
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 10,
                left: 12,
                right: 48,
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.onPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Positioned(
                top: 6,
                right: 6,
                child: IconButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  icon: const Icon(Icons.close, color: AppColors.onPrimary),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  _DoctorLabelParts _splitDoctorLabel(String raw) {
    final normalized = raw.trim();
    if (normalized.isEmpty) {
      return const _DoctorLabelParts(name: '', role: '');
    }

    final parts = normalized.split(RegExp(r'\s+-\s+'));
    if (parts.length < 2) {
      return _DoctorLabelParts(name: normalized, role: '');
    }

    return _DoctorLabelParts(
      name: parts[0],
      role: parts.sublist(1).join(' - '),
    );
  }

  String _resolveImageUrl(String rawPath) {
    final normalized = rawPath.trim();
    if (normalized.isEmpty) {
      return '';
    }

    if (normalized.startsWith('http://') ||
        normalized.startsWith('https://') ||
        normalized.startsWith('assets/')) {
      return normalized;
    }

    if (normalized.startsWith('//')) {
      return 'https:$normalized';
    }

    if (normalized.startsWith('/')) {
      return '${AppConfig.baseUrl}$normalized';
    }

    return normalized;
  }

  String _resolveMapLaunchUrl(ClinicLocationSection location) {
    final explicitMapLink = location.mapLink.trim();
    if (explicitMapLink.isNotEmpty) {
      return explicitMapLink;
    }

    final normalizedEmbed = _normalizeMapEmbedValue(location.mapEmbedUrl);
    if (normalizedEmbed.isEmpty) {
      return '';
    }

    final uri = Uri.tryParse(normalizedEmbed);
    if (uri == null) {
      return normalizedEmbed;
    }

    final q = (uri.queryParameters['q'] ?? '').trim();
    if (q.isNotEmpty) {
      return 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeQueryComponent(q)}';
    }

    return normalizedEmbed;
  }

  String _normalizeMapEmbedValue(String rawValue) {
    final normalizedRaw = rawValue.trim();
    if (normalizedRaw.isEmpty) {
      return '';
    }

    final iframeSrcMatch = RegExp(
      r'''src=(['"])(.*?)\1''',
      caseSensitive: false,
    ).firstMatch(normalizedRaw);

    if (iframeSrcMatch != null && iframeSrcMatch.groupCount >= 2) {
      final src = iframeSrcMatch.group(2)?.trim() ?? '';
      if (src.isNotEmpty) {
        return src;
      }
    }

    return normalizedRaw;
  }

  String _resolveMapQuery(ClinicLocationSection location) {
    final explicitQuery = _extractMapQueryFromUrl(location.mapLink);
    if (explicitQuery.isNotEmpty) {
      return explicitQuery;
    }

    final normalizedEmbed = _normalizeMapEmbedValue(location.mapEmbedUrl);
    final embedQuery = _extractMapQueryFromUrl(normalizedEmbed);
    if (embedQuery.isNotEmpty) {
      return embedQuery;
    }

    return location.address.trim();
  }

  String _extractMapQueryFromUrl(String rawUrl) {
    final normalizedRaw = rawUrl.trim();
    if (normalizedRaw.isEmpty) {
      return '';
    }

    final uri = Uri.tryParse(normalizedRaw);
    if (uri == null) {
      return '';
    }

    final query =
        (uri.queryParameters['q'] ?? uri.queryParameters['query'] ?? '')
            .replaceAll('+', ' ')
            .trim();
    if (query.isNotEmpty) {
      return query;
    }

    final placeIndex = uri.pathSegments.indexOf('place');
    if (placeIndex != -1 && placeIndex + 1 < uri.pathSegments.length) {
      return Uri.decodeComponent(uri.pathSegments[placeIndex + 1])
          .replaceAll('+', ' ')
          .trim();
    }

    return '';
  }

  List<Uri> _buildMapLaunchCandidates({
    required String mapQuery,
    required String fallbackUrlText,
  }) {
    final candidates = <Uri>[];

    final normalizedQuery = mapQuery.trim();
    if (normalizedQuery.isNotEmpty) {
      final encodedQuery = Uri.encodeQueryComponent(normalizedQuery);
      candidates.add(Uri.parse('comgooglemaps://?q=$encodedQuery'));
      candidates.add(Uri.parse('geo:0,0?q=$encodedQuery'));
    }

    final normalizedFallback = fallbackUrlText.trim();
    final fallbackUri = Uri.tryParse(normalizedFallback);
    if (fallbackUri != null && _isNativeMapScheme(fallbackUri)) {
      candidates.add(fallbackUri);
    }

    final deduped = <Uri>[];
    final seen = <String>{};
    for (final uri in candidates) {
      final key = uri.toString();
      if (key.isEmpty || seen.contains(key)) {
        continue;
      }
      seen.add(key);
      deduped.add(uri);
    }

    return deduped;
  }

  bool _isNativeMapScheme(Uri uri) {
    final scheme = uri.scheme.toLowerCase();
    return scheme == 'comgooglemaps' ||
        scheme == 'geo' ||
        scheme == 'google.navigation';
  }

  String _resolveAboutDescription(String rawDescription, String locationAddress) {
    final normalizedDescription = rawDescription.trim();
    final normalizedLocationAddress = locationAddress.trim();

    if (normalizedLocationAddress.isEmpty) {
      return normalizedDescription;
    }

    if (normalizedDescription.isEmpty) {
      return normalizedLocationAddress;
    }

    if (_isLikelyAddressText(normalizedDescription)) {
      return normalizedLocationAddress;
    }

    return normalizedDescription;
  }

  bool _isLikelyAddressText(String raw) {
    final normalized = raw.toLowerCase();
    if (!normalized.contains(',')) {
      return false;
    }

    final addressHints = [
      'phường',
      'quận',
      'huyện',
      'thành phố',
      'tp.',
      'tp ',
      'ward',
      'district',
      'city',
    ];

    final hasAddressHint = addressHints.any(normalized.contains);
    final hasStreetNumber = RegExp(r'\d').hasMatch(normalized);

    return hasAddressHint && hasStreetNumber;
  }

  String _firstNonBlank(List<String> values) {
    for (final value in values) {
      final normalized = value.trim();
      if (normalized.isNotEmpty) {
        return normalized;
      }
    }

    return '';
  }

  String _localizedText(
    BuildContext context, {
    required String vi,
    required String en,
  }) {
    final languageCode = Localizations.localeOf(context).languageCode;
    if (languageCode.toLowerCase() == 'en') {
      return en;
    }
    return vi;
  }
}

class _DoctorLabelParts {
  final String name;
  final String role;

  const _DoctorLabelParts({required this.name, required this.role});
}
