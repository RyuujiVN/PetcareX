import '../constants/app_constants.dart';

class ApiHelper {
  static String buildEndpoint(
    String path, {
    Map<String, Object?> queryParameters = const <String, Object?>{},
  }) {
    final normalizedQuery = <String, String>{};

    for (final entry in queryParameters.entries) {
      final value = entry.value;
      if (value == null) {
        continue;
      }

      if (value is String) {
        final normalized = value.trim();
        if (normalized.isEmpty) {
          continue;
        }
        normalizedQuery[entry.key] = normalized;
        continue;
      }

      normalizedQuery[entry.key] = value.toString();
    }

    if (normalizedQuery.isEmpty) {
      return path;
    }

    return Uri(path: path, queryParameters: normalizedQuery).toString();
  }

  // Dynamic endpoint helpers
  static String userByIdEndpoint(String userId) =>
      '${AppConstants.END_POINT_USER}/$userId';

  static String petByIdEndpoint(String petId) =>
      '${AppConstants.END_POINT_PET}/$petId';

  static String petBreedsEndpoint(String speciesId) =>
      '${AppConstants.END_POINT_PET_SPECIES}/$speciesId/${AppConstants.END_POINT_PET_BREED_SUFFIX}';

  static String clinicByIdEndpoint(String clinicId) =>
      '${AppConstants.END_POINT_CLINIC}/$clinicId';

  static String veterinarianByIdEndpoint(String veterinarianId) =>
      '${AppConstants.END_POINT_VETERINARIAN}/$veterinarianId';

  static String appointmentByIdEndpoint(String appointmentId) =>
      '${AppConstants.END_POINT_APPOINTMENT}/$appointmentId';

    static String appointmentAiDiagnosisByIdEndpoint(String appointmentId) =>
      '${appointmentByIdEndpoint(appointmentId)}/ai-diagnosis';

  static String appointmentClientByIdEndpoint(String appointmentId) =>
      '${AppConstants.END_POINT_APPOINTMENT_CLIENT}/$appointmentId';

  static String medicalByIdEndpoint(String medicalRecordId) =>
      '${AppConstants.END_POINT_MEDICAL}/$medicalRecordId';

  static String medicalByPetIdEndpoint(String petId) =>
      '${AppConstants.END_POINT_MEDICAL_PET}/$petId';

  static String medicalOrdersByMedicalIdEndpoint(String medicalRecordId) =>
      '${medicalByIdEndpoint(medicalRecordId)}/medical-order';

  static String medicalMedicinesByMedicalIdEndpoint(String medicalRecordId) =>
      '${medicalByIdEndpoint(medicalRecordId)}/medicine';

  static String medicalMedicineByIdEndpoint(String medicineId) =>
      '${AppConstants.END_POINT_MEDICAL_MEDICINE}/$medicineId';

  static String medicalOrderByIdEndpoint(String medicalOrderId) =>
      '${AppConstants.END_POINT_MEDICAL_ORDER}/$medicalOrderId';

  static String medicineByIdEndpoint(String medicineId) =>
      '${AppConstants.END_POINT_MEDICINE}/$medicineId';

  static String postByIdEndpoint(String postId) =>
      '${AppConstants.END_POINT_POST}/$postId';

  static String postLikeEndpoint(String postId) =>
      '${postByIdEndpoint(postId)}/${AppConstants.END_POINT_POST_LIKE_SUFFIX}';

  static String postUnlikeEndpoint(String postId) =>
      '${postByIdEndpoint(postId)}/${AppConstants.END_POINT_POST_REMOVE_LIKE_SUFFIX}';

  static String postCommentsEndpoint(String postId) =>
      '${postByIdEndpoint(postId)}/${AppConstants.END_POINT_POST_COMMENTS_SUFFIX}';

  static String commentByIdEndpoint(String commentId) =>
      '${AppConstants.END_POINT_COMMENT}/$commentId';

  static String topicByIdEndpoint(String topicId) =>
      '${AppConstants.END_POINT_TOPIC}/$topicId';

  static String invoiceByMedicalRecordIdEndpoint(String medicalRecordId) =>
      '${AppConstants.END_POINT_INVOICE}/$medicalRecordId';

  static String invoiceByIdEndpoint(String invoiceId) =>
      '${AppConstants.END_POINT_INVOICE}/$invoiceId';

  static String roomMessagesEndpoint(String roomId) =>
      '${AppConstants.END_POINT_ROOM}/$roomId/messages';

  // Query endpoint helpers
  static String appointmentMyEndpoint({int page = 1, int limit = 10}) =>
      buildEndpoint(
        AppConstants.END_POINT_APPOINTMENT_MY,
        queryParameters: <String, Object?>{'page': page, 'limit': limit},
      );

  static String clinicsEndpoint({
    int page = 1,
    int limit = 10,
    String? search,
  }) => buildEndpoint(
    AppConstants.END_POINT_CLINIC,
    queryParameters: <String, Object?>{
      'page': page,
      'limit': limit,
      'search': search,
    },
  );

  // Endpoint /clinic/user — sort theo distance dựa trên lat/lon, mỗi clinic kèm field `distance` (km).
  // Role cho phép: ADMIN / ADMIN_CLINIC / VETERINARIAN / CUSTOMER. lat/lon là param bắt buộc của BE.
  static String nearbyClinicsEndpoint({
    int page = 1,
    int limit = 20,
    required double lat,
    required double lon,
    String sortBy = 'distance',
    String? search,
  }) => buildEndpoint(
    '${AppConstants.END_POINT_CLINIC}/user',
    queryParameters: <String, Object?>{
      'page': page,
      'limit': limit,
      'lat': lat,
      'lon': lon,
      'sortBy': sortBy,
      'search': search,
    },
  );

  static String veterinariansEndpoint({
    int page = 1,
    int limit = 10,
    String? clinicId,
    String? specialty,
  }) => buildEndpoint(
    AppConstants.END_POINT_VETERINARIAN,
    queryParameters: <String, Object?>{
      'page': page,
      'limit': limit,
      'clinicId': clinicId,
      'specialty': specialty,
    },
  );

  static String postsEndpoint({
    String? lastPostTime,
    int limit = 20,
    String? topicId,
    String? keyword,
  }) => buildEndpoint(
    AppConstants.END_POINT_POST,
    queryParameters: <String, Object?>{
      'limit': limit,
      'lastPostTime': lastPostTime,
      'topicId': topicId,
      'keyword': keyword,
    },
  );

  static String topicsEndpoint({
    int page = 1,
    int limit = 20,
    String? search,
  }) => buildEndpoint(
    AppConstants.END_POINT_TOPIC,
    queryParameters: <String, Object?>{
      'page': page,
      'limit': limit,
      'search': search,
    },
  );

  static String postCommentsListEndpoint(
    String postId, {
    int limit = 10,
    String? lastCreatedAt,
  }) => buildEndpoint(
    postCommentsEndpoint(postId),
    queryParameters: <String, Object?>{
      'limit': limit,
      'createdAt': lastCreatedAt,
    },
  );

  static String commentRepliesEndpoint({
    required String parentId,
    int limit = 10,
    String? lastCreatedAt,
  }) => buildEndpoint(
    AppConstants.END_POINT_COMMENT_REPLIES,
    queryParameters: <String, Object?>{
      'parentId': parentId,
      'limit': limit,
      'createdAt': lastCreatedAt,
    },
  );

  static String chatRoomsEndpoint({
    int limit = 10,
    String? createdAt,
  }) => buildEndpoint(
    AppConstants.END_POINT_ROOM,
    queryParameters: <String, Object?>{
      'limit': limit,
      'createdAt': createdAt,
    },
  );

  static String chatMessagesEndpoint(
    String roomId, {
    int limit = 10,
    String? createdAt,
  }) => buildEndpoint(
    roomMessagesEndpoint(roomId),
    queryParameters: <String, Object?>{
      'limit': limit,
      'createdAt': createdAt,
    },
  );

  // Clinic Review endpoint helpers
  static String clinicReviewsEndpoint({
    int page = 1,
    int limit = 10,
    String? clinicId,
  }) => buildEndpoint(
    AppConstants.END_POINT_CLINIC_REVIEW,
    queryParameters: <String, Object?>{
      'page': page,
      'limit': limit,
      'clinicId': clinicId,
    },
  );

  static String clinicReviewByIdEndpoint(String reviewId) =>
      '${AppConstants.END_POINT_CLINIC_REVIEW}/$reviewId';

  // Clinic homepage setting endpoint
  static String clinicHomepageSettingByIdEndpoint(String clinicId) =>
      '${AppConstants.END_POINT_CLINIC_HOMEPAGE_SETTING}/$clinicId';
}
