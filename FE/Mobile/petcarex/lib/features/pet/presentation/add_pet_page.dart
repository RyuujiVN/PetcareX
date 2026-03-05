import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../core/services/camera_service.dart';

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
  final ApiClient _apiClient = ApiClient();

  File? _selectedImage;
  String? _uploadedAvatarUrl;
  bool _isUploading = false;
  bool _isSaving = false;

  List<dynamic> _speciesList = [];
  List<dynamic> _breedList = [];
  String? _selectedSpeciesId;
  String? _selectedBreedId;

  String _selectedGender = 'male'; // Mặc định là đực
  String? _selectedFurColor;

  @override
  void initState() {
    super.initState();
    _fetchSpecies();
  }

  @override
  void dispose() {
    petNameController.dispose();
    weightController.dispose();
    birthdateController.dispose();
    super.dispose();
  }

  Future<void> _fetchSpecies() async {
    try {
      final response = await _apiClient.get('/pet/species');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _speciesList = jsonDecode(response.body);
          });
        }
      }
    } catch (e) {
      debugPrint("Error fetching species: $e");
    }
  }

  Future<void> _fetchBreeds(String speciesId) async {
    try {
      final response = await _apiClient.get('/pet/species/$speciesId/breed');
      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _breedList = jsonDecode(response.body);
          });
        }
      }
    } catch (e) {
      debugPrint("Error fetching breeds: $e");
    }
  }

  Future<void> _pickImage() async {
    final File? image = await _cameraService.pickImageFromGallery();
    if (image != null) {
      setState(() {
        _selectedImage = image;
        _isUploading = true;
      });

      try {
        final response = await _apiClient.postMultipart('/pet/upload', image.path);
        if (response.statusCode == 201 || response.statusCode == 200) {
          final data = jsonDecode(response.body);
          setState(() {
            _uploadedAvatarUrl = data['file'];
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Tải ảnh thành công!')),
            );
          }
        } else {
          throw Exception('Failed to upload');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lỗi tải ảnh. Vui lòng thử lại!')),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isUploading = false;
          });
        }
      }
    }
  }

  Future<void> _selectDate() async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
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
      setState(() {
        // Format YYYY-MM-DD
        birthdateController.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _savePetInfo() async {
    if (_isUploading) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đang tải ảnh lên, vui lòng đợi!')),
      );
      return;
    }

    if (_formKey.currentState!.validate()) {
      if (_selectedBreedId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vui lòng chọn thông tin loài và giống!')),
        );
        return;
      }

      setState(() {
        _isSaving = true;
      });

      try {
        final Map<String, dynamic> requestBody = {
          "name": petNameController.text.trim(),
          "gender": _selectedGender == 'male',
          "dateOfBirth": birthdateController.text,
          "weight": double.tryParse(weightController.text) ?? 0.0,
          if (_uploadedAvatarUrl != null) "avatar": _uploadedAvatarUrl,
          "breedId": _selectedBreedId,
          "note": _selectedFurColor ?? "",
        };

        final response = await _apiClient.post('/pet', requestBody);
        
        if (response.statusCode == 201 || response.statusCode == 200) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Thêm thú cưng thành công!')),
            );
            Navigator.pop(context, true); // Trả về true để màn hình trước biết có cập nhật
          }
        } else {
          final errorData = jsonDecode(response.body);
          final msg = errorData['message'] ?? 'Có lỗi xảy ra';
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Thêm thất bại: $msg')),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Lỗi kết nối mạng!')),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isSaving = false;
          });
        }
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _buildAvatarSection(),
              const SizedBox(height: 32),
              _buildPetNameField(),
              const SizedBox(height: 20),
              _buildTypeAndBreedRow(),
              const SizedBox(height: 20),
              _buildGenderSection(),
              const SizedBox(height: 20),
              _buildBirthdateField(),
              const SizedBox(height: 20),
              _buildWeightAndFurColorRow(),
              const SizedBox(height: 32),
              _buildSaveButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarSection() {
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
                image: _selectedImage != null 
                  ? DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover)
                  : null,
              ),
              child: _selectedImage == null 
                ? Center(child: Icon(Icons.camera_alt, color: Colors.grey[400], size: 40))
                : null,
            ),
            if (_isUploading)
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
          onPressed: _isUploading ? null : _pickImage,
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
              Icon(Icons.camera_alt_outlined, size: 16, color: _isUploading ? Colors.grey : AppColors.primary),
              const SizedBox(width: 6),
              Text(
                _isUploading ? 'Đang tải...' : 'Tải ảnh lên',
                style: TextStyle(color: _isUploading ? Colors.grey : AppColors.primary),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPetNameField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Tên thú cưng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        TextFormField(
          controller: petNameController,
          decoration: _inputDecoration('Nhập tên thú cưng'),
          validator: (value) => (value == null || value.isEmpty) ? 'Vui lòng nhập tên thú cưng' : null,
        ),
      ],
    );
  }

  Widget _buildTypeAndBreedRow() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Loài', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                isExpanded: true,
                value: _selectedSpeciesId,
                decoration: _inputDecoration('Chọn loài'),
                hint: const Text('Chọn loài', style: TextStyle(fontSize: 14)),
                items: _speciesList.map<DropdownMenuItem<String>>((species) {
                  return DropdownMenuItem<String>(
                    value: species['id'],
                    child: Text(species['name'], style: const TextStyle(fontSize: 14)),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSpeciesId = value;
                    _selectedBreedId = null; // Reset giống khi đổi loài
                    _breedList = [];
                  });
                  if (value != null) {
                    _fetchBreeds(value);
                  }
                },
                validator: (value) => value == null ? 'Vui lòng chọn loài' : null,
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Giống', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                isExpanded: true,
                value: _selectedBreedId,
                decoration: _inputDecoration('Chọn giống'),
                hint: const Text('Chọn giống', style: TextStyle(fontSize: 14)),
                items: _breedList.map<DropdownMenuItem<String>>((breed) {
                  return DropdownMenuItem<String>(
                    value: breed['id'],
                    child: Text(breed['name'], style: const TextStyle(fontSize: 14), overflow: TextOverflow.ellipsis),
                  );
                }).toList(),
                onChanged: (value) => setState(() => _selectedBreedId = value),
                validator: (value) => value == null ? 'Vui lòng chọn giống' : null,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGenderSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Giới tính', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
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
          border: Border.all(color: isSelected ? AppColors.primary : Colors.grey[200]!, width: 1.5),
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: isSelected ? AppColors.primary : Colors.grey[600]),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: isSelected ? AppColors.primary : Colors.black)),
          ],
        ),
      ),
    );
  }

  Widget _buildBirthdateField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Ngày sinh', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
        const SizedBox(height: 8),
        TextFormField(
          controller: birthdateController,
          readOnly: true,
          onTap: _selectDate,
          decoration: _inputDecoration('yyyy-mm-dd').copyWith(
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
              const Text('Cân nặng (kg)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              TextFormField(
                controller: weightController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: _inputDecoration('0.0'),
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Màu lông', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey)),
              const SizedBox(height: 8),
              TextFormField(
                onChanged: (value) => setState(() => _selectedFurColor = value),
                decoration: _inputDecoration('VD: Trắng sữa'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton(
        onPressed: (_isUploading || _isSaving) ? null : _savePetInfo,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          disabledBackgroundColor: AppColors.primary.withOpacity(0.5),
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _isSaving 
            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Text('Lưu thông tin', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey[200]!)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
    );
  }
}
