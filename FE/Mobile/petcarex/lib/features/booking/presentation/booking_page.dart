import 'package:flutter/material.dart';
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
  final List<String> _steps = [
    'Thú cưng',
    'Phòng khám',
    'Dịch vụ',
    'Bác sĩ',
    'Thời gian',
  ];

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

  void _nextStep() async {
    final bookingProvider = context.read<BookingProvider>();

    // Validation
    if (_currentStep == 0 && bookingProvider.selectedPetId == null) {
      _showError('Vui lòng chọn thú cưng');
      return;
    }
    if (_currentStep == 1 && bookingProvider.selectedClinic == null) {
      _showError('Vui lòng chọn phòng khám');
      return;
    }
    if (_currentStep == 2) {
      if (bookingProvider.selectedServiceName == null) {
        _showError('Vui lòng chọn dịch vụ');
        return;
      }
      if (bookingProvider.symptomsNote == null || bookingProvider.symptomsNote!.trim().isEmpty) {
        _showError('Vui lòng nhập triệu chứng của thú cưng');
        return;
      }
    }
    if (_currentStep == 3 && bookingProvider.selectedDoctor == null) {
      _showError('Vui lòng chọn bác sĩ');
      return;
    }
    if (_currentStep == 4) {
      if (bookingProvider.selectedDate == null) {
        _showError('Vui lòng chọn ngày khám');
        return;
      }
      if (bookingProvider.selectedTime == null) {
        _showError('Vui lòng chọn thời gian khám');
        return;
      }
    }

    if (_currentStep < 5) {
      setState(() => _currentStep++);
    } else {
      // Step 5: Confirm
      final success = await bookingProvider.confirmAppointment();
      if (success) {
        setState(() => _currentStep = 6);
      } else {
        _showError(bookingProvider.errorMessage ?? 'Có lỗi xảy ra khi đặt lịch');
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
      } else {
        // Nếu không pop được (đang ở tab), có thể không làm gì hoặc thông báo
        // Hiện tại khi ở Tab thì nút back vẫn hiển thị do leading: isSuccess ? const SizedBox() : ...
        // Chúng ta nên ẩn nút back nếu không thể pop và đang ở step 0
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingProvider = context.watch<BookingProvider>();
    final isSuccess = _currentStep == 6;

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
          title: const Text(
            'Đặt lịch khám',
            style: TextStyle(
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
              steps: _steps,
              isSuccess: isSuccess,
              onStepTapped: (index) {
                if (index < _currentStep) {
                  setState(() => _currentStep = index);
                }
              },
            ),
            Expanded(
              child: _buildBodyContent(),
            ),
          ],
        ),
        bottomNavigationBar: _buildBottomSection(),
      ),
    );
  }

  Widget _buildBodyContent() {
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
          date: DateTime.tryParse(res?['appointmentDate'] ?? '') ?? DateTime.now(),
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
          petName: pet?.name ?? 'Thú cưng',
          clinicName: bookingProvider.selectedClinic?.name ?? '',
          serviceName: bookingProvider.selectedServiceName ?? '',
          doctorName: bookingProvider.selectedDoctor?.user.fullName ?? '',
          time: bookingProvider.selectedTime ?? '',
          date: bookingProvider.selectedDate ?? DateTime.now(),
        ),
      );
    }

    if (_currentStep == 2) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
            child: _buildStepHeader(),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _buildStepContent(),
            ),
          ),
        ],
      );
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: _buildStepHeader(),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _buildStepContent(),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStepHeader() {
    final titles = [
      'Chọn thú cưng của bạn',
      'Chọn phòng khám cho thú cưng',
      'Lựa chọn dịch vụ',
      'Chọn bác sĩ cho thú cưng bạn',
      'Chọn thời gian khám',
    ];
    final subs = [
      'Chọn thú cưng cần được thăm khám hôm nay',
      'Chọn phòng khám mà bạn mong muốn nhé',
      'Chọn một hoặc nhiều dịch vụ cho thú cưng của bạn',
      'Chọn bác sĩ chuyên khoa phù hợp nhé',
      'Lựa chọn ngày và thời gian khám cho thú cưng của bạn',
    ];
    return Column(
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
    );
  }

  Widget _buildStepContent() {
    final bookingProvider = context.watch<BookingProvider>();
    final petProvider = context.watch<PetProvider>();

    if (bookingProvider.isLoading && _currentStep != 5 && _currentStep != 6) {
       return const SizedBox(height: 200, child: Center(child: CircularProgressIndicator()));
    }

    switch (_currentStep) {
      case 0:
        if (petProvider.isLoading) return const Center(child: CircularProgressIndicator());
        return StepPetSelector(
          selectedPetId: bookingProvider.selectedPetId,
          onSelected: (pet) => bookingProvider.selectPet(pet.id),
          pets: petProvider.myPets,
        );
      case 1:
        return StepClinicSelector(
          selectedClinicId: bookingProvider.selectedClinic?.id,
          onSelected: (clinic) => bookingProvider.selectClinic(clinic),
          clinics: bookingProvider.clinics,
        );
      case 2:
        return StepServiceSelector(
          selectedServiceName: bookingProvider.selectedServiceName,
          onSelected: (s) => bookingProvider.selectService(s),
          services: _services,
          onSymptomsChanged: (v) => bookingProvider.setSymptomsNote(v),
          symptoms: bookingProvider.symptomsNote,
        );
      case 3:
        return StepDoctorSelector(
          selectedDoctorId: bookingProvider.selectedDoctor?.userId,
          onSelected: (doc) => bookingProvider.selectDoctor(doc),
          doctors: bookingProvider.doctors,
        );
      case 4:
        int dateIdx = bookingProvider.selectedDate != null
            ? _availableDates.indexWhere((d) => d.day == bookingProvider.selectedDate!.day)
            : 0;
        if (dateIdx == -1) dateIdx = 0;
        
        return StepTimeSelector(
          selectedDateIndex: dateIdx,
          onDateSelected: (i) => bookingProvider.selectDate(_availableDates[i]),
          selectedTime: bookingProvider.selectedTime,
          onTimeSelected: (t) => bookingProvider.selectTime(t),
          availableDates: _availableDates,
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildBottomSection() {
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
                  : _nextStep),
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
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    isSuccess
                        ? 'Thoát'
                        : (_currentStep == 5 ? 'Xác nhận đặt lịch' : 'Tiếp tục'),
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
