import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/enums/service_enum.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/app_notifier.dart';
import '../../../../features/pet/data/models/pet_models.dart';
import '../../../../features/pet/presentation/provider/pet_provider.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../clinic/presentation/clinic_detail_page.dart';
import '../../main_navigation/presentation/main_navigation_wrapper.dart';
import 'provider/booking_provider.dart';
import 'widget/step_clinic_selector.dart';
import 'widget/step_doctor_selector.dart';
import 'widget/step_indicator.dart';
import 'widget/step_pet_selector.dart';
import 'widget/step_service_selector.dart';
import 'widget/step_success.dart';
import 'widget/step_summary.dart';
import 'widget/step_time_selector.dart';

class BookingPage extends StatefulWidget {
  const BookingPage({super.key});

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  int _currentStep = 0;

  final List<ServiceEnum> _services = ServiceEnum.values;

  late final List<DateTime> _availableDates;

  final ScrollController _clinicScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _availableDates = List.generate(
      7,
      (index) => DateTime.now().add(Duration(days: index)),
    );

    _clinicScrollController.addListener(_onClinicScroll);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<PetProvider>().fetchMyPets();
        final bp = context.read<BookingProvider>();
        bp.fetchClinics().then((_) => _handleLocationOutcome(bp));
        if (bp.selectedDate == null) {
          bp.selectDate(_availableDates[0]);
        }
      }
    });
  }

  Future<void> _handleLocationOutcome(BookingProvider bp) async {
    if (!mounted || !bp.isLocationDefault) return;

    final l10n = AppLocalizations.of(context)!;

    switch (bp.locationReason) {
      case LocationFailureReason.serviceDisabled:
        // Cứng hơn SnackBar: yêu cầu user mở Location Services lên trên thiết bị.
        // Sau khi user quay lại, retry để re-fetch với vị trí thật.
        await _showLocationServiceDialog(bp, l10n);
        break;
      case LocationFailureReason.permissionPermanentlyDenied:
        await _showOpenAppSettingsDialog(bp, l10n);
        break;
      case LocationFailureReason.permissionDenied:
      case LocationFailureReason.unknown:
      case LocationFailureReason.none:
        AppNotifier.showInfo(context, l10n.locationFallbackNotice);
        break;
    }
  }

  Future<void> _showLocationServiceDialog(
    BookingProvider bp,
    AppLocalizations l10n,
  ) async {
    final opened = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.locationServiceDisabledTitle),
        content: Text(l10n.locationServiceDisabledMessage),
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
    if (opened == true) {
      await bp.locationService.openLocationSettings();
      // User quay lại app — retry. Nếu vẫn fail thì handler sẽ gọi lại dialog.
      if (!mounted) return;
      await bp.retryLocation();
      _handleLocationOutcome(bp);
    } else {
      AppNotifier.showInfo(context, l10n.locationFallbackNotice);
    }
  }

  Future<void> _showOpenAppSettingsDialog(
    BookingProvider bp,
    AppLocalizations l10n,
  ) async {
    final opened = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.locationPermissionDeniedTitle),
        content: Text(l10n.locationPermissionDeniedMessage),
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
    if (opened == true) {
      await bp.locationService.openAppSettings();
      if (!mounted) return;
      await bp.retryLocation();
      _handleLocationOutcome(bp);
    } else {
      AppNotifier.showInfo(context, l10n.locationFallbackNotice);
    }
  }

  @override
  void dispose() {
    _clinicScrollController.removeListener(_onClinicScroll);
    _clinicScrollController.dispose();
    super.dispose();
  }

  void _onClinicScroll() {
    if (_currentStep != 0) return;
    if (!_clinicScrollController.hasClients) return;

    final position = _clinicScrollController.position;
    if (position.maxScrollExtent <= 0) return;

    if (position.pixels >= position.maxScrollExtent * 0.8) {
      context.read<BookingProvider>().loadMoreClinics();
    }
  }

  void _nextStep(AppLocalizations l10n) async {
    final bookingProvider = context.read<BookingProvider>();

    if (_currentStep == 0 && bookingProvider.selectedClinic == null) {
      _showError(l10n.validChooseClinic);
      return;
    }
    if (_currentStep == 1 && bookingProvider.selectedPetId == null) {
      _showError(l10n.validChoosePet);
      return;
    }
    if (_currentStep == 2) {
      if (bookingProvider.selectedServiceName == null) {
        _showError(l10n.validChooseService);
        return;
      }
      if (bookingProvider.symptomsNote == null ||
          bookingProvider.symptomsNote!.trim().isEmpty) {
        _showError(l10n.validEnterNote);
        return;
      }
    }
    if (_currentStep == 3 && bookingProvider.selectedDoctor == null) {
      _showError(l10n.validChooseDoctor);
      return;
    }
    if (_currentStep == 4) {
      if (bookingProvider.selectedDate == null) {
        bookingProvider.setDefaultDate(_availableDates[0]);
      }
      if (bookingProvider.selectedTime == null) {
        _showError(l10n.validChooseTime);
        return;
      }
    }

    if (_currentStep < 5) {
      setState(() => _currentStep++);
    } else {
      final success = await bookingProvider.confirmAppointment();
      if (success) {
        setState(() => _currentStep = 6);
      } else {
        _showError(_resolveBookingError(bookingProvider.errorMessage, l10n));
      }
    }
  }

  String _resolveBookingError(String? errorKey, AppLocalizations l10n) {
    switch (errorKey) {
      case 'bookingErrorCompleteAllSteps':
        return l10n.bookingErrorCompleteAllSteps;
      default:
        return errorKey ?? l10n.failed;
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    AppNotifier.showError(
      context,
      msg,
      duration: const Duration(milliseconds: 2500),
    );
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      if (Navigator.canPop(context)) {
        context.read<BookingProvider>().reset();
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isSuccess = _currentStep == 6;
    final List<String> steps = [
      l10n.stepClinic,
      l10n.stepPet,
      l10n.stepService,
      l10n.stepDoctor,
      l10n.stepTime,
    ];

    return PopScope(
      canPop: _currentStep == 0 && Navigator.canPop(context),
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          if (_currentStep == 0) {
            context.read<BookingProvider>().reset();
          }
          return;
        }
        if (isSuccess) {
          _closeSuccessAndGoToAppointments(context.read<BookingProvider>());
          return;
        }
        _previousStep();
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.appBarBackground,
          elevation: 0,
          centerTitle: true,
          automaticallyImplyLeading: false,
          leading: isSuccess
              ? const SizedBox()
              : IconButton(
                  icon: Icon(
                    _currentStep == 0 ? Icons.close : Icons.arrow_back,
                    color: AppColors.textDark,
                  ),
                  onPressed: _currentStep == 0
                      ? () => Navigator.pop(context)
                      : _previousStep,
                ),
          title: Text(
            l10n.bookingTitle,
            style: const TextStyle(
              color: AppColors.textDark,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
        ),
        body: Column(
          children: [
            StepIndicator(
              currentStep: _currentStep > 4 ? 4 : _currentStep,
              steps: steps,
              isSuccess: isSuccess,
              onStepTapped: (index) {
                if (index < _currentStep) {
                  setState(() => _currentStep = index);
                }
              },
            ),
            Expanded(child: _buildMainContent(l10n)),
          ],
        ),
        bottomNavigationBar: _buildBottomSection(l10n),
      ),
    );
  }

  Widget _buildMainContent(AppLocalizations l10n) {
    final bookingProvider = context.watch<BookingProvider>();
    final petProvider = context.watch<PetProvider>();

    if (_currentStep == 6) {
      final selectedPet = _findSelectedPet(bookingProvider, petProvider);
      final res = bookingProvider.appointmentResult;
      final rawService =
          _firstNonBlank([
            _readNestedString(res, const ['service']),
            bookingProvider.selectedServiceName,
          ]) ??
          '';
      final translatedService =
          ServiceEnum.fromValue(rawService)?.getTranslatedName(context) ??
          rawService;
      final rawAppointmentTime =
          _firstNonBlank([
            _readNestedString(res, const ['appointmentTime']),
            bookingProvider.selectedTime,
          ]) ??
          '';
      final appointmentDate =
          DateTime.tryParse(
            _firstNonBlank([
                  _readNestedString(res, const ['appointmentDate']),
                  bookingProvider.selectedDate?.toIso8601String(),
                ]) ??
                '',
          ) ??
          bookingProvider.selectedDate ??
          DateTime.now();

      final petName =
          _firstNonBlank([
            _readNestedString(res, const ['pet', 'name']),
            bookingProvider.selectedPetName,
            selectedPet?.name,
          ]) ??
          l10n.stepPet;

      final clinicName =
          _firstNonBlank([
            _readNestedString(res, const ['clinic', 'name']),
            bookingProvider.selectedClinic?.name,
          ]) ??
          '';

      final doctorName =
          _firstNonBlank([
            _readNestedString(res, const ['veterinarian', 'user', 'fullName']),
            _readNestedString(res, const ['veterinarian', 'fullName']),
            bookingProvider.selectedDoctor?.user.fullName,
          ]) ??
          '';

      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: StepSuccess(
          petName: petName,
          clinicName: clinicName,
          serviceName: translatedService,
          doctorName: doctorName,
          time: _formatAppointmentTime(rawAppointmentTime),
          date: appointmentDate,
        ),
      );
    }

    if (_currentStep == 5) {
      final pet = _findSelectedPet(bookingProvider, petProvider);

      final rawService = bookingProvider.selectedServiceName ?? '';
      final translatedService =
          ServiceEnum.fromValue(rawService)?.getTranslatedName(context) ??
          rawService;

      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: StepSummary(
          petName: pet?.name ?? bookingProvider.selectedPetName ?? l10n.stepPet,
          clinicName: bookingProvider.selectedClinic?.name ?? '',
          serviceName: translatedService,
          doctorName: bookingProvider.selectedDoctor?.user.fullName ?? '',
          time: bookingProvider.selectedTime ?? '',
          date: bookingProvider.selectedDate ?? DateTime.now(),
        ),
      );
    }

    return CustomScrollView(
      key: ValueKey(_currentStep),
      controller: _currentStep == 0 ? _clinicScrollController : null,
      slivers: [
        _buildStepHeaderSliver(l10n),
        _buildStepContentSliver(),
        const SliverToBoxAdapter(child: SizedBox(height: 50)),
      ],
    );
  }

  String? _firstNonBlank(List<String?> values) {
    for (final value in values) {
      if (value == null) {
        continue;
      }
      final normalized = value.trim();
      if (normalized.isNotEmpty) {
        return normalized;
      }
    }
    return null;
  }

  String? _readNestedString(Map<String, dynamic>? source, List<String> path) {
    dynamic current = source;

    for (final segment in path) {
      if (current is Map && current.containsKey(segment)) {
        current = current[segment];
      } else {
        return null;
      }
    }

    if (current == null) {
      return null;
    }

    final value = current.toString().trim();
    return value.isEmpty ? null : value;
  }

  Pet? _findSelectedPet(
    BookingProvider bookingProvider,
    PetProvider petProvider,
  ) {
    final selectedPetId = bookingProvider.selectedPetId;
    if (selectedPetId == null) {
      return null;
    }

    for (final pet in petProvider.myPets) {
      if (pet.id == selectedPetId) {
        return pet;
      }
    }

    return null;
  }

  String _formatAppointmentTime(String rawTime) {
    final normalized = rawTime.trim();
    if (normalized.isEmpty) {
      return '';
    }

    final parts = normalized.split(':');
    if (parts.length >= 2) {
      final hour = int.tryParse(parts[0].trim());
      final minute = int.tryParse(parts[1].trim());

      if (hour != null && minute != null) {
        return '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
      }
    }

    return normalized;
  }

  void _closeSuccessAndGoToAppointments(BookingProvider bookingProvider) {
    bookingProvider.reset();

    if (mounted) {
      setState(() => _currentStep = 0);
    }

    MainNavigationWrapper.activeState?.setSelectedIndex(1);

    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  Widget _buildStepContentSliver() {
    final bookingProvider = context.watch<BookingProvider>();
    final petProvider = context.watch<PetProvider>();

    Widget content;
    switch (_currentStep) {
      case 0:
        if (bookingProvider.isLoading && bookingProvider.clinics.isEmpty) {
          return const SliverFillRemaining(
            child: Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }
        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: StepClinicSelector(
            selectedClinicId: bookingProvider.selectedClinic?.id,
            onSelected: (clinic) => bookingProvider.selectClinic(clinic),
            onViewDetail: (clinic) {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ClinicDetailPage(clinic: clinic),
                ),
              );
            },
            clinics: bookingProvider.clinics,
            isLoadingMore: bookingProvider.isLoadingMoreClinics,
            hasMore: bookingProvider.hasMoreClinics,
          ),
        );
      case 1:
        if (petProvider.isLoading) {
          content = const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        } else {
          content = StepPetSelector(
            selectedPetId: bookingProvider.selectedPetId,
            onSelected: (pet) =>
                bookingProvider.selectPet(pet.id, petName: pet.name),
            pets: petProvider.myPets,
          );
        }
        break;
      case 2:
        content = StepServiceSelector(
          selectedServiceName: bookingProvider.selectedServiceName,
          onSelected: (s) => bookingProvider.selectService(s),
          services: _services,
          onSymptomsChanged: (v) => bookingProvider.setSymptomsNote(v),
          symptoms: bookingProvider.symptomsNote,
        );
        break;
      case 3:
        if (bookingProvider.isDoctorsLoading) {
          return const SliverFillRemaining(
            child: Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }
        content = StepDoctorSelector(
          selectedDoctorId: bookingProvider.selectedDoctor?.userId,
          selectedDoctor: bookingProvider.selectedDoctor,
          selectedDoctorAccount: bookingProvider.selectedDoctorAccount,
          isDoctorAccountLoading: bookingProvider.isDoctorAccountLoading,
          onSelected: (doc) => bookingProvider.selectDoctor(doc),
          doctors: bookingProvider.doctors,
        );
        break;
      case 4:
        int dateIdx = bookingProvider.selectedDate != null
            ? _availableDates.indexWhere(
                (d) => d.day == bookingProvider.selectedDate!.day,
              )
            : 0;
        if (dateIdx == -1) dateIdx = 0;

        content = StepTimeSelector(
          selectedDateIndex: dateIdx,
          onDateSelected: (i) => bookingProvider.selectDate(_availableDates[i]),
          selectedTime: bookingProvider.selectedTime,
          onTimeSelected: (t) => bookingProvider.selectTime(t),
          availableDates: _availableDates,
        );
        break;
      default:
        content = const SizedBox.shrink();
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverToBoxAdapter(child: content),
    );
  }

  Widget _buildStepHeaderSliver(AppLocalizations l10n) {
    final titles = [
      l10n.stepClinic,
      l10n.choosePet,
      l10n.stepService,
      l10n.stepDoctor,
      l10n.stepTime,
    ];
    final subs = [
      l10n.bookingClinicSub,
      l10n.choosePetSub,
      l10n.bookingServiceSub,
      l10n.bookingDoctorSub,
      l10n.bookingTimeSub,
    ];

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      sliver: SliverToBoxAdapter(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              titles[_currentStep],
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subs[_currentStep],
              style: const TextStyle(fontSize: 13, color: AppColors.textGrey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomSection(AppLocalizations l10n) {
    final bookingProvider = context.watch<BookingProvider>();
    final isSuccess = _currentStep == 6;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 54,
        child: ElevatedButton(
          onPressed: bookingProvider.isLoading
              ? null
              : (isSuccess
                    ? () => _closeSuccessAndGoToAppointments(bookingProvider)
                    : () => _nextStep(l10n)),
          style: ElevatedButton.styleFrom(
            backgroundColor: isSuccess ? AppColors.surface : AppColors.primary,
            foregroundColor: isSuccess
                ? AppColors.primary
                : AppColors.onPrimary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(27),
            ),
            side: isSuccess
                ? const BorderSide(color: AppColors.primary)
                : BorderSide.none,
            elevation: 0,
          ),
          child: bookingProvider.isLoading
              ? const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    color: AppColors.onPrimary,
                    strokeWidth: 2,
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      isSuccess
                          ? l10n.close
                          : (_currentStep == 5
                                ? l10n.confirmAppointment
                                : l10n.continueBtn),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (!isSuccess && _currentStep < 5) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward, size: 20),
                    ],
                  ],
                ),
        ),
      ),
    );
  }
}
