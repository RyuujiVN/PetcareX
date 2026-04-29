// Model cho GET /api/clinic-homepage-setting/{clinicId}
// Response shape: { banner: {title, subtitle}, introduction, services[], workingHours, contactPhone }
// Tolerant parser — chịu được khi BE thiếu field hoặc trả null.
class ClinicHomepageSetting {
  final String bannerTitle;
  final String bannerSubtitle;
  final String introduction;
  final List<String> services;
  final String workingHours;
  final String contactPhone;

  const ClinicHomepageSetting({
    required this.bannerTitle,
    required this.bannerSubtitle,
    required this.introduction,
    required this.services,
    required this.workingHours,
    required this.contactPhone,
  });

  factory ClinicHomepageSetting.fromJson(Map<String, dynamic> json) {
    final banner = json['banner'];
    String bannerTitle = '';
    String bannerSubtitle = '';
    if (banner is Map) {
      bannerTitle = (banner['title'] ?? '').toString();
      bannerSubtitle = (banner['subtitle'] ?? '').toString();
    }

    final rawServices = json['services'];
    final List<String> services = rawServices is List
        ? rawServices.map((e) => e.toString()).where((e) => e.isNotEmpty).toList()
        : <String>[];

    return ClinicHomepageSetting(
      bannerTitle: bannerTitle,
      bannerSubtitle: bannerSubtitle,
      introduction: (json['introduction'] ?? '').toString(),
      services: services,
      workingHours: (json['workingHours'] ?? '').toString(),
      contactPhone: (json['contactPhone'] ?? '').toString(),
    );
  }
}
