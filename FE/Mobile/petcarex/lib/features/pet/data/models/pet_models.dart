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
