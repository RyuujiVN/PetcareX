import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_helper.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../data/models/pet_models.dart';

const double petWeightMax = 99.9;

double? parsePetWeight(String? rawValue) {
  if (rawValue == null) {
    return null;
  }
  return double.tryParse(rawValue.trim().replaceAll(',', '.'));
}

InputDecoration petInputDecoration(
  String hint, {
  bool reserveErrorSpace = true,
}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: AppColors.iconGrey, fontSize: 14),
    filled: true,
    fillColor: AppColors.formFill,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.formBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.formBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.error),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.error, width: 1.2),
    ),
    errorMaxLines: 2,
    helperText: reserveErrorSpace ? ' ' : null,
    helperStyle: const TextStyle(fontSize: 11, height: 1),
  );
}

String? validateRequiredField({
  required String? value,
  required AppLocalizations l10n,
  required String fieldLabel,
}) {
  if (value == null || value.trim().isEmpty) {
    return l10n.pleaseEnter(fieldLabel);
  }
  return null;
}

String? validateRequiredSelection({
  required String? value,
  required AppLocalizations l10n,
  required String fieldLabel,
}) {
  if (value == null || value.trim().isEmpty) {
    return l10n.pleaseSelect(fieldLabel);
  }
  return null;
}

String? validatePetWeight({
  required String? value,
  required AppLocalizations l10n,
}) {
  final requiredValidation = validateRequiredField(
    value: value,
    l10n: l10n,
    fieldLabel: l10n.weight,
  );
  if (requiredValidation != null) {
    return requiredValidation;
  }

  final parsed = parsePetWeight(value);
  if (parsed == null || parsed <= 0) {
    return l10n.invalidWeight;
  }
  if (parsed > petWeightMax) {
    return l10n.invalidWeightMax;
  }
  return null;
}

class PetAvatarPicker extends StatelessWidget {
  final File? selectedImage;
  final String? avatarUrl;
  final bool isUploading;
  final VoidCallback onPickImage;
  final String uploadLabel;

  final bool compactStyle;

  const PetAvatarPicker({
    super.key,
    required this.selectedImage,
    required this.avatarUrl,
    required this.isUploading,
    required this.onPickImage,
    this.uploadLabel = 'Upload',
    this.compactStyle = false,
  });

  @override
  Widget build(BuildContext context) {
    if (compactStyle) return _buildCompactAvatar();
    return _buildFullAvatar();
  }

  Widget _buildFullAvatar() {
    return Column(
      children: [
        _buildAvatarCircle(),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: isUploading ? null : onPickImage,
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
                  size: 16, color: isUploading ? Colors.grey : AppColors.primary),
              const SizedBox(width: 6),
              Text(uploadLabel),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCompactAvatar() {
    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.grey[200],
            border: Border.all(color: AppColors.primary, width: 3),
          ),
          child: ClipOval(child: _buildAvatarContent()),
        ),
        if (isUploading)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black.withValues(alpha: 0.4),
              ),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
          ),
        Positioned(
          bottom: 0,
          right: 0,
          child: GestureDetector(
            onTap: isUploading ? null : onPickImage,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAvatarCircle() {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.grey[200],
          ),
          child: ClipOval(child: _buildAvatarContent()),
        ),
        if (isUploading)
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.black.withValues(alpha: 0.4),
            ),
            child: const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          ),
      ],
    );
  }

  Widget _buildAvatarContent() {
    if (selectedImage != null) {
      return Image.file(selectedImage!, fit: BoxFit.cover, width: 100, height: 100);
    }
    if (avatarUrl != null && avatarUrl!.startsWith('http')) {
      return CachedNetworkImage(
        imageUrl: ImageHelper.getThumbnailUrl(avatarUrl!, width: 300, height: 300),
        fit: BoxFit.cover,
        width: 100,
        height: 100,
        errorWidget: (context, url, error) =>
            Icon(Icons.broken_image, color: Colors.grey[400], size: 40),
        placeholder: (context, url) =>
            const Center(child: CircularProgressIndicator()),
      );
    }
    return Icon(Icons.camera_alt, color: Colors.grey[400], size: 40);
  }
}

class PetGenderSelector extends StatelessWidget {
  final AppLocalizations l10n;
  final String selectedGender;
  final ValueChanged<String> onChanged;
  final bool showIcons;

  const PetGenderSelector({
    super.key,
    required this.l10n,
    required this.selectedGender,
    required this.onChanged,
    this.showIcons = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.gender,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: AppColors.formLabel,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildOption(l10n.male, 'male', Icons.male)),
            SizedBox(width: showIcons ? 16 : 8),
            Expanded(child: _buildOption(l10n.female, 'female', Icons.female)),
          ],
        ),
      ],
    );
  }

  Widget _buildOption(String label, String value, IconData icon) {
    final isSelected = selectedGender == value;
    return GestureDetector(
      onTap: () => onChanged(value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected && !showIcons ? const Color(0xFFEAF9F7) : Colors.white,
          border: Border.all(
            color: isSelected ? AppColors.primary : (Colors.grey[200] ?? Colors.grey),
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (showIcons) ...[
              Icon(icon, size: 18, color: isSelected ? AppColors.primary : Colors.grey[600]),
              const SizedBox(width: 8),
            ],
            Text(label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: isSelected ? AppColors.primary : Colors.black,
                )),
          ],
        ),
      ),
    );
  }
}

class PetSpeciesBreedFields extends StatelessWidget {
  final AppLocalizations l10n;
  final String? selectedSpeciesId;
  final String? selectedBreedId;
  final List<PetSpecies> speciesList;
  final List<PetBreed> breedList;
  final ValueChanged<String?> onSpeciesChanged;
  final ValueChanged<String?> onBreedChanged;
  final bool vertical;

  const PetSpeciesBreedFields({
    super.key,
    required this.l10n,
    required this.selectedSpeciesId,
    required this.selectedBreedId,
    required this.speciesList,
    required this.breedList,
    required this.onSpeciesChanged,
    required this.onBreedChanged,
    this.vertical = false,
  });

  @override
  Widget build(BuildContext context) {
    final speciesWidget = _buildSpeciesDropdown();
    final breedWidget = _buildBreedDropdown();

    if (vertical) {
      return Column(
        children: [
          speciesWidget,
          const SizedBox(height: 16),
          breedWidget,
        ],
      );
    }

    return Row(
      children: [
        Expanded(child: speciesWidget),
        const SizedBox(width: 16),
        Expanded(child: breedWidget),
      ],
    );
  }

  Widget _buildSpeciesDropdown() {
    final bool hasValue = speciesList.any((s) => s.id == selectedSpeciesId);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.species,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: AppColors.formLabel,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          isExpanded: true,
          initialValue: hasValue ? selectedSpeciesId : null,
          decoration: petInputDecoration(l10n.species),
          hint: Text(l10n.species, style: const TextStyle(fontSize: 14)),
          items: speciesList.map<DropdownMenuItem<String>>((species) {
            return DropdownMenuItem<String>(
              value: species.id,
              child: Text(species.name, style: const TextStyle(fontSize: 14)),
            );
          }).toList(),
          onChanged: onSpeciesChanged,
          validator: (value) => validateRequiredSelection(
            value: value,
            l10n: l10n,
            fieldLabel: l10n.species,
          ),
        ),
      ],
    );
  }

  Widget _buildBreedDropdown() {
    final bool isBreedEnabled =
        selectedSpeciesId != null && selectedSpeciesId!.isNotEmpty;
    final bool hasValue = breedList.any((b) => b.id == selectedBreedId);
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 180),
      opacity: isBreedEnabled ? 1 : 0.55,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.breed,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: isBreedEnabled ? AppColors.formLabel : AppColors.textGrey,
            ),
          ),
          const SizedBox(height: 8),
          IgnorePointer(
            ignoring: !isBreedEnabled,
            child: DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: isBreedEnabled && hasValue ? selectedBreedId : null,
              decoration: petInputDecoration(
                isBreedEnabled ? l10n.breed : l10n.selectSpeciesFirst,
              ).copyWith(
                fillColor: isBreedEnabled
                    ? AppColors.formFill
                    : AppColors.formFillDisabled,
              ),
              hint: Text(
                isBreedEnabled ? l10n.breed : l10n.selectSpeciesFirst,
                style: const TextStyle(fontSize: 14),
              ),
              items: isBreedEnabled
                  ? breedList.map<DropdownMenuItem<String>>((breed) {
                      return DropdownMenuItem<String>(
                        value: breed.id,
                        child: Text(
                          breed.name,
                          style: const TextStyle(fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList()
                  : const [],
              onChanged: isBreedEnabled ? onBreedChanged : null,
              validator: (value) {
                if (!isBreedEnabled) {
                  return null;
                }
                return validateRequiredSelection(
                  value: value,
                  l10n: l10n,
                  fieldLabel: l10n.breed,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

Future<void> pickPetBirthdate(
  BuildContext context,
  TextEditingController controller, {
  DateTime? initialDate,
}) async {
  DateTime? picked = await showDatePicker(
    context: context,
    initialDate: initialDate ?? DateTime.now(),
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
  if (picked != null) {
    controller.text =
        "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
  }
}

Future<bool> showDeletePetDialog(BuildContext context, String petName) async {
  final l10n = AppLocalizations.of(context)!;
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        l10n.confirmDelete,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      content: Text(l10n.deletePetMessage(petName)),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text(l10n.cancel, style: const TextStyle(color: AppColors.textGrey)),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          style: TextButton.styleFrom(foregroundColor: Colors.red),
          child: Text(l10n.delete, style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
  return result ?? false;
}
