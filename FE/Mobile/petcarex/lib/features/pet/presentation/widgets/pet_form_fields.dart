import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_helper.dart';
import '../../data/models/pet_models.dart';

/// ─── Shared InputDecoration ─────────────────────────────────────
InputDecoration petInputDecoration(String hint) {
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[200] ?? Colors.grey)),
    enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey[200] ?? Colors.grey)),
    focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
  );
}

/// ─── Pet Avatar Picker ──────────────────────────────────────────
class PetAvatarPicker extends StatelessWidget {
  final File? selectedImage;
  final String? avatarUrl;
  final bool isUploading;
  final VoidCallback onPickImage;
  /// If true, shows a camera icon overlay button (edit mode style).
  /// If false, shows a text button below the avatar (add mode style).
  final bool compactStyle;

  const PetAvatarPicker({
    super.key,
    required this.selectedImage,
    required this.avatarUrl,
    required this.isUploading,
    required this.onPickImage,
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
              const Text('Tải ảnh lên'),
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
                color: Colors.black.withOpacity(0.4),
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
              color: Colors.black.withOpacity(0.4),
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

/// ─── Gender Selector ────────────────────────────────────────────
class PetGenderSelector extends StatelessWidget {
  final String selectedGender;
  final ValueChanged<String> onChanged;
  /// If true, shows icon-based buttons (add mode style)
  final bool showIcons;

  const PetGenderSelector({
    super.key,
    required this.selectedGender,
    required this.onChanged,
    this.showIcons = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Giới tính',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildOption('Đực', 'male', Icons.male)),
            SizedBox(width: showIcons ? 16 : 8),
            Expanded(child: _buildOption('Cái', 'female', Icons.female)),
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

/// ─── Species & Breed Dropdowns ──────────────────────────────────
class PetSpeciesBreedFields extends StatelessWidget {
  final String? selectedSpeciesId;
  final String? selectedBreedId;
  final List<PetSpecies> speciesList;
  final List<PetBreed> breedList;
  final ValueChanged<String?> onSpeciesChanged;
  final ValueChanged<String?> onBreedChanged;
  /// If true, stacks species and breed vertically. If false, side by side.
  final bool vertical;

  const PetSpeciesBreedFields({
    super.key,
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
        const Text('Loài',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          isExpanded: true,
          value: hasValue ? selectedSpeciesId : null,
          decoration: petInputDecoration('Chọn loài'),
          hint: const Text('Chọn loài', style: TextStyle(fontSize: 14)),
          items: speciesList.map<DropdownMenuItem<String>>((species) {
            return DropdownMenuItem<String>(
              value: species.id,
              child: Text(species.name, style: const TextStyle(fontSize: 14)),
            );
          }).toList(),
          onChanged: onSpeciesChanged,
          validator: (value) => value == null ? 'Vui lòng chọn loài' : null,
        ),
      ],
    );
  }

  Widget _buildBreedDropdown() {
    final bool hasValue = breedList.any((b) => b.id == selectedBreedId);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Giống',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          isExpanded: true,
          value: hasValue ? selectedBreedId : null,
          decoration: petInputDecoration('Chọn giống'),
          hint: const Text('Chọn giống', style: TextStyle(fontSize: 14)),
          items: breedList.map<DropdownMenuItem<String>>((breed) {
            return DropdownMenuItem<String>(
              value: breed.id,
              child: Text(breed.name,
                  style: const TextStyle(fontSize: 14), overflow: TextOverflow.ellipsis),
            );
          }).toList(),
          onChanged: onBreedChanged,
          validator: (value) => value == null ? 'Vui lòng chọn giống' : null,
        ),
      ],
    );
  }
}

/// ─── Date Picker Helper ─────────────────────────────────────────
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

/// ─── Delete Confirmation Dialog ─────────────────────────────────
Future<bool> showDeletePetDialog(BuildContext context, String petName) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Xóa thú cưng', style: TextStyle(fontWeight: FontWeight.bold)),
      content: Text('Bạn có chắc chắn muốn xóa $petName không? Hành động này không thể hoàn tác.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Hủy', style: TextStyle(color: Colors.grey)),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          style: TextButton.styleFrom(foregroundColor: Colors.red),
          child: const Text('Xóa', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
  return result ?? false;
}
