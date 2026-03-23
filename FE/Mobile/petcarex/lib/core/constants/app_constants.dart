import '../configs/app_config.dart';
// bỏ qua lỗi về tên 
// ignore_for_file: constant_identifier_names

class AppConstants {
  // Root Endpoints
    static const String END_POINT_CLOUDINARY = '${AppConfig.apiPrefix}/cloudinary';
  static const String END_POINT_AUTH = '${AppConfig.apiPrefix}/auth';
  static const String END_POINT_USER = '${AppConfig.apiPrefix}/user';
  static const String END_POINT_PET = '${AppConfig.apiPrefix}/pet';
  static const String END_POINT_CLINIC = '${AppConfig.apiPrefix}/clinic';
  static const String END_POINT_VETERINARIAN =
      '${AppConfig.apiPrefix}/veterinarian';
  static const String END_POINT_APPOINTMENT =
      '${AppConfig.apiPrefix}/appointment';
  static const String END_POINT_MEDICAL = '${AppConfig.apiPrefix}/medical';
  static const String END_POINT_MEDICAL_ORDER =
      '${AppConfig.apiPrefix}/medical-order';
  static const String END_POINT_MEDICINE = '${AppConfig.apiPrefix}/medicine';
  static const String END_POINT_POST = '${AppConfig.apiPrefix}/post';
  static const String END_POINT_COMMENT = '${AppConfig.apiPrefix}/comment';
  static const String END_POINT_TOPIC = '${AppConfig.apiPrefix}/topic';
  static const String END_POINT_INVOICE = '${AppConfig.apiPrefix}/invoice';

  // Cloudinary Endpoints
  static const String END_POINT_CLOUDINARY_UPLOAD_ONE_FILE =
      '$END_POINT_CLOUDINARY/upload/one-file';
  static const String END_POINT_CLOUDINARY_UPLOAD_MULTI_FILE =
      '$END_POINT_CLOUDINARY/upload/multi-file';

  // Auth Endpoints
  static const String END_POINT_AUTH_LOGIN = '$END_POINT_AUTH/login';
  static const String END_POINT_AUTH_LOGIN_GOOGLE =
      '$END_POINT_AUTH/login-google';
  static const String END_POINT_AUTH_REGISTER = '$END_POINT_AUTH/register';
  static const String END_POINT_AUTH_FORGOT_PASSWORD =
      '$END_POINT_AUTH/forgot-password';
  static const String END_POINT_AUTH_RESET_PASSWORD =
      '$END_POINT_AUTH/reset-password';
  static const String END_POINT_AUTH_CHANGE_PASSWORD =
      '$END_POINT_AUTH/change-password';

  // User Endpoints
  static const String END_POINT_USER_PROFILE = '$END_POINT_USER/profile';
    static const String END_POINT_USER_UPLOAD =
            END_POINT_CLOUDINARY_UPLOAD_ONE_FILE;

  // Pet Endpoints
  static const String END_POINT_PET_SPECIES = '$END_POINT_PET/species';
    static const String END_POINT_PET_UPLOAD = END_POINT_CLOUDINARY_UPLOAD_ONE_FILE;
  static const String END_POINT_PET_BREED_SUFFIX = 'breed';

  // Clinic Endpoints
    static const String END_POINT_CLINIC_UPLOAD =
            END_POINT_CLOUDINARY_UPLOAD_ONE_FILE;

  // Appointment Endpoints
  static const String END_POINT_APPOINTMENT_MY = '$END_POINT_APPOINTMENT/my';

  // Medical Endpoints
  static const String END_POINT_MEDICAL_CLINIC = '$END_POINT_MEDICAL/clinic';
  static const String END_POINT_MEDICAL_PET = '$END_POINT_MEDICAL/pet';
  static const String END_POINT_MEDICAL_MEDICAL_ORDER =
      '$END_POINT_MEDICAL/medical-order';
  static const String END_POINT_MEDICAL_MEDICINE =
      '$END_POINT_MEDICAL/medicine';

  // Forum Endpoints
  static const String END_POINT_POST_COMMENTS_SUFFIX = 'comments';
  static const String END_POINT_POST_LIKE_SUFFIX = 'like';
  static const String END_POINT_POST_REMOVE_LIKE_SUFFIX = 'remove-like';

  // Comment Endpoints
  static const String END_POINT_COMMENT_REPLIES = '$END_POINT_COMMENT/replies';

  // Topic Endpoints
  static const String END_POINT_TOPIC_GET_ALL = '$END_POINT_TOPIC/get-all';
}
