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

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _petAvatarUrl;
  String? get petAvatarUrl => _petAvatarUrl;

  Future<void> fetchMyPets() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _myPets = await _repository.getMyPets();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchSpecies() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _speciesList = await _repository.getSpecies();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchBreeds(String speciesId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _breedList = await _repository.getBreeds(speciesId);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
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

  Future<bool> createPet(CreatePetDto petDto) async {
    _isLoading = true;
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
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updatePet(String id, UpdatePetDto petDto) async {
    _isLoading = true;
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
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deletePet(String id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _repository.deletePet(id);
      if (success) {
        await fetchMyPets();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
