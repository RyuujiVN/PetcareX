class PetMedicalRecordSummary {
  final String id;
  final String name;
  final DateTime? createdAt;
  final String? clinicId;
  final String? clinicName;
  final bool isReview;

  const PetMedicalRecordSummary({
    required this.id,
    required this.name,
    required this.createdAt,
    this.clinicId,
    this.clinicName,
    this.isReview = false,
  });

  factory PetMedicalRecordSummary.fromJson(Map<String, dynamic> json) {
    final clinic = json['clinic'];
    String? clinicId;
    String? clinicName;
    if (clinic is Map<String, dynamic>) {
      clinicId = clinic['id']?.toString();
      clinicName = clinic['name']?.toString();
    }

    return PetMedicalRecordSummary(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      clinicId: clinicId,
      clinicName: clinicName,
      isReview: json['isReview'] == true,
    );
  }

  PetMedicalRecordSummary copyWith({
    String? id,
    String? name,
    DateTime? createdAt,
    String? clinicId,
    String? clinicName,
    bool? isReview,
  }) {
    return PetMedicalRecordSummary(
      id: id ?? this.id,
      name: name ?? this.name,
      createdAt: createdAt ?? this.createdAt,
      clinicId: clinicId ?? this.clinicId,
      clinicName: clinicName ?? this.clinicName,
      isReview: isReview ?? this.isReview,
    );
  }
}

class PetMedicalRecordDetail {
  final String id;
  final String name;
  final String clinicName;
  final String veterinarianName;
  final DateTime? createdAt;
  final String diagnosis;
  final String symptoms;
  final String conclusion;
  final String note;
  final String weight;
  final List<MedicalOrderItem> medicalOrders;
  final List<MedicalMedicineItem> medicines;

  const PetMedicalRecordDetail({
    required this.id,
    required this.name,
    required this.clinicName,
    required this.veterinarianName,
    required this.createdAt,
    required this.diagnosis,
    required this.symptoms,
    required this.conclusion,
    required this.note,
    required this.weight,
    required this.medicalOrders,
    required this.medicines,
  });

  factory PetMedicalRecordDetail.fromJson(
    Map<String, dynamic> json, {
    List<MedicalOrderItem> medicalOrders = const [],
    List<MedicalMedicineItem> medicines = const [],
  }) {
    final clinic = json['clinic'];
    final veterinarian = json['veterinarian'];

    return PetMedicalRecordDetail(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      clinicName: clinic is Map
          ? clinic['name']?.toString() ?? ''
          : json['clinicName']?.toString() ?? '',
      veterinarianName: veterinarian is Map
          ? veterinarian['fullName']?.toString() ?? ''
          : json['veterinarianName']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
      diagnosis: json['diagnosis']?.toString() ?? '',
      symptoms: json['symptoms']?.toString() ?? '',
      conclusion: json['conclusion']?.toString() ?? '',
      note: json['note']?.toString() ?? '',
      weight: json['weight']?.toString() ?? '',
      medicalOrders: medicalOrders,
      medicines: medicines,
    );
  }
}

class MedicalOrderItem {
  final String id;
  final String nameVn;
  final String nameEng;
  final int? price;

  const MedicalOrderItem({
    required this.id,
    required this.nameVn,
    required this.nameEng,
    required this.price,
  });

  factory MedicalOrderItem.fromJson(Map<String, dynamic> json) {
    final medicalOrder = json['medicalOrder'];
    final source = medicalOrder is Map<String, dynamic> ? medicalOrder : json;

    return MedicalOrderItem(
      id: json['id']?.toString() ?? source['id']?.toString() ?? '',
      nameVn: source['nameVn']?.toString() ?? '',
      nameEng: source['nameEng']?.toString() ?? '',
      price: _parseInt(source['price']),
    );
  }

  static int? _parseInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '');
  }
}

class MedicalMedicineItem {
  final String id;
  final String name;
  final String unit;
  final String note;

  const MedicalMedicineItem({
    required this.id,
    required this.name,
    required this.unit,
    required this.note,
  });

  factory MedicalMedicineItem.fromJson(Map<String, dynamic> json) {
    final medicine = json['medicine'];
    final source = medicine is Map<String, dynamic> ? medicine : json;

    return MedicalMedicineItem(
      id: json['id']?.toString() ?? source['id']?.toString() ?? '',
      name: source['name']?.toString() ?? '',
      unit: source['unit']?.toString() ?? '',
      note: source['note']?.toString() ?? '',
    );
  }
}