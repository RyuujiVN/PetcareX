class Pet {
  final String id;
  final String ownerId;
  final String name;
  final String breedId;
  final bool gender;
  final String dateOfBirth;
  final double weight;
  final String? avatar;
  final String note;
  final DateTime createdAt;
  final PetBreed? breed;

  Pet({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.breedId,
    required this.gender,
    required this.dateOfBirth,
    required this.weight,
    this.avatar,
    required this.note,
    required this.createdAt,
    this.breed,
  });

  factory Pet.fromJson(Map<String, dynamic> json) {
    return Pet(
      id: json['id']?.toString() ?? '',
      ownerId: json['ownerId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      breedId: json['breedId']?.toString() ?? '',
      gender: json['gender'] == true,
      dateOfBirth: json['dateOfBirth']?.toString() ?? '',
      weight: double.tryParse(json['weight']?.toString() ?? '') ?? 0.0,
      avatar: json['avatar']?.toString(),
      note: json['note']?.toString() ?? '',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
      breed: json['breed'] != null && json['breed'] is Map ? PetBreed.fromJson(json['breed'] as Map<String, dynamic>) : null,
    );
  }
}

class PetSpecies {
  final String id;
  final String name;

  PetSpecies({required this.id, required this.name});

  factory PetSpecies.fromJson(Map<String, dynamic> json) {
    return PetSpecies(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}

class PetBreed {
  final String id;
  final String name;
  final String speciesId;

  PetBreed({required this.id, required this.name, required this.speciesId});

  factory PetBreed.fromJson(Map<String, dynamic> json) {
    return PetBreed(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      speciesId: json['speciesId']?.toString() ?? '',
    );
  }
}

/// Unified DTO for both creating and updating pets.
/// Replaces the previously duplicated CreatePetDto and UpdatePetDto.
class PetFormDto {
  final String name;
  final bool gender;
  final String dateOfBirth;
  final double weight;
  final String? avatar;
  final String breedId;
  final String note;

  PetFormDto({
    required this.name,
    required this.gender,
    required this.dateOfBirth,
    required this.weight,
    this.avatar,
    required this.breedId,
    required this.note,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'gender': gender,
      'dateOfBirth': dateOfBirth,
      'weight': weight,
      if (avatar != null) 'avatar': avatar,
      'breedId': breedId,
      'note': note,
    };
  }
}

/// Backward compatibility aliases
typedef CreatePetDto = PetFormDto;
typedef UpdatePetDto = PetFormDto;
