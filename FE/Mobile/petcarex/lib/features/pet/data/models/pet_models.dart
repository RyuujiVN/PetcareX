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
      id: json['id'],
      ownerId: json['ownerId'],
      name: json['name'],
      breedId: json['breedId'],
      gender: json['gender'],
      dateOfBirth: json['dateOfBirth'],
      weight: double.tryParse(json['weight'].toString()) ?? 0.0,
      avatar: json['avatar'],
      note: json['note'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
      breed: json['breed'] != null ? PetBreed.fromJson(json['breed']) : null,
    );
  }
}

class PetSpecies {
  final String id;
  final String name;

  PetSpecies({required this.id, required this.name});

  factory PetSpecies.fromJson(Map<String, dynamic> json) {
    return PetSpecies(
      id: json['id'],
      name: json['name'],
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
      id: json['id'],
      name: json['name'],
      speciesId: json['speciesId'] ?? '',
    );
  }
}

class CreatePetDto {
  final String name;
  final bool gender;
  final String dateOfBirth;
  final double weight;
  final String? avatar;
  final String breedId;
  final String note;

  CreatePetDto({
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
