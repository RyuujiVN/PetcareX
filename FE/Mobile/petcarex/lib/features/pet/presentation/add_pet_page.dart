import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../core/services/camera_service.dart';
import '../data/models/pet_models.dart';
import 'provider/pet_provider.dart';
import 'widgets/pet_form_fields.dart';

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
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Tải ảnh thành công!')),
          );
        }
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
          const SnackBar(content: Text('Vui lòng chọn thông tin loài và giống!')),
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
        note: _selectedFurColor ?? "",
      );

      final success = await context.read<PetProvider>().createPet(petDto);

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thêm thú cưng thành công!')),
        );
        Navigator.pop(context, true);
      } else if (mounted) {
        final error = context.read<PetProvider>().errorMessage;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error ?? 'Thêm thất bại. Vui lòng thử lại!')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
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
        title: const Text(
          'Thêm thú cưng mới',
          style: TextStyle(
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
                  // Avatar
                  PetAvatarPicker(
                    selectedImage: _selectedImage,
                    avatarUrl: _uploadedAvatarUrl ?? petProvider.petAvatarUrl,
                    isUploading: _isUploadingAvatar,
                    onPickImage: _pickImage,
                    compactStyle: false,
                  ),
                  const SizedBox(height: 32),

                  // Pet Name
                  _buildPetNameField(),
                  const SizedBox(height: 20),

                  // Species & Breed
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
                      } else {
                        petProvider.clearBreeds();
                      }
                    },
                    onBreedChanged: (value) => setState(() => _selectedBreedId = value),
                  ),
                  const SizedBox(height: 20),

                  // Gender
                  PetGenderSelector(
                    selectedGender: _selectedGender,
                    onChanged: (value) => setState(() => _selectedGender = value),
                    showIcons: true,
                  ),
                  const SizedBox(height: 20),

                  // Birthdate
                  _buildBirthdateField(),
                  const SizedBox(height: 20),

                  // Weight & Fur Color
                  _buildWeightAndFurColorRow(),
                  const SizedBox(height: 32),

                  // Save Button
                  _buildSaveButton(petProvider),
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
        const Text('Tên thú cưng',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        TextFormField(
          controller: petNameController,
          decoration: petInputDecoration('Nhập tên thú cưng'),
          validator: (value) =>
              (value == null || value.isEmpty) ? 'Vui lòng nhập tên thú cưng' : null,
        ),
      ],
    );
  }

  Widget _buildBirthdateField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Ngày sinh',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        TextFormField(
          controller: birthdateController,
          readOnly: true,
          onTap: () async {
            await pickPetBirthdate(context, birthdateController);
            if (mounted) setState(() {});
          },
          decoration: petInputDecoration('yyyy-mm-dd').copyWith(
            suffixIcon: const Icon(Icons.calendar_today, size: 18, color: Colors.grey),
          ),
          validator: (value) => (value == null || value.isEmpty) ? 'Vui lòng chọn ngày sinh' : null,
        ),
      ],
    );
  }

  Widget _buildWeightAndFurColorRow() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Cân nặng (kg)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              TextFormField(
                controller: weightController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: petInputDecoration('0.0'),
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Màu lông',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              TextFormField(
                onChanged: (value) => setState(() => _selectedFurColor = value),
                decoration: petInputDecoration('VD: Trắng sữa'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSaveButton(PetProvider provider) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: (_isUploadingAvatar || provider.isSubmitting) ? null : _savePetInfo,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          disabledBackgroundColor: AppColors.primary.withOpacity(0.5),
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: provider.isSubmitting
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Text('Lưu thông tin',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
