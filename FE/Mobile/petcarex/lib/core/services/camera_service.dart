import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';

class CameraService {
  final ImagePicker _picker = ImagePicker();

  /// Hàm công khai để xin quyền Camera từ bất cứ đâu
  Future<bool> requestCameraPermission() async {
    var status = await Permission.camera.status;
    if (status.isGranted) return true;
    
    status = await Permission.camera.request();
    return status.isGranted;
  }

  /// Hàm công khai để xin quyền Thư viện ảnh
  Future<bool> requestGalleryPermission() async {
    if (Platform.isAndroid) {
      var status = await Permission.photos.status;
      if (status.isGranted) return true;
      status = await Permission.photos.request();
      if (status.isGranted) return true;
    }
    
    var storageStatus = await Permission.storage.status;
    if (storageStatus.isGranted) return true;
    storageStatus = await Permission.storage.request();
    return storageStatus.isGranted;
  }

  /// Chụp ảnh (đã bao gồm xin quyền nội bộ)
  Future<File?> takePhoto() async {
    try {
      bool hasPermission = await requestCameraPermission();
      if (!hasPermission) return null;

      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
      );
      
      return photo != null ? File(photo.path) : null;
    } catch (e) {
      return null;
    }
  }

  /// Chọn ảnh từ thư viện (đã bao gồm xin quyền nội bộ)
  Future<File?> pickImageFromGallery() async {
    try {
      bool hasPermission = await requestGalleryPermission();
      if (!hasPermission) return null;

      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );
      
      return image != null ? File(image.path) : null;
    } catch (e) {
      return null;
    }
  }
}
