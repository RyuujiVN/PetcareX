import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:petcarex/features/auth/presentation/providers/auth_provider.dart';
import 'package:provider/provider.dart';

import '../../../core/enums/appointment_status_enum.dart';
import '../../../core/enums/service_enum.dart';
import '../../../core/services/camera_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/image_helper.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../appointment/data/appointment_model.dart';
import '../../appointment/presentation/provider/appointment_provider.dart';
import '../../chat/presentation/chat_page.dart';
import '../../main_navigation/presentation/main_navigation_wrapper.dart';
import '../../notification/presentation/notification.dart';
import '../../pet/data/models/pet_models.dart';
import '../../pet/presentation/add_pet_page.dart';
import '../../pet/presentation/edit_pet_page.dart';
import '../../pet/presentation/provider/pet_provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final CameraService _cameraService = CameraService();
  final bool _hasUnreadNotifications = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PetProvider>().fetchMyPets();
      context.read<AuthProvider>().fetchProfile();
      final appointmentProvider = context.read<AppointmentProvider>();
      if (!appointmentProvider.isLoading &&
          appointmentProvider.appointments.isEmpty) {
        appointmentProvider.fetchAppointments();
      }
    });
  }

  Future<void> _openQRScanner(AppLocalizations l10n) async {
    bool hasPermission = await _cameraService.requestCameraPermission();

    if (hasPermission) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted) return;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => QRScannerScreen(
            onScan: (code) {
              Navigator.pop(context);
              _showQRResult(code, l10n);
            },
          ),
        ),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l10n.cameraPermission)));
    }
  }

  void _showQRResult(String code, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.qrResult),
        content: Text('${l10n.qrContent}: $code'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.close),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            _buildHeader(l10n),
            const SizedBox(height: 24),
            _buildUserInfo(l10n),
            const SizedBox(height: 24),
            _buildPetList(l10n),
            const SizedBox(height: 24),
            _buildQuickActions(l10n),
            const SizedBox(height: 32),
            _buildSectionHeader(
              l10n.myAppointments,
              l10n.viewAll,
              onTap: () {
                MainNavigationWrapper.of(context)?.setSelectedIndex(2);
              },
            ),
            const SizedBox(height: 16),
            _buildAppointmentSection(l10n),
            const SizedBox(height: 32),
            _buildSectionHeader(
              l10n.petCareForum,
              l10n.explore,
              onTap: () {
                MainNavigationWrapper.of(context)?.setSelectedIndex(3);
              },
            ),
            const SizedBox(height: 16),
            _buildForumPost(),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AppLocalizations l10n) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primaryAlpha(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Image.asset(
                'assets/images/icon.png',
                width: 24,
                height: 24,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              l10n.appName,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.text,
              ),
            ),
          ],
        ),
        Row(
          children: [
            IconButton(
              onPressed: () => _openQRScanner(l10n),
              icon: Icon(
                Icons.qr_code_scanner,
                color: AppColors.textAlpha(0.6),
              ),
            ),
            Stack(
              children: [
                IconButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const AppointmentNotificationPage(),
                      ),
                    );
                  },
                  icon: const Icon(
                    Icons.notifications_none_outlined,
                    color: AppColors.text,
                  ),
                ),
                if (_hasUnreadNotifications)
                  Positioned(
                    right: 12,
                    top: 12,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildUserInfo(AppLocalizations l10n) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        final String displayName =
            (user?.fullName != null && user!.fullName.trim().isNotEmpty)
            ? user.fullName
            : l10n.user;

        return Row(
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary,
                    AppColors.secondary,
                  ],
                ),
              ),
              child: ClipOval(
                child: (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty)
                    ? CachedNetworkImage(
                        imageUrl: ImageHelper.getThumbnailUrl(user.avatarUrl!),
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => Image.asset(
                          'assets/images/cho_phoc_soc.png',
                          fit: BoxFit.cover,
                        ),
                      )
                    : Image.asset(
                        'assets/images/cho_phoc_soc.png',
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                      ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${l10n.hello}, $displayName!',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.howIsPetToday,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.text,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPetList(AppLocalizations l10n) {
    return Selector<PetProvider, List<Pet>>(
      selector: (_, provider) => provider.myPets,
      builder: (context, myPets, child) {
        final pets = List<Pet>.from(
          myPets,
        )..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

        return SizedBox(
          height: 90,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: pets.length + 1,
            itemBuilder: (context, index) {
              if (index == pets.length) {
                return _buildAddPetButton(l10n);
              }

              final pet = pets[index];
              return GestureDetector(
                onTap: () => _onPetTapped(pet),
                child: Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: _buildPetItem(pet.name, pet.avatar, index == 0),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _onPetTapped(Pet pet) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
    );

    try {
      final provider = context.read<PetProvider>();
      await provider.fetchSpecies();
      if (pet.breed?.speciesId != null) {
        await provider.fetchBreeds(pet.breed!.speciesId);
      }

      if (!mounted) return;
      Navigator.pop(context);

      final result = await Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => EditPetPage(pet: pet)),
      );

      if (result == true) {
        provider.fetchMyPets();
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
    }
  }

  Widget _buildAddPetButton(AppLocalizations l10n) {
    return GestureDetector(
      onTap: () async {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const AddPetPage()),
        );
        if (!mounted) return;
        if (result == true) {
          context.read<PetProvider>().fetchMyPets();
        }
      },
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.secondary,
              boxShadow: [
                BoxShadow(
                  color: AppColors.textAlpha(0.05),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Icon(Icons.add, color: AppColors.textAlpha(0.55)),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.addNew,
            style: TextStyle(fontSize: 12, color: AppColors.textAlpha(0.55)),
          ),
        ],
      ),
    );
  }

  Widget _buildPetItem(String name, String? imageUrl, bool isActive) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? AppColors.primary : AppColors.transparent,
              width: 2,
            ),
          ),
          child: ClipOval(
            child: Container(
              width: 56,
              height: 56,
              color: AppColors.border,
              child: (imageUrl != null && imageUrl.startsWith('http'))
                  ? CachedNetworkImage(
                      imageUrl: ImageHelper.getThumbnailUrl(imageUrl),
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) => Center(
                        child: Icon(
                          Icons.pets,
                          color: AppColors.textAlpha(0.5),
                          size: 28,
                        ),
                      ),
                      placeholder: (context, url) => const Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                    )
                  : Center(
                      child: Icon(
                        Icons.pets,
                        color: AppColors.textAlpha(0.5),
                        size: 28,
                      ),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(AppLocalizations l10n) {
    return Column(
      children: [
        _buildActionTile(
          Icons.calendar_month,
          l10n.quickBooking,
          l10n.quickBookingSub,
          AppColors.primaryAlpha(0.1),
          AppColors.primary,
          onTap: () {
            MainNavigationWrapper.of(context)?.setSelectedIndex(1);
          },
        ),
        const SizedBox(height: 12),
        _buildActionTile(
          Icons.smart_toy_outlined,
          l10n.aiChatbot,
          l10n.aiChatbotSub,
          AppColors.textAlpha(0.06),
          AppColors.text,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ChatPage()),
            );
          },
        ),
        const SizedBox(height: 12),
        _buildActionTile(
          Icons.location_on_outlined,
          l10n.findClinic,
          l10n.findClinicSub,
          AppColors.successAlpha(0.12),
          AppColors.success,
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Developing...'),
                duration: Duration(seconds: 2),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildActionTile(
    IconData icon,
    String title,
    String sub,
    Color bg,
    Color iconColor, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textAlpha(0.6),
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.textAlpha(0.5)),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(
    String title,
    String action, {
    VoidCallback? onTap,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        GestureDetector(
          onTap: onTap,
          child: Text(
            action,
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAppointmentSection(AppLocalizations l10n) {
    return Consumer<AppointmentProvider>(
      builder: (context, provider, child) {
        final topUpcoming = provider.upcomingAppointments.take(2).toList();

        if (provider.isLoading && provider.appointments.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 28),
            decoration: BoxDecoration(
              color: AppColors.secondary,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.textAlpha(0.03),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }

        if (provider.errorMessage != null && topUpcoming.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.secondary,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.textAlpha(0.03),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.failed,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: provider.fetchAppointments,
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: EdgeInsets.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    l10n.retry,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          );
        }

        if (topUpcoming.isEmpty) {
          return _buildEmptyAppointmentCard(l10n);
        }

        return Column(
          children: [
            for (int i = 0; i < topUpcoming.length; i++) ...[
              _buildHomeAppointmentCard(
                topUpcoming[i],
                l10n,
                isActionDisabled: provider.isLoading,
              ),
              if (i != topUpcoming.length - 1) const SizedBox(height: 12),
            ],
          ],
        );
      },
    );
  }

  Widget _buildEmptyAppointmentCard(AppLocalizations l10n) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.secondary,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.textAlpha(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.appointmentEmptyUpcomingTitle,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            l10n.appointmentEmptyUpcomingDescription,
            style: const TextStyle(
              fontSize: 13,
              height: 1.4,
              color: AppColors.textGrey,
            ),
          ),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: _openBookingTab,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.add_circle_outline, size: 18),
            label: Text(
              l10n.appointmentBookNow,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeAppointmentCard(
    Appointment appointment,
    AppLocalizations l10n, {
    required bool isActionDisabled,
  }) {
    final bool canCancel = appointment.status == AppointmentStatusEnum.BOOKED;
    final appointmentStatus = appointment.status;
    final serviceName =
        ServiceEnum.fromValue(
          appointment.service,
        )?.getTranslatedName(context) ??
        appointment.service;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.textAlpha(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: _openAppointmentsTab,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child:
                        appointment.pet.avatar != null &&
                            appointment.pet.avatar!.isNotEmpty
                        ? Image.network(
                            appointment.pet.avatar!,
                            width: 70,
                            height: 70,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                Container(
                                  width: 70,
                                  height: 70,
                                  color: AppColors.background,
                                  child: const Icon(
                                    Icons.pets,
                                    color: AppColors.iconGrey,
                                  ),
                                ),
                          )
                        : Container(
                            width: 70,
                            height: 70,
                            color: AppColors.background,
                            child: const Icon(
                              Icons.pets,
                              color: AppColors.iconGrey,
                            ),
                          ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                appointment.pet.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textDark,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            _buildHomeStatusBadge(appointmentStatus),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          serviceName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textGrey,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildAppointmentMetaRow(
                          Icons.calendar_today_outlined,
                          '${DateFormat('dd/MM/yyyy').format(appointment.appointmentDate)} • ${appointment.appointmentTime}',
                        ),
                        const SizedBox(height: 6),
                        _buildAppointmentMetaRow(
                          Icons.medical_services_outlined,
                          '${l10n.doctor}: ${appointment.veterinarian.fullName}',
                        ),
                        const SizedBox(height: 6),
                        _buildAppointmentMetaRow(
                          Icons.location_on_outlined,
                          appointment.clinic.address,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(
              height: 1,
              indent: 16,
              endIndent: 16,
              color: AppColors.divider,
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: _buildHomeActionButton(
                      label: l10n.viewDetail,
                      icon: Icons.visibility_outlined,
                      onPressed: isActionDisabled ? null : _openAppointmentsTab,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildHomeActionButton(
                      label: l10n.cancelAppointment,
                      icon: Icons.close_rounded,
                      isDestructive: true,
                      onPressed: (!isActionDisabled && canCancel)
                          ? () => _confirmCancelFromHome(appointment.id, l10n)
                          : null,
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

  Widget _buildHomeStatusBadge(AppointmentStatusEnum status) {
    Color bgColor;
    Color textColor;

    switch (status) {
      case AppointmentStatusEnum.BOOKED:
        bgColor = AppColors.primaryAlpha(0.12);
        textColor = AppColors.primary;
        break;
      case AppointmentStatusEnum.IN_PROGRESS:
        bgColor = AppColors.textAlpha(0.12);
        textColor = AppColors.text;
        break;
      case AppointmentStatusEnum.COMPLETED:
        bgColor = AppColors.successAlpha(0.12);
        textColor = AppColors.success;
        break;
      case AppointmentStatusEnum.CANCELLED:
        bgColor = AppColors.errorAlpha(0.12);
        textColor = AppColors.error;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.getTranslatedName(context).toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildHomeActionButton({
    required String label,
    required IconData icon,
    required VoidCallback? onPressed,
    bool isDestructive = false,
  }) {
    final backgroundColor = isDestructive
        ? AppColors.errorAlpha(0.12)
        : AppColors.primaryAlpha(0.12);
    final foregroundColor = isDestructive ? AppColors.error : AppColors.primary;

    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 17),
      label: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
      style: ElevatedButton.styleFrom(
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 11),
        backgroundColor: backgroundColor,
        foregroundColor: foregroundColor,
        disabledBackgroundColor: AppColors.background,
        disabledForegroundColor: AppColors.textAlpha(0.45),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildAppointmentMetaRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textGrey),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12, color: AppColors.textGrey),
          ),
        ),
      ],
    );
  }

  void _openBookingTab() {
    MainNavigationWrapper.of(context)?.setSelectedIndex(1);
  }

  void _openAppointmentsTab() {
    MainNavigationWrapper.of(context)?.setSelectedIndex(2);
  }

  Future<void> _confirmCancelFromHome(
    String appointmentId,
    AppLocalizations l10n,
  ) async {
    final shouldCancel = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(l10n.confirmCancel),
        content: Text(l10n.cancelMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(
              l10n.no,
              style: const TextStyle(color: AppColors.textGrey),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(
              l10n.yes,
              style: const TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );

    if (shouldCancel != true || !mounted) return;

    final success = await context.read<AppointmentProvider>().cancelAppointment(
      appointmentId,
    );
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success ? l10n.success : l10n.failed),
        backgroundColor: success ? AppColors.success : AppColors.error,
      ),
    );
  }

  Widget _buildForumPost() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.secondary,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.textAlpha(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CachedNetworkImage(
                imageUrl: 'https://i.pravatar.cc/150?u=woman1',
                imageBuilder: (context, imageProvider) =>
                    CircleAvatar(radius: 18, backgroundImage: imageProvider),
                placeholder: (context, url) => const CircleAvatar(
                  radius: 18,
                  child: SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                errorWidget: (context, url, error) => const CircleAvatar(
                  radius: 18,
                  child: Icon(Icons.person, size: 18),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Lan Huong",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      "2h ago • Cat Experience",
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textAlpha(0.55),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            "Any tips for kidney stones in cats?",
            style: TextStyle(fontSize: 13, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class QRScannerScreen extends StatefulWidget {
  final Function(String) onScan;
  const QRScannerScreen({super.key, required this.onScan});
  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen>
    with SingleTickerProviderStateMixin {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  late AnimationController _animationController;
  final double verticalOffset = -60;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    controller.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size.width * 0.7;
    return Scaffold(
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              for (final barcode in capture.barcodes) {
                if (barcode.rawValue != null) {
                  widget.onScan(barcode.rawValue!);
                  break;
                }
              }
            },
          ),
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return CustomPaint(
                  painter: ScannerOverlayPainter(
                    scanBoxSize: size,
                    offset: verticalOffset,
                    scanPosition: _animationController.value,
                  ),
                );
              },
            ),
          ),
          Positioned(
            top: 40,
            left: 10,
            child: IconButton(
              icon: const Icon(
                Icons.arrow_back,
                color: AppColors.secondary,
                size: 30,
              ),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          Positioned(
            top: 40,
            right: 10,
            child: IconButton(
              icon: const Icon(Icons.flash_on, color: AppColors.secondary),
              onPressed: () => controller.toggleTorch(),
            ),
          ),
        ],
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  final double scanBoxSize;
  final double offset;
  final double scanPosition;

  ScannerOverlayPainter({
    required this.scanBoxSize,
    required this.offset,
    required this.scanPosition,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPaint = Paint()
      ..color = AppColors.textAlpha(0.5);
    final center = Offset(size.width / 2, size.height / 2 + offset);
    final scanRect = Rect.fromCenter(
      center: center,
      width: scanBoxSize,
      height: scanBoxSize,
    );

    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height)),
        Path()..addRRect(
          RRect.fromRectAndRadius(scanRect, const Radius.circular(20)),
        ),
      ),
      backgroundPaint,
    );

    final borderPaint = Paint()
      ..color = AppColors.secondary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;
    final path = Path();
    const cornerLen = 25.0;

    path.moveTo(scanRect.left, scanRect.top + cornerLen);
    path.lineTo(scanRect.left, scanRect.top);
    path.lineTo(scanRect.left + cornerLen, scanRect.top);

    path.moveTo(scanRect.right - cornerLen, scanRect.top);
    path.lineTo(scanRect.right, scanRect.top);
    path.lineTo(scanRect.right, scanRect.top + cornerLen);

    path.moveTo(scanRect.left, scanRect.bottom - cornerLen);
    path.lineTo(scanRect.left, scanRect.bottom);
    path.lineTo(scanRect.left + cornerLen, scanRect.bottom);

    path.moveTo(scanRect.right - cornerLen, scanRect.bottom);
    path.lineTo(scanRect.right, scanRect.bottom);
    path.lineTo(scanRect.right, scanRect.bottom - cornerLen);

    canvas.drawPath(path, borderPaint);

    final linePaint = Paint()
      ..shader =
          LinearGradient(
            colors: [
              AppColors.secondary.withValues(alpha: 0),
              AppColors.secondary,
              AppColors.secondary.withValues(alpha: 0),
            ],
          ).createShader(
            Rect.fromLTWH(
              scanRect.left,
              scanRect.top + (scanBoxSize * scanPosition),
              scanBoxSize,
              2,
            ),
          )
      ..strokeWidth = 2;
    canvas.drawLine(
      Offset(scanRect.left + 10, scanRect.top + (scanBoxSize * scanPosition)),
      Offset(scanRect.right - 10, scanRect.top + (scanBoxSize * scanPosition)),
      linePaint,
    );
  }

  @override
  bool shouldRepaint(covariant ScannerOverlayPainter oldDelegate) =>
      oldDelegate.scanPosition != scanPosition;
}
