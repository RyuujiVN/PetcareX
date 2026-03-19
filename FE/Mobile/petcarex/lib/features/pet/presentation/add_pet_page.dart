import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../core/services/camera_service.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../data/models/pet_models.dart';
import 'provider/pet_provider.dart';
import 'widgets/pet_form_fields.dart';

class AddPetPage extends StatefulWidget {
  const AddPetPage({super.key});

  @override
  State<AddPetPage> createState() => _AddPetPageState();
}

class _AddPetPageState extends State<AddPetPage> {
  static const TextStyle _fieldLabelStyle = TextStyle(
    fontWeight: FontWeight.bold,
    fontSize: 13,
    color: AppColors.text,
  );

  final _formKey = GlobalKey<FormState>();
  final TextEditingController petNameController = TextEditingController();
  final TextEditingController weightController = TextEditingController();
  final TextEditingController birthdateController = TextEditingController();
  final TextEditingController furColorController = TextEditingController();

  final CameraService _cameraService = CameraService();

  File? _selectedImage;
  String? _uploadedAvatarUrl;
  bool _isUploadingAvatar = false;

  String? _selectedSpeciesId;
  String? _selectedBreedId;
  String _selectedGender = 'male';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final provider = context.read<PetProvider>();
      provider.setPetAvatarUrl(null);
      provider.fetchSpecies();
    });
  }

  @override
  void dispose() {
    petNameController.dispose();
    weightController.dispose();
    birthdateController.dispose();
    furColorController.dispose();
    super.dispose();
  }

  void _showQuickSnackBar(String message, {bool isError = true}) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        duration: const Duration(milliseconds: 2200),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _pickImage() async {
    final l10n = AppLocalizations.of(context)!;
    final File? image = await _cameraService.pickImageFromGallery();
    if (!mounted) return;

    if (image != null) {
      setState(() {
        _selectedImage = image;
        _isUploadingAvatar = true;
      });

      try {
        final avatarUrl = await context.read<PetProvider>().uploadAvatar(
          image.path,
        );
        if (!mounted) return;
        setState(() {
          _uploadedAvatarUrl = avatarUrl;
        });
        _showQuickSnackBar(l10n.uploadImageSuccess, isError: false);
      } catch (_) {
        _showQuickSnackBar(l10n.uploadImageFailed);
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
      _showQuickSnackBar(l10n.uploadingImage);
      return;
    }

    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    if (_selectedBreedId == null) {
      _showQuickSnackBar(l10n.pleaseSelect(l10n.breed));
      return;
    }

    final parsedWeight = parsePetWeight(weightController.text);
    if (parsedWeight == null || parsedWeight <= 0) {
      _showQuickSnackBar(l10n.invalidWeight);
      return;
    }
    if (parsedWeight > petWeightMax) {
      _showQuickSnackBar(l10n.invalidWeightMax);
      return;
    }

    final parsedBirthDate = DateTime.tryParse(birthdateController.text.trim());
    if (parsedBirthDate == null) {
      _showQuickSnackBar(l10n.pleaseEnter(l10n.birthDate));
      return;
    }

    final petDto = PetFormDto(
      name: petNameController.text.trim(),
      gender: _selectedGender == 'male',
      dateOfBirth: parsedBirthDate.toUtc().toIso8601String(),
      weight: parsedWeight,
      avatar: _uploadedAvatarUrl,
      breedId: _selectedBreedId!,
      note: furColorController.text.trim(),
    );

    final success = await context.read<PetProvider>().createPet(petDto);

    if (!mounted) return;

    if (success) {
      _showQuickSnackBar(l10n.success, isError: false);
      Navigator.pop(context, true);
      return;
    }

    final error = context.read<PetProvider>().errorMessage;
    _showQuickSnackBar(error ?? l10n.failed);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.secondary,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.addPet,
          style: const TextStyle(
            color: AppColors.text,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: Consumer<PetProvider>(
        builder: (context, petProvider, child) {
          final shouldStackFields = MediaQuery.sizeOf(context).width < 360;
          final isSaving = petProvider.isSubmitting || _isUploadingAvatar;

          return Column(
            children: [
              if (petProvider.isLoadingSpecies)
                const LinearProgressIndicator(
                  minHeight: 2,
                  color: AppColors.primary,
                ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 560),
                      child: SizedBox(
                        width: double.infinity,
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Align(
                                alignment: Alignment.center,
                                child: PetAvatarPicker(
                                  selectedImage: _selectedImage,
                                  avatarUrl: _uploadedAvatarUrl,
                                  isUploading: _isUploadingAvatar,
                                  onPickImage: _pickImage,
                                  uploadLabel: l10n.uploadPhoto,
                                ),
                              ),
                              const SizedBox(height: 28),
                              _buildPetNameField(l10n),
                              const SizedBox(height: 12),
                              _buildSpeciesBreedFields(
                                petProvider,
                                l10n,
                                shouldStackFields,
                              ),
                              const SizedBox(height: 12),
                              _buildGenderSection(l10n),
                              const SizedBox(height: 12),
                              PetBirthdateAgeFields(
                                l10n: l10n,
                                birthdateController: birthdateController,
                                vertical: shouldStackFields,
                                onBirthdateChanged: () {
                                  if (mounted) {
                                    setState(() {});
                                  }
                                },
                              ),
                              const SizedBox(height: 12),
                              _buildWeightAndFurColorSection(
                                l10n,
                                shouldStackFields,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.textAlpha(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 560),
                      child: SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton(
                          onPressed: isSaving ? null : _savePetInfo,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            disabledBackgroundColor: AppColors.primary
                                .withValues(alpha: 0.5),
                            foregroundColor: AppColors.onPrimary,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: isSaving
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(
                                    color: AppColors.onPrimary,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  l10n.save,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  ),
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
        Text(l10n.petName, style: _fieldLabelStyle),
        const SizedBox(height: 8),
        TextFormField(
          controller: petNameController,
          decoration: petInputDecoration(l10n.petName),
          validator: (value) => validateRequiredField(
            value: value,
            l10n: l10n,
            fieldLabel: l10n.petName,
          ),
        ),
      ],
    );
  }

  Widget _buildSpeciesBreedFields(
    PetProvider provider,
    AppLocalizations l10n,
    bool shouldStackFields,
  ) {
    return PetSpeciesBreedFields(
      l10n: l10n,
      selectedSpeciesId: _selectedSpeciesId,
      selectedBreedId: _selectedBreedId,
      speciesList: provider.speciesList,
      breedList: provider.breedList,
      vertical: shouldStackFields,
      onSpeciesChanged: (value) {
        setState(() {
          _selectedSpeciesId = value;
          _selectedBreedId = null;
        });
        if (value != null) {
          provider.fetchBreeds(value);
        } else {
          provider.clearBreeds();
        }
      },
      onBreedChanged: (value) => setState(() => _selectedBreedId = value),
    );
  }

  Widget _buildGenderSection(AppLocalizations l10n) {
    return PetGenderSelector(
      l10n: l10n,
      selectedGender: _selectedGender,
      onChanged: (value) => setState(() => _selectedGender = value),
      showIcons: true,
    );
  }

  Widget _buildWeightAndFurColorSection(
    AppLocalizations l10n,
    bool shouldStackFields,
  ) {
    final weightField = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.weight, style: _fieldLabelStyle),
        const SizedBox(height: 8),
        TextFormField(
          controller: weightController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: petInputDecoration('0.0'),
          validator: (value) => validatePetWeight(value: value, l10n: l10n),
        ),
      ],
    );

    final furColorField = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.furColor, style: _fieldLabelStyle),
        const SizedBox(height: 8),
        TextFormField(
          controller: furColorController,
          decoration: petInputDecoration(
            l10n.furColor,
            reserveErrorSpace: true,
          ),
          validator: (value) => validateRequiredField(
            value: value,
            l10n: l10n,
            fieldLabel: l10n.furColor,
          ),
        ),
      ],
    );

    if (shouldStackFields) {
      return Column(
        children: [weightField, const SizedBox(height: 12), furColorField],
      );
    }

    return Row(
      children: [
        Expanded(child: weightField),
        const SizedBox(width: 16),
        Expanded(child: furColorField),
      ],
    );
  }
}
