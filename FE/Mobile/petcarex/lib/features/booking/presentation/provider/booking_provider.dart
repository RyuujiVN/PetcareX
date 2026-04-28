import 'package:flutter/material.dart';

import '../../../../core/enums/service_enum.dart';
import '../../../../core/utils/service_specialty_mapper.dart';
import '../../data/booking_repository.dart';
import '../../data/models/booking_models.dart';

class BookingProvider extends ChangeNotifier {
  final BookingRepository _repository = BookingRepository();

  String? _selectedPetId;
  String? _selectedPetName;
  Clinic? _selectedClinic;
  Veterinarian? _selectedDoctor;
  VetUser? _selectedDoctorAccount;
  String? _selectedServiceName;
  DateTime? _selectedDate;
  String? _selectedTime;
  String? _symptomsNote;

  // Data lists fetching
  List<Clinic> _clinics = [];
  List<Veterinarian> _doctors = [];

  // Clinic pagination state
  static const int _clinicsPageSize = 20;
  int _clinicsCurrentPage = 1;
  int _clinicsTotalPages = 1;
  bool _hasMoreClinics = true;
  bool _isLoadingMoreClinics = false;

  bool _isLoading = false;
  bool _isDoctorsLoading = false;
  bool _isDoctorAccountLoading = false;
  String? _errorMessage;
  bool _isSuccess = false;
  Map<String, dynamic>? _appointmentResult;

  // Getters
  String? get selectedPetId => _selectedPetId;
  String? get selectedPetName => _selectedPetName;
  Clinic? get selectedClinic => _selectedClinic;
  Veterinarian? get selectedDoctor => _selectedDoctor;
  VetUser? get selectedDoctorAccount => _selectedDoctorAccount;
  String? get selectedServiceName => _selectedServiceName;
  DateTime? get selectedDate => _selectedDate;
  String? get selectedTime => _selectedTime;
  String? get symptomsNote => _symptomsNote;

  List<Clinic> get clinics => _clinics;
  List<Veterinarian> get doctors => _doctors;
  bool get isLoading => _isLoading;
  bool get isLoadingMoreClinics => _isLoadingMoreClinics;
  bool get hasMoreClinics => _hasMoreClinics;
  bool get isDoctorsLoading => _isDoctorsLoading;
  bool get isDoctorAccountLoading => _isDoctorAccountLoading;
  String? get errorMessage => _errorMessage;
  bool get isSuccess => _isSuccess;
  Map<String, dynamic>? get appointmentResult => _appointmentResult;

  // Setters
  void selectPet(String petId, {String? petName}) {
    _selectedPetId = petId;
    final normalizedName = petName?.trim();
    if (normalizedName != null && normalizedName.isNotEmpty) {
      _selectedPetName = normalizedName;
    }
    notifyListeners();
  }

  void selectClinic(Clinic clinic) {
    _selectedClinic = clinic;
    _selectedDoctor = null; // Clear doctor khi clinic changes
    _selectedDoctorAccount = null;
    _isDoctorAccountLoading = false;
    _doctors = [];
    notifyListeners();
    fetchDoctors(clinic.id);
  }

  void selectDoctor(Veterinarian doctor) {
    if (_selectedDoctor?.userId == doctor.userId) {
      _selectedDoctor = null;
      _selectedDoctorAccount = null;
      _isDoctorAccountLoading = false;
      notifyListeners();
      return;
    }

    _selectedDoctor = doctor;
    _selectedDoctorAccount = doctor.user;
    _isDoctorAccountLoading = false;
    notifyListeners();
  }

  void selectService(String service) {
    _selectedServiceName = service;
    _selectedDoctor = null;
    _selectedDoctorAccount = null;
    notifyListeners();

    // Re-fetch doctors filtered by specialty based on selected service
    if (_selectedClinic != null) {
      final serviceEnum = ServiceEnum.fromValue(service);
      final specialty = serviceEnum != null
          ? ServiceSpecialtyMapper.getPrimarySpecialtyValue(serviceEnum)
          : null;
      fetchDoctors(_selectedClinic!.id, specialty: specialty);
    }
  }

  void setSymptomsNote(String note) {
    _symptomsNote = note;
    notifyListeners();
  }

  void selectDate(DateTime date) {
    _selectedDate = date;
    _selectedTime = null; // Clear time khi date changes
    notifyListeners();
  }

  void selectTime(String time) {
    _selectedTime = time;
    notifyListeners();
  }

  // Sets date only if not already selected, without clearing the selected time
  void setDefaultDate(DateTime date) {
    if (_selectedDate == null) {
      _selectedDate = date;
      notifyListeners();
    }
  }

  // Fetching data
  Future<void> fetchClinics() async {
    _isLoading = true;
    _errorMessage = null;
    _clinicsCurrentPage = 1;
    _clinicsTotalPages = 1;
    _hasMoreClinics = true;
    _isLoadingMoreClinics = false;
    notifyListeners();

    try {
      final result = await _repository.getClinics(
        page: 1,
        limit: _clinicsPageSize,
      );
      final items = (result['items'] as List).cast<Clinic>();
      _clinics = _sortClinicsByRating(items);
      _clinicsCurrentPage = (result['currentPage'] as int?) ?? 1;
      _clinicsTotalPages = (result['totalPages'] as int?) ?? 1;
      _hasMoreClinics = _clinicsCurrentPage < _clinicsTotalPages;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMoreClinics() async {
    if (_isLoadingMoreClinics || !_hasMoreClinics || _isLoading) return;

    _isLoadingMoreClinics = true;
    notifyListeners();

    try {
      final nextPage = _clinicsCurrentPage + 1;
      final result = await _repository.getClinics(
        page: nextPage,
        limit: _clinicsPageSize,
      );
      final items = (result['items'] as List).cast<Clinic>();
      _clinics = _sortClinicsByRating([..._clinics, ...items]);
      _clinicsCurrentPage = (result['currentPage'] as int?) ?? nextPage;
      _clinicsTotalPages = (result['totalPages'] as int?) ?? _clinicsTotalPages;
      _hasMoreClinics = _clinicsCurrentPage < _clinicsTotalPages;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoadingMoreClinics = false;
      notifyListeners();
    }
  }

  // Sort: clinics with reviews first (desc by avgRating), unrated clinics last.
  List<Clinic> _sortClinicsByRating(List<Clinic> input) {
    final list = List<Clinic>.from(input);
    list.sort((a, b) {
      final aHas = a.totalReviews > 0;
      final bHas = b.totalReviews > 0;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return b.avgRating.compareTo(a.avgRating);
    });
    return list;
  }

  Future<void> fetchDoctors(String clinicId, {String? specialty}) async {
    _isDoctorsLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _doctors = await _repository.getVeterinariansByClinic(
        clinicId,
        specialty: specialty,
      );
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isDoctorsLoading = false;
      notifyListeners();
    }
  }

  Future<bool> confirmAppointment() async {
    if (_selectedPetId == null ||
        _selectedClinic == null ||
        _selectedDoctor == null ||
        _selectedDate == null ||
        _selectedTime == null ||
        _selectedServiceName == null) {
      _errorMessage = 'bookingErrorCompleteAllSteps';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    _isSuccess = false;
    notifyListeners();

    try {
      final dateStr =
          "${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}";
      final dto = CreateAppointmentDto(
        petId: _selectedPetId!,
        clinicId: _selectedClinic!.id,
        veterinarianId: _selectedDoctor!.userId,
        recipientId: _selectedDoctor!.userId,
        appointmentDate: dateStr,
        appointmentTime: _selectedTime!,
        service: _selectedServiceName!,
        note: _symptomsNote ?? "",
      );

      final result = await _repository.createAppointment(dto);
      _appointmentResult = result;
      _isSuccess = true;
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    _selectedPetId = null;
    _selectedPetName = null;
    _selectedClinic = null;
    _selectedDoctor = null;
    _selectedDoctorAccount = null;
    _selectedServiceName = null;
    _selectedDate = null;
    _selectedTime = null;
    _symptomsNote = null;
    _isSuccess = false;
    _isDoctorsLoading = false;
    _isDoctorAccountLoading = false;
    _appointmentResult = null;
    notifyListeners();
  }
}
