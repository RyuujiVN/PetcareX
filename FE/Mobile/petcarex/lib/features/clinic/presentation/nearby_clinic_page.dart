import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/services/location_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/app_notifier.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'clinic_detail_page.dart';
import 'provider/nearby_clinic_provider.dart';
import 'widgets/nearby_clinic_card.dart';

// Trang "Tìm phòng khám gần nhất". Strict permission: nếu không có vị trí thật,
// hiển thị toast lỗi tương ứng và pop về home — không cho phép browse với fallback.
class NearbyClinicPage extends StatefulWidget {
  const NearbyClinicPage({super.key});

  @override
  State<NearbyClinicPage> createState() => _NearbyClinicPageState();
}

class _NearbyClinicPageState extends State<NearbyClinicPage> {
  final ScrollController _scrollController = ScrollController();
  bool _hasHandledLocationOutcome = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      final provider = context.read<NearbyClinicProvider>();
      await provider.fetchClinics();
      if (!mounted) return;
      _handleLocationOutcome(provider);
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent * 0.8) {
      context.read<NearbyClinicProvider>().loadMore();
    }
  }

  void _handleLocationOutcome(NearbyClinicProvider provider) {
    if (_hasHandledLocationOutcome) return;
    if (!provider.isLocationDefault) {
      _hasHandledLocationOutcome = true;
      return;
    }
    _hasHandledLocationOutcome = true;

    final l10n = AppLocalizations.of(context)!;
    switch (provider.locationReason) {
      case LocationFailureReason.serviceDisabled:
        _showLocationFailureDialog(
          provider: provider,
          title: l10n.locationServiceDisabledTitle,
          message: l10n.nearbyClinicLocationRequiredServiceDisabled,
          openSettings: () => provider.locationService.openLocationSettings(),
        );
        break;
      case LocationFailureReason.permissionPermanentlyDenied:
        _showLocationFailureDialog(
          provider: provider,
          title: l10n.locationPermissionDeniedTitle,
          message: l10n.nearbyClinicLocationRequiredPermanentlyDenied,
          openSettings: () => provider.locationService.openAppSettings(),
        );
        break;
      case LocationFailureReason.permissionDenied:
      case LocationFailureReason.unknown:
      case LocationFailureReason.none:
        AppNotifier.showError(
          context,
          l10n.nearbyClinicLocationRequiredDenied,
        );
        Navigator.of(context).maybePop();
        break;
    }
  }

  Future<void> _showLocationFailureDialog({
    required NearbyClinicProvider provider,
    required String title,
    required String message,
    required Future<bool> Function() openSettings,
  }) async {
    final l10n = AppLocalizations.of(context)!;
    final shouldOpen = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.locationDialogCancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.locationDialogOpenSettings),
          ),
        ],
      ),
    );

    if (!mounted) return;

    if (shouldOpen == true) {
      await openSettings();
      if (!mounted) return;
      // User trở lại app — retry. Nếu vẫn fail, hiển thị toast và pop về home.
      _hasHandledLocationOutcome = false;
      await provider.retryLocation();
      if (!mounted) return;
      if (provider.isLocationDefault) {
        AppNotifier.showError(
          context,
          l10n.nearbyClinicLocationRequiredDenied,
        );
        Navigator.of(context).maybePop();
      } else {
        _hasHandledLocationOutcome = true;
      }
    } else {
      AppNotifier.showError(
        context,
        l10n.nearbyClinicLocationRequiredDenied,
      );
      Navigator.of(context).maybePop();
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
        title: Text(
          l10n.nearbyClinicTitle,
          style: const TextStyle(
            color: AppColors.textDark,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: AppColors.textDark),
      ),
      body: Consumer<NearbyClinicProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.clinics.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }

          if (provider.errorMessage != null && provider.clinics.isEmpty) {
            return _buildErrorState(l10n, provider);
          }

          if (provider.clinics.isEmpty) {
            // Lúc này hoặc đang chờ dialog permission, hoặc đã thật sự không có clinic.
            if (provider.isLocationDefault) {
              return const SizedBox.shrink();
            }
            return _buildEmptyState(l10n);
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () => provider.fetchClinics(),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              itemCount: provider.clinics.length + 1,
              itemBuilder: (context, index) {
                if (index == provider.clinics.length) {
                  if (provider.isLoadingMore) {
                    return const Padding(
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
                    );
                  }
                  return const SizedBox(height: 8);
                }
                final clinic = provider.clinics[index];
                return NearbyClinicCard(
                  clinic: clinic,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ClinicDetailPage(clinic: clinic),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 80),
      children: [
        const Icon(
          Icons.location_searching,
          size: 64,
          color: AppColors.iconGrey,
        ),
        const SizedBox(height: 16),
        Text(
          l10n.nearbyClinicEmpty,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textGrey,
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState(AppLocalizations l10n, NearbyClinicProvider provider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 56,
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
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: provider.fetchClinics,
              icon: const Icon(Icons.refresh, size: 16),
              label: Text(l10n.retry),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.onPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
