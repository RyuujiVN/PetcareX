import 'package:flutter/material.dart';

import '../../data/booking_repository.dart';
import '../../data/models/booking_models.dart';

class BookingProvider extends ChangeNotifier {
  final BookingRepository _repository = BookingRepository();

  String? _selectedPetId;
  Clinic? _selectedClinic;
  Veterinarian? _selectedDoctor;
  String? _selectedServiceName;
  DateTime? _selectedDate;
  String? _selectedTime;
  String? _symptomsNote;

  // Data lists fetching
  List<Clinic> _clinics = [];
  List<Veterinarian> _doctors = [];
  
  bool _isLoading = false;
  String? _errorMessage;
  bool _isSuccess = false;
  Map<String, dynamic>? _appointmentResult;

  // Getters
  String? get selectedPetId => _selectedPetId;
  Clinic? get selectedClinic => _selectedClinic;
  Veterinarian? get selectedDoctor => _selectedDoctor;
  String? get selectedServiceName => _selectedServiceName;
  DateTime? get selectedDate => _selectedDate;
  String? get selectedTime => _selectedTime;
  String? get symptomsNote => _symptomsNote;

  List<Clinic> get clinics => _clinics;
  List<Veterinarian> get doctors => _doctors;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isSuccess => _isSuccess;
  Map<String, dynamic>? get appointmentResult => _appointmentResult;

  // Setters
  void selectPet(String petId) {
    _selectedPetId = petId;
    notifyListeners();
  }

  void selectClinic(Clinic clinic) {
    _selectedClinic = clinic;
    _selectedDoctor = null; // Clear doctor khi clinic changes
    _doctors = [];
    notifyListeners();
    fetchDoctors(clinic.id);
  }

  void selectDoctor(Veterinarian doctor) {
    _selectedDoctor = doctor;
    notifyListeners();
  }

  void selectService(String service) {
    _selectedServiceName = service;
    notifyListeners();
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

  // Fetching data
  Future<void> fetchClinics() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _repository.getClinics();
      _clinics = result['items'];
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDoctors(String clinicId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _doctors = await _repository.getVeterinariansByClinic(clinicId);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> confirmAppointment() async {
    if (_selectedPetId == null || _selectedClinic == null || _selectedDoctor == null || _selectedDate == null || _selectedTime == null || _selectedServiceName == null) {
      _errorMessage = "Vui lòng hoàn thành tất cả các bước!";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final dateStr = "${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}";
      final dto = CreateAppointmentDto(
        petId: _selectedPetId!,
        clinicId: _selectedClinic!.id,
        veterinarianId: _selectedDoctor!.userId,
        appointmentDate: dateStr,
        appointmentTime: _selectedTime!,
        service: _selectedServiceName!,
        note: _symptomsNote ?? "",
      );

      final result = await _repository.createAppointment(dto);
      _appointmentResult = result;
      _isSuccess = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  void reset() {
    _selectedPetId = null;
    _selectedClinic = null;
    _selectedDoctor = null;
    _selectedServiceName = null;
    _selectedDate = null;
    _selectedTime = null;
    _symptomsNote = null;
    _isSuccess = false;
    _appointmentResult = null;
    notifyListeners();
  }
}
