// Model cho GET /api/clinic-review?clinicId=...&page=&limit=
// Response shape: { items: [...], meta: {...} }
class ClinicReviewAuthor {
  final String id;
  final String fullName;
  final String? avatarUrl;

  const ClinicReviewAuthor({
    required this.id,
    required this.fullName,
    this.avatarUrl,
  });

  factory ClinicReviewAuthor.fromJson(Map<String, dynamic> json) {
    return ClinicReviewAuthor(
      id: (json['id'] ?? '').toString(),
      fullName: (json['fullName'] ?? '').toString(),
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}

class ClinicReviewItem {
  final String id;
  final String clinicId;
  final double rating;
  final String content;
  final DateTime? createdAt;
  final ClinicReviewAuthor? user;

  const ClinicReviewItem({
    required this.id,
    required this.clinicId,
    required this.rating,
    required this.content,
    required this.createdAt,
    required this.user,
  });

  factory ClinicReviewItem.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    return ClinicReviewItem(
      id: (json['id'] ?? '').toString(),
      clinicId: (json['clinicId'] ?? '').toString(),
      rating: _parseDouble(json['rating']),
      content: (json['content'] ?? '').toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      user: (user is Map<String, dynamic>)
          ? ClinicReviewAuthor.fromJson(user)
          : null,
    );
  }

  static double _parseDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }
}
