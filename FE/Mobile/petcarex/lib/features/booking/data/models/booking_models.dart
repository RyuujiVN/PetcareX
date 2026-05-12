

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
  final String? avatarUrl;
  final bool deleted;
  final double avgRating;
  final int totalReviews;
  final DateTime createdAt;
  // Khoảng cách (km) từ vị trí user, BE trả về qua endpoint /clinic/user. Null nếu không sort theo distance.
  final double? distance;

  Clinic({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.address,
    required this.description,
    this.avatarUrl,
    required this.deleted,
    required this.avgRating,
    required this.totalReviews,
    required this.createdAt,
    this.distance,
  });

  factory Clinic.fromJson(Map<String, dynamic> json) {
    return Clinic(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      description: json['description'] ?? '',
      avatarUrl: json['avatarUrl'],
      deleted: json['deleted'] ?? false,
      avgRating: _parseDouble(json['avgRating']),
      totalReviews: _parseInt(json['totalReviews']),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      distance: json['distance'] == null ? null : _parseDouble(json['distance']),
    );
  }

  static double _parseDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static int _parseInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }
}

class Veterinarian {
  final String userId;
  final String clinicId;
  final VetUser user;
  final String specialty;
  final String? experience;

  // Added for UI tracking if needed
  bool isSelected;

  Veterinarian({
    required this.userId,
    required this.clinicId,
    required this.user,
    required this.specialty,
    this.experience,
    this.isSelected = false,
  });

  factory Veterinarian.fromJson(Map<String, dynamic> json) {
    return Veterinarian(
      userId: json['userId'] ?? '',
      clinicId: json['clinicId'] ?? '',
      user: VetUser.fromJson(json['user'] ?? {}),
      specialty: json['specialty']?.toString() ?? '',
      experience: json['experience']?.toString(),
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
  final String recipientId;
  final String appointmentDate; // YYYY-MM-DD
  final String appointmentTime; // HH:mm
  final String service;
  final String note;

  CreateAppointmentDto({
    required this.petId,
    required this.veterinarianId,
    required this.clinicId,
    required this.recipientId,
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
      'recipientId': recipientId,
      'recipient_id': recipientId,
      'appointmentDate': appointmentDate,
      'appointmentTime': appointmentTime,
      'service': service,
      'note': note,
    };
  }
}
