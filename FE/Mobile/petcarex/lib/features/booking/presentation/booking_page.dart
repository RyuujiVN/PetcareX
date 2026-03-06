import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
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
  int _currentStep = 0; // 0 to 5 (Step 5 is Confirmation, Step 6 is Success)
  bool _isSuccess = false;

  // Form State
  int? _selectedPetIndex = 0;
  int? _selectedClinicIndex = 0;
  int? _selectedServiceIndex = 0;
  int? _selectedDoctorIndex = 0;
  int _selectedDateIndex = 0;
  String? _selectedTime;

  final List<String> _steps = [
    'Thú cưng',
    'Phòng khám',
    'Dịch vụ',
    'Bác sĩ',
    'Thời gian',
  ];

  // Mock Data
  final List<String> _petNames = ['Lu Lu', 'Mimi'];
  final List<String> _clinics = ['PetCare', 'PetHealth', 'PetCenter'];
  final List<String> _services = ['Khám tổng quát', 'Tiêm phòng', 'Phẫu thuật'];
  final List<String> _doctors = ['BS. Nguyễn Văn An', 'BS. Lê Thị Mai'];
  final List<DateTime> _availableDates = List.generate(
    7,
    (index) => DateTime.now().add(Duration(days: index)),
  );

  void _nextStep() {
    if (_currentStep == 4 && _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn thời gian khám')),
      );
      return;
    }

    setState(() {
      if (_currentStep < 5) {
        _currentStep++;
      } else if (_currentStep == 5) {
        _isSuccess = true;
        _currentStep = 6;
      }
    });
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: _isSuccess
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
            currentStep: _currentStep,
            steps: _steps,
            isSuccess: _isSuccess,
            onStepTapped: (index) {
              setState(() => _currentStep = index);
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _buildBodyContent(),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomSection(),
    );
  }

  Widget _buildBodyContent() {
    if (_isSuccess) {
      return StepSuccess(
        petName: _petNames[_selectedPetIndex ?? 0],
        clinicName: _clinics[_selectedClinicIndex ?? 0],
        serviceName: _services[_selectedServiceIndex ?? 0],
        doctorName: _doctors[_selectedDoctorIndex ?? 0],
        time: _selectedTime ?? "",
        date: _availableDates[_selectedDateIndex],
      );
    }

    if (_currentStep == 5) {
      return StepSummary(
        petName: _petNames[_selectedPetIndex ?? 0],
        clinicName: _clinics[_selectedClinicIndex ?? 0],
        serviceName: _services[_selectedServiceIndex ?? 0],
        doctorName: _doctors[_selectedDoctorIndex ?? 0],
        time: _selectedTime ?? "",
        date: _availableDates[_selectedDateIndex],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepHeader(),
        const SizedBox(height: 24),
        _buildStepContent(),
      ],
    );
  }

  Widget _buildStepHeader() {
    final titles = [
      "Chọn thú cưng của bạn",
      "Chọn phòng khám cho thú cưng",
      "Lựa chọn dịch vụ",
      "Chọn bác sĩ cho thú cưng bạn",
      "Chọn thời gian khám",
    ];
    final subs = [
      "Chọn thú cưng cần được thăm khám hôm nay",
      "Chọn phòng khám mà bạn mong muốn nhé",
      "Chọn một hoặc nhiều dịch vụ cho thú cưng của bạn",
      "Chọn bác sĩ chuyên khoa phù hợp nhé",
      "Lựa chọn ngày và thời gian khám cho thú cưng của bạn",
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
    switch (_currentStep) {
      case 0:
        return StepPetSelector(
          selectedIndex: _selectedPetIndex,
          onSelected: (i) => setState(() => _selectedPetIndex = i),
          petNames: _petNames,
        );
      case 1:
        return StepClinicSelector(
          selectedIndex: _selectedClinicIndex,
          onSelected: (i) => setState(() => _selectedClinicIndex = i),
          clinics: _clinics,
        );
      case 2:
        return StepServiceSelector(
          selectedIndex: _selectedServiceIndex,
          onSelected: (i) => setState(() => _selectedServiceIndex = i),
          services: _services,
        );
      case 3:
        return StepDoctorSelector(
          selectedIndex: _selectedDoctorIndex,
          onSelected: (i) => setState(() => _selectedDoctorIndex = i),
          doctors: _doctors,
        );
      case 4:
        return StepTimeSelector(
          selectedDateIndex: _selectedDateIndex,
          onDateSelected: (i) => setState(() {
            _selectedDateIndex = i;
            _selectedTime = null;
          }),
          selectedTime: _selectedTime,
          onTimeSelected: (t) => setState(() => _selectedTime = t),
          availableDates: _availableDates,
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildBottomSection() {
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
          onPressed: _isSuccess ? () => Navigator.pop(context) : _nextStep,
          style: ElevatedButton.styleFrom(
            backgroundColor: _isSuccess ? Colors.white : AppColors.primary,
            foregroundColor: _isSuccess ? AppColors.primary : Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(27),
            ),
            side: _isSuccess
                ? const BorderSide(color: AppColors.primary)
                : BorderSide.none,
            elevation: 0,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _isSuccess
                    ? 'Thoát'
                    : (_currentStep == 5 ? 'Xác nhận đặt lịch' : 'Tiếp tục'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (!_isSuccess && _currentStep < 5) ...[
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
