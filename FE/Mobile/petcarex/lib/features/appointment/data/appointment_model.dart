class Appointment {
  final String id;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String service;
  final String note;
  final String status;
  final AppointmentPet pet;
  final AppointmentClinic clinic;
  final AppointmentVeterinarian veterinarian;

  Appointment({
    required this.id,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.service,
    required this.note,
    required this.status,
    required this.pet,
    required this.clinic,
    required this.veterinarian,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      appointmentDate: DateTime.parse(json['appointmentDate']),
      appointmentTime: json['appointmentTime'],
      service: json['service'],
      note: json['note'] ?? '',
      status: json['status'],
      pet: AppointmentPet.fromJson(json['pet']),
      clinic: AppointmentClinic.fromJson(json['clinic']),
      veterinarian: AppointmentVeterinarian.fromJson(json['veterinarian']),
    );
  }
}

class AppointmentPet {
  final String id;
  final String name;
  final String? avatar;
  final String breedName;

  AppointmentPet({
    required this.id,
    required this.name,
    this.avatar,
    required this.breedName,
  });

  factory AppointmentPet.fromJson(Map<String, dynamic> json) {
    return AppointmentPet(
      id: json['id'],
      name: json['name'],
      avatar: json['avatar'],
      breedName: json['breed']['name'],
    );
  }
}

class AppointmentClinic {
  final String id;
  final String name;
  final String address;

  AppointmentClinic({
    required this.id,
    required this.name,
    required this.address,
  });

  factory AppointmentClinic.fromJson(Map<String, dynamic> json) {
    return AppointmentClinic(
      id: json['id'],
      name: json['name'],
      address: json['address'],
    );
  }
}

class AppointmentVeterinarian {
  final String fullName;
  final String? avatarUrl;
  final String specialty;

  AppointmentVeterinarian({
    required this.fullName,
    this.avatarUrl,
    required this.specialty,
  });

  factory AppointmentVeterinarian.fromJson(Map<String, dynamic> json) {
    return AppointmentVeterinarian(
      fullName: json['user']['fullName'],
      avatarUrl: json['user']['avatarUrl'],
      specialty: json['specialty'],
    );
  }
}
