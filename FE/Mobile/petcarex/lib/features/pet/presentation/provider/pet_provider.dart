import 'package:flutter/material.dart';

import '../../data/models/pet_models.dart';
import '../../data/pet_repository.dart';

class PetProvider extends ChangeNotifier {
  final PetRepository _repository = PetRepository();

  List<Pet> _myPets = [];
  List<Pet> get myPets => _myPets;

  List<PetSpecies> _speciesList = [];
  List<PetSpecies> get speciesList => _speciesList;

  List<PetBreed> _breedList = [];
  List<PetBreed> get breedList => _breedList;

  // Separated loading states to avoid race conditions
  bool _isLoadingPets = false;
  bool get isLoadingPets => _isLoadingPets;

  bool _isLoadingSpecies = false;
  bool get isLoadingSpecies => _isLoadingSpecies;

  bool _isSubmitting = false;
  bool get isSubmitting => _isSubmitting;

  /// Legacy getter: returns true if any mutation is in progress.
  /// Used by pages that only need to know "is something happening?"
  bool get isLoading => _isLoadingPets || _isLoadingSpecies || _isSubmitting;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _petAvatarUrl;
  String? get petAvatarUrl => _petAvatarUrl;

  Future<void> fetchMyPets() async {
    _isLoadingPets = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _myPets = await _repository.getMyPets();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoadingPets = false;
      notifyListeners();
    }
  }

  Future<void> fetchSpecies() async {
    _isLoadingSpecies = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _speciesList = await _repository.getSpecies();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoadingSpecies = false;
      notifyListeners();
    }
  }

  Future<void> fetchBreeds(String speciesId) async {
    _isLoadingSpecies = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _breedList = await _repository.getBreeds(speciesId);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoadingSpecies = false;
      notifyListeners();
    }
  }

  void clearBreeds() {
    _breedList = [];
    notifyListeners();
  }

  Future<String> uploadAvatar(String filePath) async {
    try {
      final url = await _repository.uploadAvatar(filePath);
      _petAvatarUrl = url;
      notifyListeners();
      return url;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  void setPetAvatarUrl(String? url) {
    _petAvatarUrl = url;
    notifyListeners();
  }

  Future<bool> createPet(PetFormDto petDto) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _repository.createPet(petDto);
      if (success) {
        await fetchMyPets(); // Refresh list after create
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> updatePet(String id, PetFormDto petDto) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _repository.updatePet(id, petDto);
      if (success) {
        await fetchMyPets(); // Refresh list after update
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> deletePet(String id) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _repository.deletePet(id);
      if (success) {
        _myPets.removeWhere((pet) => pet.id == id); // Optimistic local removal
        await fetchMyPets();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}
