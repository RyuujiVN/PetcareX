import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';

class CameraService {
  final ImagePicker _picker = ImagePicker();

  /// Kiểm tra và xin quyền Camera
  Future<bool> _requestCameraPermission() async {
    var status = await Permission.camera.status;
    if (status.isGranted) return true;
    
    status = await Permission.camera.request();
    return status.isGranted;
  }

  /// Kiểm tra và xin quyền Thư viện ảnh
  Future<bool> _requestGalleryPermission() async {
    // Với Android 13+, sử dụng Permission.photos
    if (Platform.isAndroid) {
      // Giả định nếu SDK >= 33, nhưng permission_handler xử lý tốt đa số trường hợp
      var status = await Permission.photos.status;
      if (status.isGranted) return true;
      status = await Permission.photos.request();
      if (status.isGranted) return true;
    }
    
    // Dự phòng cho máy cũ hoặc iOS
    var storageStatus = await Permission.storage.status;
    if (storageStatus.isGranted) return true;
    storageStatus = await Permission.storage.request();
    return storageStatus.isGranted;
  }

  /// Chụp ảnh từ Camera
  Future<File?> takePhoto() async {
    try {
      bool hasPermission = await _requestCameraPermission();
      if (!hasPermission) {
        print("Người dùng từ chối quyền Camera");
        return null;
      }

      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
      );
      
      if (photo != null) {
        return File(photo.path);
      }
      return null;
    } catch (e) {
      print("Lỗi khi chụp ảnh: $e");
      return null;
    }
  }

  /// Chọn ảnh từ Thư viện
  Future<File?> pickImageFromGallery() async {
    try {
      bool hasPermission = await _requestGalleryPermission();
      if (!hasPermission) {
        print("Người dùng từ chối quyền Thư viện");
        return null;
      }

      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );
      
      if (image != null) {
        return File(image.path);
      }
      return null;
    } catch (e) {
      print("Lỗi khi chọn ảnh: $e");
      return null;
    }
  }
}
