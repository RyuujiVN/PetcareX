

class BookingModels {
  // Clinic Model
  static List<Clinic> clinicsFromJson(List<dynamic> jsonList) {
    return jsonList.map((json) => Clinic.fromJson(json)).toList();
  }
}

class Clinic {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String address;
  final String description;
  final bool deleted;
  final DateTime createdAt;

  Clinic({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.address,
    required this.description,
    required this.deleted,
    required this.createdAt,
  });

  factory Clinic.fromJson(Map<String, dynamic> json) {
    return Clinic(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      description: json['description'] ?? '',
      deleted: json['deleted'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }
}

class Veterinarian {
  final String userId;
  final String clinicId;
  final VetUser user;
  final String specialty;

  // Added for UI tracking if needed
  bool isSelected;

  Veterinarian({
    required this.userId,
    required this.clinicId,
    required this.user,
    required this.specialty,
    this.isSelected = false,
  });

  factory Veterinarian.fromJson(Map<String, dynamic> json) {
    return Veterinarian(
      userId: json['userId'] ?? '',
      clinicId: json['clinicId'] ?? '',
      user: VetUser.fromJson(json['user'] ?? {}),
      specialty: json['specialty'] ?? '',
    );
  }
}

class VetUser {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String address;
  final String role;
  final String? avatarUrl;

  VetUser({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.address,
    required this.role,
    this.avatarUrl,
  });

  factory VetUser.fromJson(Map<String, dynamic> json) {
    return VetUser(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      address: json['address'] ?? '',
      role: json['role'] ?? '',
      avatarUrl: json['avatarUrl'],
    );
  }
}

class CreateAppointmentDto {
  final String petId;
  final String veterinarianId;
  final String clinicId;
  final String appointmentDate; // YYYY-MM-DD
  final String appointmentTime; // HH:mm
  final String service;
  final String note;

  CreateAppointmentDto({
    required this.petId,
    required this.veterinarianId,
    required this.clinicId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.service,
    required this.note,
  });

  Map<String, dynamic> toJson() {
    return {
      'petId': petId,
      'veterinarianId': veterinarianId,
      'clinicId': clinicId,
      'appointmentDate': appointmentDate,
      'appointmentTime': appointmentTime,
      'service': service,
      'note': note,
    };
  }
}
