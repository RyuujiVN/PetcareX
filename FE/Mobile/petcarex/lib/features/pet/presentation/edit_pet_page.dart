import 'dart:io';

import 'package:flutter/material.dart';
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

  String _calculateAge(String dateOfBirthStr) {
    try {
      final dob = DateTime.parse(dateOfBirthStr);
      final now = DateTime.now();
      
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
        return '$years tuổi';
      } else if (months > 0) {
        return '$months tháng';
      } else {
        return '${days == 0 ? 1 : days} ngày';
      }
    } catch (e) {
      return '';
    }
  }

  Future<void> _pickImage() async {
    final File? image = await _cameraService.pickImageFromGallery();
    if (!mounted) return; // Bug fix: added mounted check after async gap
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
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Tải ảnh lên thành công!')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi khi tải ảnh: ${e.toString()}')),
          );
          setState(() {
            _selectedImage = null; // Revert on fail
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
    if (_isUploadingAvatar) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đang tải ảnh lên, vui lòng đợi!')),
      );
      return;
    }

    if (_formKey.currentState?.validate() ?? false) {
      if (_selectedBreedId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng chọn giống thú cưng')),
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
          const SnackBar(content: Text('Cập nhật thú cưng thành công!')),
        );
        Navigator.pop(context, true);
      } else if (mounted) {
        final error = context.read<PetProvider>().errorMessage;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error ?? 'Có lỗi xảy ra, vui lòng thử lại!')),
        );
      }
    }
  }

  Future<void> _deletePet() async {
    final confirmed = await showDeletePetDialog(context, widget.pet.name);
    if (!confirmed || !mounted) return;

    final success = await context.read<PetProvider>().deletePet(widget.pet.id);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã xóa thú cưng thành công!')),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      final error = context.read<PetProvider>().errorMessage;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error ?? 'Xóa thất bại. Vui lòng thử lại!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Thú cưng của tôi',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18)),
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
            tooltip: 'Xóa thú cưng',
            onPressed: _deletePet,
          ),
        ],
      ),
      body: Consumer<PetProvider>(
        builder: (context, petProvider, child) {
          if (petProvider.isLoadingSpecies && petProvider.speciesList.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Avatar
                  PetAvatarPicker(
                    selectedImage: _selectedImage,
                    avatarUrl: _uploadedAvatarUrl ?? petProvider.petAvatarUrl,
                    isUploading: _isUploadingAvatar,
                    onPickImage: _pickImage,
                    compactStyle: true,
                  ),
                  const SizedBox(height: 12),

                  // Pet info header
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
                        _calculateAge(widget.pet.dateOfBirth),
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
                  const SizedBox(height: 24),
                  
                  const Row(
                    children: [
                      Icon(Icons.pets, color: AppColors.primary, size: 20),
                      SizedBox(width: 8),
                      Text('Thông tin thú cưng', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Pet Name
                  _buildPetNameField(),
                  const SizedBox(height: 16),

                  // Species & Breed (vertical layout for edit page)
                  PetSpeciesBreedFields(
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
                      }
                    },
                    onBreedChanged: (value) => setState(() => _selectedBreedId = value),
                    vertical: true,
                  ),
                  const SizedBox(height: 16),

                  // Gender & Birthdate Row
                  _buildGenderAndBirthdateRow(),
                  const SizedBox(height: 16),

                  // Weight
                  _buildWeightField(),
                  const SizedBox(height: 16),

                  // Fur Color / Notes
                  _buildFurColorField(),
                  const SizedBox(height: 16),

                  // Owner
                  _buildOwnerField(),
                  const SizedBox(height: 32),

                  // Action Buttons
                  _buildActionButtons(petProvider),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPetNameField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tên thú cưng', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: petNameController,
          decoration: petInputDecoration('Tên thú cưng'),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Vui lòng nhập tên thú cưng';
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildGenderAndBirthdateRow() {
    return Row(
      children: [
        Expanded(
          flex: 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Giới tính', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: _buildGenderOption('Đực', 'male')),
                  const SizedBox(width: 8),
                  Expanded(child: _buildGenderOption('Cái', 'female')),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          flex: 1,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Ngày sinh / Tuổi', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () async {
                  await pickPetBirthdate(
                    context,
                    birthdateController,
                    initialDate: DateTime.tryParse(birthdateController.text),
                  );
                  if (mounted) setState(() {});
                },
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[200] ?? Colors.grey),
                  ),
                  alignment: Alignment.centerLeft,
                  child: Text(
                    birthdateController.text.isNotEmpty ? _calculateAge(birthdateController.text) : 'Chọn ngày',
                    style: TextStyle(
                      color: birthdateController.text.isNotEmpty ? Colors.black : Colors.grey[400],
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGenderOption(String label, String value) {
    final isSelected = _selectedGender == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedGender = value),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEAF9F7) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.primary : (Colors.grey[200] ?? Colors.grey)),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppColors.primary : Colors.black,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildWeightField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Cân nặng (kg)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: weightController,
          keyboardType: TextInputType.number,
          decoration: petInputDecoration('Cân nặng (kg)'),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Vui lòng nhập cân nặng';
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildFurColorField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Màu lông / Đặc điểm nhận dạng', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: noteController,
          decoration: petInputDecoration('Màu lông / Đặc điểm nhận dạng'),
        ),
      ],
    );
  }

  Widget _buildOwnerField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tên chủ thú cưng', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          readOnly: true,
          initialValue: 'Me',
          decoration: petInputDecoration('Tên chủ thú cưng').copyWith(
            fillColor: Colors.grey[100],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(PetProvider provider) {
    final bool isSaveDisabled = provider.isSubmitting || _isUploadingAvatar;
    return Row(
      children: [
        Expanded(
          flex: 1,
          child: SizedBox(
            height: 54,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE2E8F0),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Hủy', style: TextStyle(color: Colors.black54, fontSize: 16, fontWeight: FontWeight.bold)),
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
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: isSaveDisabled
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Lưu thay đổi', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
      ],
    );
  }
}
