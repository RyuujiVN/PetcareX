import 'dart:io';

import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../core/services/camera_service.dart';
import '../data/models/pet_models.dart';
import 'provider/pet_provider.dart';
import 'widgets/pet_form_fields.dart';

class EditPetPage extends StatefulWidget {
  final Pet pet;

  const EditPetPage({super.key, required this.pet});

  @override
  State<EditPetPage> createState() => _EditPetPageState();
}

class _EditPetPageState extends State<EditPetPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController petNameController;
  late TextEditingController weightController;
  late TextEditingController birthdateController;
  late TextEditingController noteController;

  final CameraService _cameraService = CameraService();

  File? _selectedImage;
  String? _uploadedAvatarUrl;
  bool _isUploadingAvatar = false;

  String? _selectedSpeciesId;
  String? _selectedBreedId;
  late String _selectedGender;

  @override
  void initState() {
    super.initState();
    petNameController = TextEditingController(text: widget.pet.name);
    weightController = TextEditingController(text: widget.pet.weight.toString());
    birthdateController = TextEditingController(text: widget.pet.dateOfBirth);
    noteController = TextEditingController(text: widget.pet.note);
    
    _uploadedAvatarUrl = widget.pet.avatar;
    _selectedGender = widget.pet.gender ? 'male' : 'female';
    _selectedBreedId = widget.pet.breedId;
    _selectedSpeciesId = widget.pet.breed?.speciesId;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<PetProvider>();
      provider.setPetAvatarUrl(widget.pet.avatar);
      provider.fetchSpecies();
      
      if (_selectedSpeciesId != null) {
        provider.fetchBreeds(_selectedSpeciesId!);
      }
    });
  }

  @override
  void dispose() {
    petNameController.dispose();
    weightController.dispose();
    birthdateController.dispose();
    noteController.dispose();
    super.dispose();
  }

  String _calculateAge(String dateOfBirthStr, BuildContext context) {
    try {
      final dob = DateTime.parse(dateOfBirthStr);
      final now = DateTime.now();
      final langCode = Localizations.localeOf(context).languageCode;
      
      int years = now.year - dob.year;
      int months = now.month - dob.month;
      int days = now.day - dob.day;

      if (months < 0 || (months == 0 && days < 0)) {
        years--;
        months += 12;
      }

      if (days < 0) {
        final previousMonth = DateTime(now.year, now.month, 0);
        days += previousMonth.day;
        months--;
      }

      if (years > 0) {
        return '$years ${langCode == "vi" ? "tuổi" : "years"}';
      } else if (months > 0) {
        return '$months ${langCode == "vi" ? "tháng" : "months"}';
      } else {
        return '${days == 0 ? 1 : days} ${langCode == "vi" ? "ngày" : "days"}';
      }
    } catch (e) {
      return '';
    }
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
          const SnackBar(content: Text('Success!')),
        );
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
          setState(() {
            _selectedImage = null;
          });
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

  Future<void> _savePetInfo() async {
    final l10n = AppLocalizations.of(context)!;
    if (_isUploadingAvatar) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Uploading...')),
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

      final petDto = PetFormDto(
        name: petNameController.text.trim(),
        gender: _selectedGender == 'male',
        dateOfBirth: birthdateController.text,
        weight: double.tryParse(weightController.text) ?? 0.0,
        avatar: _uploadedAvatarUrl,
        breedId: _selectedBreedId!,
        note: noteController.text.trim(),
      );

      final success = await context.read<PetProvider>().updatePet(widget.pet.id, petDto);

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.success)),
        );
        Navigator.pop(context, true);
      } else if (mounted) {
        final error = context.read<PetProvider>().errorMessage;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error ?? l10n.failed)),
        );
      }
    }
  }

  Future<void> _deletePet() async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDeletePetDialog(context, widget.pet.name);
    if (!confirmed || !mounted) return;

    final success = await context.read<PetProvider>().deletePet(widget.pet.id);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.success)),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      final error = context.read<PetProvider>().errorMessage;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error ?? l10n.failed)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(l10n.myPets,
            style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: _deletePet,
          ),
        ],
      ),
      body: Consumer<PetProvider>(
        builder: (context, petProvider, child) {
          if (petProvider.isLoadingSpecies && petProvider.speciesList.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        PetAvatarPicker(
                          selectedImage: _selectedImage,
                          avatarUrl: _uploadedAvatarUrl ?? petProvider.petAvatarUrl,
                          isUploading: _isUploadingAvatar,
                          onPickImage: _pickImage,
                          compactStyle: true,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          widget.pet.name,
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
                        ),
                        const SizedBox(height: 4),
                        if (widget.pet.breed != null)
                          Text(
                            widget.pet.breed!.name,
                            style: const TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _calculateAge(widget.pet.dateOfBirth, context),
                              style: const TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.bold),
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 8.0),
                              child: Text('•', style: TextStyle(color: Colors.grey)),
                            ),
                            Text(
                              '${widget.pet.weight} kg',
                              style: const TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        
                        Row(
                          children: [
                            const Icon(Icons.pets, color: AppColors.primary, size: 20),
                            const SizedBox(width: 8),
                            Text(l10n.petInformation, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 12),

                        _buildPetNameField(l10n),
                        const SizedBox(height: 12),

                        _buildSpeciesBreedFields(petProvider, l10n),
                        const SizedBox(height: 16),

                        _buildGenderSelector(l10n),
                        const SizedBox(height: 16),

                        _buildBirthdateField(l10n),
                        const SizedBox(height: 16),

                        _buildWeightAndFurColorRow(l10n),
                      ],
                    ),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
                  ],
                ),
                child: SafeArea(
                  child: _buildActionButtons(petProvider, l10n),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPetNameField(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.petName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: petNameController,
          decoration: petInputDecoration(l10n.petName),
          validator: (value) => (value == null || value.isEmpty) ? l10n.petName : null,
        ),
      ],
    );
  }

  Widget _buildSpeciesBreedFields(PetProvider petProvider, AppLocalizations l10n) {
    return PetSpeciesBreedFields(
      selectedSpeciesId: _selectedSpeciesId,
      selectedBreedId: _selectedBreedId,
      speciesList: petProvider.speciesList,
      breedList: petProvider.breedList,
      onSpeciesChanged: (value) {
        setState(() {
          _selectedSpeciesId = value;
          _selectedBreedId = null;
        });
        if (value != null) {
          petProvider.fetchBreeds(value);
        } else {
          petProvider.clearBreeds();
        }
      },
      onBreedChanged: (value) => setState(() => _selectedBreedId = value),
    );
  }

  Widget _buildGenderSelector(AppLocalizations l10n) {
    return PetGenderSelector(
      selectedGender: _selectedGender,
      onChanged: (value) => setState(() => _selectedGender = value),
      showIcons: true,
    );
  }

  Widget _buildBirthdateField(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.birthDate, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: birthdateController,
          readOnly: true,
          onTap: () async {
            await pickPetBirthdate(context, birthdateController, initialDate: DateTime.tryParse(birthdateController.text));
            if (mounted) setState(() {});
          },
          decoration: petInputDecoration('yyyy-mm-dd').copyWith(
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
              Text(l10n.weight, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextFormField(
                controller: weightController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: petInputDecoration('0.0'),
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
              Text(l10n.furColor, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextFormField(
                controller: noteController,
                decoration: petInputDecoration(l10n.furColor),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(PetProvider provider, AppLocalizations l10n) {
    final bool isSaveDisabled = provider.isSubmitting || _isUploadingAvatar;
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 54,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE2E8F0), elevation: 0),
              child: Text(l10n.cancel, style: const TextStyle(color: Colors.black54, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          flex: 2,
          child: SizedBox(
            height: 54,
            child: ElevatedButton(
              onPressed: isSaveDisabled ? null : _savePetInfo,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, elevation: 0),
              child: isSaveDisabled
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(l10n.saveChanges, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
      ],
    );
  }
}
