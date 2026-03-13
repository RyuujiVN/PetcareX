import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart'; // Import mới
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../features/pet/presentation/provider/pet_provider.dart';
import '../../../common/service_enum.dart';
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

  final List<String> _services = ServiceEnum.values.map((e) => e.value).toList();
  
  late final List<DateTime> _availableDates;

  @override
  void initState() {
    super.initState();
    _availableDates = List.generate(
      7,
      (index) => DateTime.now().add(Duration(days: index)),
    );
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PetProvider>().fetchMyPets();
      final bp = context.read<BookingProvider>();
      bp.fetchClinics();
      if (bp.selectedDate == null) {
        bp.selectDate(_availableDates[0]);
      }
    });
  }

  void _nextStep(AppLocalizations l10n) async {
    final bookingProvider = context.read<BookingProvider>();

    if (_currentStep == 0 && bookingProvider.selectedPetId == null) {
      _showError(l10n.choosePet);
      return;
    }
    if (_currentStep == 1 && bookingProvider.selectedClinic == null) {
      _showError(l10n.stepClinic);
      return;
    }
    if (_currentStep == 2) {
      if (bookingProvider.selectedServiceName == null) {
        _showError(l10n.stepService);
        return;
      }
      if (bookingProvider.symptomsNote == null || bookingProvider.symptomsNote!.trim().isEmpty) {
        _showError(l10n.note);
        return;
      }
    }
    if (_currentStep == 3 && bookingProvider.selectedDoctor == null) {
      _showError(l10n.doctor);
      return;
    }
    if (_currentStep == 4) {
      if (bookingProvider.selectedDate == null) {
        bookingProvider.setDefaultDate(_availableDates[0]);
      }
      if (bookingProvider.selectedTime == null) {
        _showError(l10n.time);
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
        _showError(bookingProvider.errorMessage ?? l10n.failed);
      }
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        duration: const Duration(milliseconds: 2500),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isSuccess = _currentStep == 6;
    final List<String> steps = [
      l10n.stepPet,
      l10n.stepClinic,
      l10n.stepService,
      l10n.stepDoctor,
      l10n.stepTime,
    ];

    return PopScope(
      canPop: (_currentStep == 0 && Navigator.canPop(context)) || isSuccess,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _previousStep();
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
          leading: isSuccess || (_currentStep == 0 && !Navigator.canPop(context))
              ? const SizedBox()
              : IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
                  onPressed: _previousStep,
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
            Expanded(
              child: _buildMainContent(l10n),
            ),
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
      final res = bookingProvider.appointmentResult;
      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: StepSuccess(
          petName: res?['pet']?['name'] ?? '',
          clinicName: res?['clinic']?['name'] ?? '',
          serviceName: res?['service'] ?? '',
          doctorName: res?['veterinarian']?['user']?['fullName'] ?? '',
          time: (res?['appointmentTime'] ?? '').toString().substring(0, 5),
          date:
              DateTime.tryParse(res?['appointmentDate'] ?? '') ?? DateTime.now(),
        ),
      );
    }

    if (_currentStep == 5) {
      final pet = petProvider.myPets.any((p) => p.id == bookingProvider.selectedPetId)
          ? petProvider.myPets.firstWhere((p) => p.id == bookingProvider.selectedPetId)
          : null;

      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: StepSummary(
          petName: pet?.name ?? l10n.stepPet,
          clinicName: bookingProvider.selectedClinic?.name ?? '',
          serviceName: bookingProvider.selectedServiceName ?? '',
          doctorName: bookingProvider.selectedDoctor?.user.fullName ?? '',
          time: bookingProvider.selectedTime ?? '',
          date: bookingProvider.selectedDate ?? DateTime.now(),
        ),
      );
    }

    return CustomScrollView(
      key: ValueKey(_currentStep),
      slivers: [
        _buildStepHeaderSliver(l10n),
        _buildStepContentSliver(),
        const SliverToBoxAdapter(child: SizedBox(height: 20)),
      ],
    );
  }

  Widget _buildStepContentSliver() {
    final bookingProvider = context.watch<BookingProvider>();
    final petProvider = context.watch<PetProvider>();

    Widget content;
    switch (_currentStep) {
      case 0:
        if (petProvider.isLoading) {
          content = const Center(child: CircularProgressIndicator());
        } else {
          content = StepPetSelector(
            selectedPetId: bookingProvider.selectedPetId,
            onSelected: (pet) => bookingProvider.selectPet(pet.id),
            pets: petProvider.myPets,
          );
        }
        break;
      case 1:
        if (bookingProvider.isLoading && bookingProvider.clinics.isEmpty) {
          return const SliverFillRemaining(
            child: Center(child: CircularProgressIndicator()),
          );
        }
        content = StepClinicSelector(
          selectedClinicId: bookingProvider.selectedClinic?.id,
          onSelected: (clinic) => bookingProvider.selectClinic(clinic),
          clinics: bookingProvider.clinics,
        );
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
            child: Center(child: CircularProgressIndicator()),
          );
        }
        content = StepDoctorSelector(
          selectedDoctorId: bookingProvider.selectedDoctor?.userId,
          onSelected: (doc) => bookingProvider.selectDoctor(doc),
          doctors: bookingProvider.doctors,
        );
        break;
      case 4:
        int dateIdx = bookingProvider.selectedDate != null
            ? _availableDates
                .indexWhere((d) => d.day == bookingProvider.selectedDate!.day)
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
      l10n.choosePet,
      l10n.stepClinic,
      l10n.stepService,
      l10n.doctor,
      l10n.stepTime,
    ];
    final subs = [
      l10n.choosePetSub,
      l10n.stepClinic,
      l10n.stepService,
      l10n.doctor,
      l10n.stepTime,
    ];

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      sliver: SliverToBoxAdapter(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              titles[_currentStep],
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              subs[_currentStep],
              style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
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
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 54,
        child: ElevatedButton(
          onPressed: bookingProvider.isLoading
              ? null
              : (isSuccess
                  ? () {
                      bookingProvider.reset();
                      setState(() => _currentStep = 0);
                      MainNavigationWrapper.of(context)?.setSelectedIndex(2);
                    }
                  : () => _nextStep(l10n)),
          style: ElevatedButton.styleFrom(
            backgroundColor: isSuccess ? Colors.white : AppColors.primary,
            foregroundColor: isSuccess ? AppColors.primary : Colors.white,
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
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
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
                    ]
                  ],
                ),
        ),
      ),
    );
  }
}
