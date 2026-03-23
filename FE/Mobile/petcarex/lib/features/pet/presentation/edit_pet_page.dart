import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/enums/pet_breed_enum.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../core/services/camera_service.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../data/models/pet_models.dart';
import 'pet_medical_records_page.dart';
import 'provider/pet_provider.dart';
import 'widgets/pet_form_fields.dart';

class EditPetPage extends StatefulWidget {
  final Pet pet;

  const EditPetPage({super.key, required this.pet});

  @override
  State<EditPetPage> createState() => _EditPetPageState();
}

class _EditPetPageState extends State<EditPetPage> {
  static const TextStyle _fieldLabelStyle = TextStyle(
    fontWeight: FontWeight.bold,
    fontSize: 13,
    color: AppColors.text,
  );

  final _formKey = GlobalKey<FormState>();
  late TextEditingController petNameController;
  late TextEditingController weightController;
  late TextEditingController birthdateController;
  late TextEditingController noteController;

  final CameraService _cameraService = CameraService();

  File? _selectedImage;
  String? _uploadedAvatarUrl;
  bool _isUploadingAvatar = false;
  bool _isEditMode = false;

  String? _selectedSpeciesId;
  String? _selectedBreedId;
  late String _selectedGender;

  void _resetFormStateFromPet() {
    petNameController.text = widget.pet.name;
    weightController.text = widget.pet.weight.toString();
    birthdateController.text = _formatDate(widget.pet.dateOfBirth);
    noteController.text = widget.pet.note;

    _selectedImage = null;
    _uploadedAvatarUrl = widget.pet.avatar;
    _selectedGender = widget.pet.gender ? 'male' : 'female';
    _selectedBreedId = widget.pet.breed;
    _selectedSpeciesId = widget.pet.species;
  }

  @override
  void initState() {
    super.initState();
    petNameController = TextEditingController();
    weightController = TextEditingController();
    birthdateController = TextEditingController();
    noteController = TextEditingController();
    _resetFormStateFromPet();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<PetProvider>();
      provider.fetchSpecies();

      if (_selectedSpeciesId != null && _selectedSpeciesId!.isNotEmpty) {
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

  String _formatDate(String source) {
    final parsed = DateTime.tryParse(source);
    if (parsed == null) {
      return source;
    }
    return '${parsed.year}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}';
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
        setState(() {
          _selectedImage = null;
        });
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
      species: _selectedSpeciesId!,
      breed: _selectedBreedId!,
      note: noteController.text.trim(),
    );

    final success = await context.read<PetProvider>().updatePet(
      widget.pet.id,
      petDto,
    );

    if (!mounted) return;

    if (success) {
      _showQuickSnackBar(l10n.petUpdateSuccess, isError: false);
      Navigator.pop(context, true);
      return;
    }

    final error = context.read<PetProvider>().errorMessage;
    _showQuickSnackBar(error ?? l10n.failed);
  }

  void _enterEditMode() {
    setState(() {
      _isEditMode = true;
    });
  }

  void _cancelEditMode() {
    _resetFormStateFromPet();
    final provider = context.read<PetProvider>();
    if (_selectedSpeciesId != null && _selectedSpeciesId!.isNotEmpty) {
      provider.fetchBreeds(_selectedSpeciesId!);
    }
    setState(() {
      _isEditMode = false;
    });
  }

  Future<void> _openMedicalRecordsPage() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PetMedicalRecordsPage(pet: widget.pet),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.petInformation,
          style: const TextStyle(
            color: AppColors.text,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        backgroundColor: AppColors.secondary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.text),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isEditMode ? Icons.edit : Icons.edit_outlined,
              color: _isEditMode ? AppColors.primary : AppColors.text,
            ),
            onPressed: _isEditMode ? null : _enterEditMode,
          ),
        ],
      ),
      body: Consumer<PetProvider>(
        builder: (context, petProvider, child) {
          final shouldStackFields = MediaQuery.sizeOf(context).width < 360;

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
                          child: IgnorePointer(
                            ignoring: !_isEditMode,
                            child: AnimatedOpacity(
                              duration: const Duration(milliseconds: 180),
                              opacity: _isEditMode ? 1 : 0.98,
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
                                      compactStyle: true,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  _buildPetHeader(l10n),
                                  const SizedBox(height: 20),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.pets,
                                        color: AppColors.primary,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        l10n.petInformation,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.text,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  _buildPetNameField(l10n),
                                  const SizedBox(height: 12),
                                  _buildSpeciesBreedFields(
                                    petProvider,
                                    l10n,
                                    shouldStackFields,
                                  ),
                                  const SizedBox(height: 12),
                                  _buildGenderSelector(l10n),
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
                      child: _isEditMode
                          ? _buildEditActionButtons(petProvider, l10n)
                          : _buildMedicalRecordButton(l10n),
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

  Widget _buildPetHeader(AppLocalizations l10n) {
    final String breedLabel =
        PetBreedEnum.fromValue(widget.pet.breed)?.getTranslatedName(context) ??
        widget.pet.breed;

    return Column(
      children: [
        Text(
          widget.pet.name,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppColors.text,
          ),
        ),
        const SizedBox(height: 4),
        if (breedLabel.trim().isNotEmpty)
          Text(
            breedLabel,
            style: const TextStyle(fontSize: 14, color: AppColors.textGrey),
          ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              formatPetAgeFromBirthdate(
                birthdateRaw: birthdateController.text,
                l10n: l10n,
              ),
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8),
              child: Text('•', style: TextStyle(color: AppColors.textGrey)),
            ),
            Text(
              '${widget.pet.weight} kg',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSpeciesBreedFields(
    PetProvider petProvider,
    AppLocalizations l10n,
    bool shouldStackFields,
  ) {
    return PetSpeciesBreedFields(
      l10n: l10n,
      selectedSpeciesId: _selectedSpeciesId,
      selectedBreedId: _selectedBreedId,
      speciesList: petProvider.speciesList,
      breedList: petProvider.breedList,
      vertical: shouldStackFields,
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
          controller: noteController,
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

  Widget _buildMedicalRecordButton(AppLocalizations l10n) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton.icon(
        onPressed: _openMedicalRecordsPage,
        icon: const Icon(Icons.folder_shared_outlined, size: 20),
        label: Text(
          l10n.viewMedicalProfile,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildEditActionButtons(PetProvider provider, AppLocalizations l10n) {
    final bool isSaveDisabled = provider.isSubmitting || _isUploadingAvatar;
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 54,
            child: ElevatedButton(
              onPressed: _cancelEditMode,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.background,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                l10n.cancel,
                style: const TextStyle(
                  color: AppColors.text,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
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
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                disabledBackgroundColor: AppColors.primary.withValues(
                  alpha: 0.5,
                ),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: isSaveDisabled
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: AppColors.onPrimary,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      l10n.saveChanges,
                      style: const TextStyle(
                        color: AppColors.onPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }
}
