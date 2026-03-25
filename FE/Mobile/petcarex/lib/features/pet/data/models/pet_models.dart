import '../../../../core/enums/pet_breed_enum.dart';
import '../../../../core/enums/pet_species_enum.dart';

class Pet {
  final String id;
  final String ownerId;
  final String name;
  final String species;
  final String breed;
  final bool gender;
  final String dateOfBirth;
  final double weight;
  final String? avatar;
  final String note;
  final DateTime createdAt;

  Pet({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.species,
    required this.breed,
    required this.gender,
    required this.dateOfBirth,
    required this.weight,
    this.avatar,
    required this.note,
    required this.createdAt,
  });

  factory Pet.fromJson(Map<String, dynamic> json) {
    return Pet(
      id: json['id']?.toString() ?? '',
      ownerId: json['ownerId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      species: _extractSpecies(json),
      breed: _extractBreed(json),
      gender: json['gender'] == true,
      dateOfBirth: json['dateOfBirth']?.toString() ?? '',
      weight: double.tryParse(json['weight']?.toString() ?? '') ?? 0.0,
      avatar: json['avatar']?.toString(),
      note: json['note']?.toString() ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  PetSpeciesEnum? get speciesEnum => PetSpeciesEnum.fromValue(species);

  PetBreedEnum? get breedEnum => PetBreedEnum.fromValue(breed);

  static String _extractSpecies(Map<String, dynamic> json) {
    final species = json['species'];
    if (species is String && species.trim().isNotEmpty) {
      return species.trim().toUpperCase();
    }

    final legacySpecies = json['speciesId'];
    if (legacySpecies is String && legacySpecies.trim().isNotEmpty) {
      return legacySpecies.trim();
    }

    final legacyBreed = json['breed'];
    if (legacyBreed is Map) {
      final value = legacyBreed['speciesId'];
      if (value is String && value.trim().isNotEmpty) {
        return value.trim();
      }
    }

    return '';
  }

  static String _extractBreed(Map<String, dynamic> json) {
    final breed = json['breed'];
    if (breed is String && breed.trim().isNotEmpty) {
      return breed.trim().toUpperCase();
    }

    final legacyBreed = json['breedId'];
    if (legacyBreed is String && legacyBreed.trim().isNotEmpty) {
      return legacyBreed.trim();
    }

    if (breed is Map) {
      final value = breed['id'];
      if (value is String && value.trim().isNotEmpty) {
        return value.trim();
      }

      final name = breed['name'];
      if (name is String && name.trim().isNotEmpty) {
        return name.trim();
      }
    }

    return '';
  }
}

class PetSpecies {
  final String id;

  const PetSpecies({required this.id});

  factory PetSpecies.fromJson(dynamic json) {
    if (json is String) {
      return PetSpecies(id: json.trim().toUpperCase());
    }

    if (json is Map<String, dynamic>) {
      final rawValue = (json['id'] ?? json['name'] ?? '').toString().trim();
      return PetSpecies(id: rawValue.toUpperCase());
    }

    return const PetSpecies(id: '');
  }

  String get name => id;

  PetSpeciesEnum? get speciesEnum => PetSpeciesEnum.fromValue(id);
}

class PetBreed {
  final String id;
  final String speciesId;

  const PetBreed({required this.id, required this.speciesId});

  factory PetBreed.fromJson(
    dynamic json, {
    String? speciesId,
  }) {
    if (json is String) {
      final value = json.trim().toUpperCase();
      return PetBreed(id: value, speciesId: speciesId ?? _deriveSpecies(value));
    }

    if (json is Map<String, dynamic>) {
      final value = (json['id'] ?? json['name'] ?? '').toString().trim();
      final rawSpecies =
          (json['speciesId'] ?? speciesId ?? _deriveSpecies(value))
              .toString()
              .trim();
      return PetBreed(id: value.toUpperCase(), speciesId: rawSpecies);
    }

    return const PetBreed(id: '', speciesId: '');
  }

  String get name => id;

  PetBreedEnum? get breedEnum => PetBreedEnum.fromValue(id);

  static String _deriveSpecies(String breedValue) {
    final separatorIndex = breedValue.indexOf('_');
    if (separatorIndex <= 0) {
      return '';
    }
    return breedValue.substring(0, separatorIndex);
  }
}

/// Unified DTO for both creating and updating pets.
class PetFormDto {
  final String name;
  final bool gender;
  final String dateOfBirth;
  final double weight;
  final String? avatar;
  final String species;
  final String breed;
  final String note;

  PetFormDto({
    required this.name,
    required this.gender,
    required this.dateOfBirth,
    required this.weight,
    this.avatar,
    required this.species,
    required this.breed,
    required this.note,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'gender': gender,
      'dateOfBirth': dateOfBirth,
      'weight': weight,
      'avatar': avatar ?? '',
      'species': species,
      'breed': breed,
      'note': note,
    };
  }
}

/// Backward compatibility aliases
typedef CreatePetDto = PetFormDto;
typedef UpdatePetDto = PetFormDto;
