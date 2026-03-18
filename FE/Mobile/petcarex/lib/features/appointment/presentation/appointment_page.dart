import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/enums/appointment_status_enum.dart';
import '../../../../core/enums/service_enum.dart';
import '../../../../core/enums/veterinary_specialty_enum.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../main_navigation/presentation/main_navigation_wrapper.dart';
import '../data/appointment_model.dart';
import 'provider/appointment_provider.dart';

class AppointmentPage extends StatefulWidget {
  const AppointmentPage({super.key});

  @override
  State<AppointmentPage> createState() => _AppointmentPageState();
}

class _AppointmentPageState extends State<AppointmentPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppointmentProvider>().fetchAppointments();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.appBarBackground,
        elevation: 0,
        centerTitle: true,
        title: Text(
          l10n.appointmentsTitle,
          style: const TextStyle(
            color: AppColors.textDark,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textGrey,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: [
            Tab(text: l10n.upcoming),
            Tab(text: l10n.history),
          ],
        ),
      ),
      body: Consumer<AppointmentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    provider.errorMessage ?? l10n.failed,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.fetchAppointments(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                    ),
                    child: Text(
                      l10n.explore,
                      style: const TextStyle(color: AppColors.onPrimary),
                    ),
                  ),
                ],
              ),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildAppointmentList(
                provider.upcomingAppointments,
                isUpcoming: true,
                l10n: l10n,
              ),
              _buildAppointmentList(
                provider.historicalAppointments,
                isUpcoming: false,
                l10n: l10n,
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAppointmentList(
    List<Appointment> appointments, {
    required bool isUpcoming,
    required AppLocalizations l10n,
  }) {
    if (appointments.isEmpty) {
      return RefreshIndicator(
        onRefresh: () =>
            context.read<AppointmentProvider>().fetchAppointments(),
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: _buildEmptyState(
                    isUpcoming: isUpcoming,
                    l10n: l10n,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<AppointmentProvider>().fetchAppointments(),
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          return _buildAppointmentCard(appointments[index], isUpcoming, l10n);
        },
      ),
    );
  }

  Widget _buildEmptyState({
    required bool isUpcoming,
    required AppLocalizations l10n,
  }) {
    final title = isUpcoming
        ? l10n.appointmentEmptyUpcomingTitle
        : l10n.appointmentEmptyHistoryTitle;
    final description = isUpcoming
        ? l10n.appointmentEmptyUpcomingDescription
        : l10n.appointmentEmptyHistoryDescription;
    final icon = isUpcoming
        ? Icons.event_available_outlined
        : Icons.history_toggle_off_outlined;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
          ),
          child: Icon(icon, size: 42, color: AppColors.primary),
        ),
        const SizedBox(height: 18),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textDark,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          description,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textGrey,
            fontSize: 14,
            height: 1.4,
          ),
        ),
        if (isUpcoming) ...[
          const SizedBox(height: 22),
          ElevatedButton.icon(
            onPressed: _openBookingPage,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.add_circle_outline, size: 18),
            label: Text(
              l10n.appointmentBookNow,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ],
    );
  }

  void _openBookingPage() {
    MainNavigationWrapper.of(context)?.setSelectedIndex(1);
  }

  Widget _buildAppointmentCard(
    Appointment item,
    bool isUpcoming,
    AppLocalizations l10n,
  ) {
    final appointmentStatus = AppointmentStatusEnum.fromValue(item.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isUpcoming
              ? AppColors.primary.withValues(alpha: 0.3)
              : AppColors.divider,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => _showAppointmentDetails(context, item, l10n),
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
                        item.pet.avatar != null && item.pet.avatar!.isNotEmpty
                        ? Image.network(
                            item.pet.avatar!,
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
                            Text(
                              item.pet.name,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textDark,
                              ),
                            ),
                            _buildStatusBadge(item.status),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          ServiceEnum.fromValue(
                                item.service,
                              )?.getTranslatedName(context) ??
                              item.service,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textGrey,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildInfoRow(
                          Icons.calendar_today_outlined,
                          '${DateFormat('dd/MM/yyyy').format(item.appointmentDate)} • ${item.appointmentTime}',
                        ),
                        const SizedBox(height: 6),
                        _buildInfoRow(
                          Icons.medical_services_outlined,
                          '${l10n.doctor}: ${item.veterinarian.fullName}',
                        ),
                        const SizedBox(height: 6),
                        _buildInfoRow(
                          Icons.location_on_outlined,
                          item.clinic.address,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (isUpcoming &&
                appointmentStatus == AppointmentStatusEnum.BOOKED) ...[
              const Divider(
                height: 1,
                indent: 16,
                endIndent: 16,
                color: AppColors.divider,
              ),
              InkWell(
                onTap: () => _confirmCancel(item.id, l10n),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Center(
                    child: Text(
                      l10n.cancelAppointment,
                      style: const TextStyle(
                        color: AppColors.error,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ),
            ] else if (!isUpcoming) ...[
              const Divider(
                height: 1,
                indent: 16,
                endIndent: 16,
                color: AppColors.divider,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Text(
                  l10n.explore,
                  style: const TextStyle(
                    color: AppColors.textGrey,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showAppointmentDetails(
    BuildContext context,
    Appointment item,
    AppLocalizations l10n,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            top: 16,
            left: 20,
            right: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.divider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    l10n.appointmentDetail,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                  _buildStatusBadge(item.status),
                ],
              ),
              const SizedBox(height: 20),

              Text(
                l10n.petInformation,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textGrey,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundImage:
                        (item.pet.avatar != null && item.pet.avatar!.isNotEmpty)
                        ? NetworkImage(item.pet.avatar!)
                        : null,
                    backgroundColor: AppColors.background,
                    child: (item.pet.avatar == null || item.pet.avatar!.isEmpty)
                        ? const Icon(Icons.pets, color: AppColors.iconGrey)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.pet.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppColors.textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${l10n.breed}: ${item.pet.breedName}',
                        style: const TextStyle(
                          color: AppColors.textGrey,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const Divider(height: 30, color: AppColors.divider),

              Text(
                l10n.serviceInfo,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textGrey,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              _buildDetailRow(
                Icons.medical_information_outlined,
                '${l10n.service}:',
                ServiceEnum.fromValue(
                      item.service,
                    )?.getTranslatedName(context) ??
                    item.service,
              ),
              const SizedBox(height: 8),
              _buildDetailRow(
                Icons.calendar_month_outlined,
                '${l10n.time}:',
                '${item.appointmentTime} - ${DateFormat('dd/MM/yyyy').format(item.appointmentDate)}',
              ),
              if (item.note.isNotEmpty) ...[
                const SizedBox(height: 8),
                _buildDetailRow(
                  Icons.notes_outlined,
                  '${l10n.note}:',
                  item.note,
                ),
              ],
              const Divider(height: 30, color: AppColors.divider),

              Text(
                l10n.doctorInfo,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textGrey,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              _buildDetailRow(
                Icons.person_outline,
                '${l10n.doctor}:',
                item.veterinarian.fullName,
              ),
              if (item.veterinarian.specialty.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: _buildDetailRow(
                    Icons.star_border_outlined,
                    '${l10n.specialty}:',
                    VeterinarySpecialtyEnum.fromValue(
                          item.veterinarian.specialty,
                        )?.getTranslatedName(context) ??
                        item.veterinarian.specialty,
                  ),
                ),
              const SizedBox(height: 8),
              _buildDetailRow(
                Icons.store_outlined,
                '${l10n.clinic}:',
                item.clinic.name,
              ),
              const SizedBox(height: 8),
              _buildDetailRow(
                Icons.location_on_outlined,
                '${l10n.address}:',
                item.clinic.address,
              ),

              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: const TextStyle(color: AppColors.textGrey, fontSize: 14),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 14,
              color: AppColors.textDark,
            ),
          ),
        ),
      ],
    );
  }

  void _confirmCancel(String id, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(l10n.confirmCancel),
        content: Text(l10n.cancelMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              l10n.cancel,
              style: const TextStyle(color: AppColors.textGrey),
            ),
          ),
          TextButton(
            onPressed: () async {
              final provider = context.read<AppointmentProvider>();
              Navigator.pop(context);
              final success = await provider.cancelAppointment(id);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(success ? l10n.success : l10n.failed),
                  backgroundColor: success
                      ? AppColors.success
                      : AppColors.error,
                ),
              );
            },
            child: Text(
              l10n.confirmAppointment,
              style: const TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;
    final parsedStatus = AppointmentStatusEnum.fromValue(status);

    switch (parsedStatus) {
      case AppointmentStatusEnum.BOOKED:
        bgColor = AppColors.primaryLight;
        textColor = AppColors.primary;
        label = AppointmentStatusEnum.BOOKED.getTranslatedName(context);
        break;
      case AppointmentStatusEnum.IN_PROGRESS:
        bgColor = AppColors.warning.withValues(alpha: 0.12);
        textColor = AppColors.warning;
        label = AppointmentStatusEnum.IN_PROGRESS.getTranslatedName(context);
        break;
      case AppointmentStatusEnum.COMPLETED:
        bgColor = AppColors.successLight;
        textColor = AppColors.success;
        label = AppointmentStatusEnum.COMPLETED.getTranslatedName(context);
        break;
      case AppointmentStatusEnum.CANCELLED:
        bgColor = AppColors.errorLight;
        textColor = AppColors.error;
        label = AppointmentStatusEnum.CANCELLED.getTranslatedName(context);
        break;
      default:
        bgColor = AppColors.background;
        textColor = AppColors.textGrey;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.iconGrey),
        const SizedBox(width: 8),
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
}
