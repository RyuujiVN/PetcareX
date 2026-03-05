import 'package:flutter/material.dart';

import '../../data/models/pet_models.dart';
import '../../data/pet_repository.dart';

class PetProvider extends ChangeNotifier {
  final PetRepository _repository = PetRepository();

  List<PetSpecies> _speciesList = [];
  List<PetSpecies> get speciesList => _speciesList;

  List<PetBreed> _breedList = [];
  List<PetBreed> get breedList => _breedList;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

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
    return await _repository.uploadAvatar(filePath);
  }

  Future<bool> createPet(CreatePetDto petDto) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final success = await _repository.createPet(petDto);
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
