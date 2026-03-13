import 'dart:io';

import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart'; // Import mới
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../core/services/camera_service.dart';
import '../data/models/pet_models.dart';
import 'provider/pet_provider.dart';

class AddPetPage extends StatefulWidget {
  const AddPetPage({super.key});

  @override
  State<AddPetPage> createState() => _AddPetPageState();
}

class _AddPetPageState extends State<AddPetPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController petNameController = TextEditingController();
  final TextEditingController weightController = TextEditingController();
  final TextEditingController birthdateController = TextEditingController();

  final CameraService _cameraService = CameraService();

  File? _selectedImage;
  String? _uploadedAvatarUrl;
  bool _isUploadingAvatar = false;

  String? _selectedSpeciesId;
  String? _selectedBreedId;
  String _selectedGender = 'male';
  String? _selectedFurColor;
  DateTime? _selectedBirthDate;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PetProvider>().fetchSpecies();
    });
  }

  @override
  void dispose() {
    petNameController.dispose();
    weightController.dispose();
    birthdateController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final File? image = await _cameraService.pickImageFromGallery();
    if (!mounted) return;
    if (image != null) {
      setState(() {
        _selectedImage = image;
        _isUploadingAvatar = true;
      });

      try {
        final avatarUrl = await context.read<PetProvider>().uploadAvatar(image.path);
        if (!mounted) return;
        setState(() {
          _uploadedAvatarUrl = avatarUrl;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tải ảnh thành công!')),
        );
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi tải ảnh: ${e.toString()}')),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isUploadingAvatar = false;
          });
        }
      }
    }
  }

  Future<void> _selectDate() async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && mounted) {
      setState(() {
        _selectedBirthDate = picked;
        birthdateController.text =
            "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _savePetInfo() async {
    final l10n = AppLocalizations.of(context)!;
    if (_isUploadingAvatar) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đang tải ảnh lên, vui lòng đợi!')),
      );
      return;
    }

    if (_formKey.currentState?.validate() ?? false) {
      if (_selectedBreedId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.breed)),
        );
        return;
      }

      final String isoBirthDate = _selectedBirthDate?.toUtc().toIso8601String() ?? "";

      final petDto = CreatePetDto(
        name: petNameController.text.trim(),
        gender: _selectedGender == 'male',
        dateOfBirth: isoBirthDate,
        weight: double.tryParse(weightController.text) ?? 0.0,
        avatar: _uploadedAvatarUrl,
        breedId: _selectedBreedId!,
        note: _selectedFurColor ?? "",
      );

      final success = await context.read<PetProvider>().createPet(petDto);

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thành công!')),
        );
        Navigator.pop(context, true);
      } else if (mounted) {
        final error = context.read<PetProvider>().errorMessage;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error ?? 'Thất bại')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.addPet,
          style: const TextStyle(
            color: AppColors.textDark,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: Consumer<PetProvider>(
        builder: (context, petProvider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  _buildAvatarSection(petProvider),
                  const SizedBox(height: 32),
                  _buildPetNameField(l10n),
                  const SizedBox(height: 20),
                  _buildTypeAndBreedRow(petProvider, l10n),
                  const SizedBox(height: 20),
                  _buildGenderSection(l10n),
                  const SizedBox(height: 20),
                  _buildBirthdateField(l10n),
                  const SizedBox(height: 20),
                  _buildWeightAndFurColorRow(l10n),
                  const SizedBox(height: 32),
                  _buildSaveButton(petProvider, l10n),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAvatarSection(PetProvider provider) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey[200],
              ),
              child: ClipOval(
                child: _selectedImage != null
                    ? Image.file(_selectedImage!, fit: BoxFit.cover, width: 100, height: 100)
                    : (_uploadedAvatarUrl != null)
                        ? Image.network(
                            _uploadedAvatarUrl!,
                            fit: BoxFit.cover,
                            width: 100,
                            height: 100,
                            errorBuilder: (context, error, stackTrace) => 
                                Icon(Icons.broken_image, color: Colors.grey[400], size: 40),
                          )
                        : Icon(Icons.camera_alt, color: Colors.grey[400], size: 40),
              ),
            ),
            if (_isUploadingAvatar)
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black.withOpacity(0.4),
                ),
                child: const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _isUploadingAvatar ? null : _pickImage,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFEAF9F7),
            foregroundColor: AppColors.primary,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.camera_alt_outlined,
                  size: 16, color: _isUploadingAvatar ? Colors.grey : AppColors.primary),
              const SizedBox(width: 6),
              const Text('Upload'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPetNameField(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.petName,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        TextFormField(
          controller: petNameController,
          decoration: _inputDecoration(l10n.petName),
          validator: (value) =>
              (value == null || value.isEmpty) ? l10n.petName : null,
        ),
      ],
    );
  }

  Widget _buildTypeAndBreedRow(PetProvider provider, AppLocalizations l10n) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.species,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                isExpanded: true,
                value: _selectedSpeciesId,
                decoration: _inputDecoration(l10n.species),
                hint: Text(l10n.species, style: const TextStyle(fontSize: 14)),
                items: provider.speciesList.map<DropdownMenuItem<String>>((species) {
                  return DropdownMenuItem<String>(
                    value: species.id,
                    child: Text(species.name, style: const TextStyle(fontSize: 14)),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSpeciesId = value;
                    _selectedBreedId = null;
                  });
                  if (value != null) {
                    provider.fetchBreeds(value);
                  }
                },
                validator: (value) => value == null ? l10n.species : null,
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.breed,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                isExpanded: true,
                value: _selectedBreedId,
                decoration: _inputDecoration(l10n.breed),
                hint: Text(l10n.breed, style: const TextStyle(fontSize: 14)),
                items: provider.breedList.map<DropdownMenuItem<String>>((breed) {
                  return DropdownMenuItem<String>(
                    value: breed.id,
                    child: Text(breed.name,
                        style: const TextStyle(fontSize: 14), overflow: TextOverflow.ellipsis),
                  );
                }).toList(),
                onChanged: (value) => setState(() => _selectedBreedId = value),
                validator: (value) => value == null ? l10n.breed : null,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGenderSection(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.gender,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildGenderOption('Đực', 'male', Icons.male)),
            const SizedBox(width: 16),
            Expanded(child: _buildGenderOption('Cái', 'female', Icons.female)),
          ],
        ),
      ],
    );
  }

  Widget _buildGenderOption(String label, String value, IconData icon) {
    final isSelected = _selectedGender == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedGender = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: isSelected ? AppColors.primary : (Colors.grey[200] ?? Colors.grey), width: 1.5),
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: isSelected ? AppColors.primary : Colors.grey[600]),
            const SizedBox(width: 8),
            Text(label,
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: isSelected ? AppColors.primary : Colors.black)),
          ],
        ),
      ),
    );
  }

  Widget _buildBirthdateField(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.birthDate,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        TextFormField(
          controller: birthdateController,
          readOnly: true,
          onTap: _selectDate,
          decoration: _inputDecoration(l10n.birthDate).copyWith(
            suffixIcon: const Icon(Icons.calendar_today, size: 18, color: Colors.grey),
          ),
          validator: (value) => (value == null || value.isEmpty) ? l10n.birthDate : null,
        ),
      ],
    );
  }

  Widget _buildWeightAndFurColorRow(AppLocalizations l10n) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.weight,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              TextFormField(
                controller: weightController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: _inputDecoration('0.0'),
                validator: (value) => (value == null || value.isEmpty) ? l10n.weight : null,
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.furColor,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              TextFormField(
                onChanged: (value) => setState(() => _selectedFurColor = value),
                decoration: _inputDecoration(l10n.furColor),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSaveButton(PetProvider provider, AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: (_isUploadingAvatar || provider.isLoading) ? null : _savePetInfo,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          disabledBackgroundColor: AppColors.primary.withOpacity(0.5),
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: provider.isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text(l10n.save,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200] ?? Colors.grey)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200] ?? Colors.grey)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
    );
  }
}
