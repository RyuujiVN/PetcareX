import 'dart:convert';

class ClinicHomepageSetting {
  final ClinicHeroSection hero;
  final ClinicAboutSection about;
  final ClinicGallerySection gallerySection;
  final List<ClinicGalleryImage> galleryImages;
  final ClinicTeamSection teamSection;
  final List<ClinicDoctorProfile> doctors;
  final ClinicLocationSection locationSection;

  // Legacy keys (schema cũ) để giữ tương thích ngược.
  final String introduction;
  final List<String> services;
  final String workingHours;
  final String contactPhone;

  const ClinicHomepageSetting({
    required this.hero,
    required this.about,
    required this.gallerySection,
    required this.galleryImages,
    required this.teamSection,
    required this.doctors,
    required this.locationSection,
    required this.introduction,
    required this.services,
    required this.workingHours,
    required this.contactPhone,
  });

  static const List<ClinicGalleryImage> _defaultGalleryImages = [
    ClinicGalleryImage(id: 1, image: '', alt: 'Hoạt động phòng khám'),
    ClinicGalleryImage(id: 2, image: '', alt: 'Đội ngũ tại phòng khám'),
    ClinicGalleryImage(id: 3, image: '', alt: 'Sự kiện cộng đồng'),
    ClinicGalleryImage(id: 4, image: '', alt: 'Hình ảnh thường ngày'),
    ClinicGalleryImage(id: 5, image: '', alt: 'Hoạt động nội bộ'),
    ClinicGalleryImage(id: 6, image: '', alt: 'Bác sĩ tại phòng khám'),
    ClinicGalleryImage(id: 7, image: '', alt: 'Khoảnh khắc làm việc'),
    ClinicGalleryImage(id: 8, image: '', alt: 'Đội ngũ chuyên môn'),
    ClinicGalleryImage(id: 9, image: '', alt: 'Sinh hoạt phòng khám'),
  ];

  static const List<ClinicDoctorProfile> _defaultDoctors = [
    ClinicDoctorProfile(
      id: 1,
      name: 'ThS. Nguyễn Văn A - Bác sĩ Nội khoa',
      image: '',
    ),
    ClinicDoctorProfile(
      id: 2,
      name: 'ThS. Lê Thị B - Bác sĩ Ngoại khoa',
      image: '',
    ),
    ClinicDoctorProfile(
      id: 3,
      name: 'ThS. Trần Tiến C - Bác sĩ Thú y',
      image: '',
    ),
    ClinicDoctorProfile(
      id: 4,
      name: 'ThS. Phạm Kim D - Bác sĩ Chẩn đoán hình ảnh',
      image: '',
    ),
  ];

  factory ClinicHomepageSetting.defaults() {
    return const ClinicHomepageSetting(
      hero: ClinicHeroSection(
        title:
            'PetCar - Khởi đầu cuộc sống tốt đẹp nhất cho thú cưng của bạn tại đây',
        description:
            'Vươn thương hiệu chăm sóc thú cưng số 1 Việt Nam, luôn đặt lợi ích của thú cưng và chủ nuôi lên hàng đầu.',
        ctaText: 'Đặt lịch khám ngay',
        bannerImage: '',
      ),
      about: ClinicAboutSection(
        label: 'Giới thiệu',
        title: 'Bệnh viện thú y PetCar',
        description:
            'Được thành lập vào năm 2021 với cái tên phòng khám thú y PetCar luôn tự hào là một trong những bệnh viện thú y hàng đầu Việt Nam. Nhiều năm qua, PetCar đã được khách hàng tin tưởng và luôn đồng hành. Cùng với những dịch vụ đa dạng, PetCar luôn mang đến những trải nghiệm tốt và đáng nhớ nhất cho quý khách.',
        highlightNumber: '20 NAM',
        highlightLabel: '5 CHI NHANH',
      ),
      gallerySection: ClinicGallerySection(
        title: 'THƯ VIỆN ẢNH',
        subtitle: 'Hoạt động thường nhật của phòng khám.',
      ),
      galleryImages: _defaultGalleryImages,
      teamSection: ClinicTeamSection(title: 'ĐỘI NGŨ PHÒNG KHÁM'),
      doctors: _defaultDoctors,
      locationSection: ClinicLocationSection(
        title: 'ĐỊA CHỈ PHÒNG KHÁM',
        subtitle: 'Thông tin địa chỉ phòng khám.',
        address: '',
        mapEmbedUrl: '',
        mapLink: '',
      ),
      introduction:
          'Được thành lập vào năm 2021 với cái tên phòng khám thú y PetCar luôn tự hào là một trong những bệnh viện thú y hàng đầu Việt Nam. Nhiều năm qua, PetCar đã được khách hàng tin tưởng và luôn đồng hành. Cùng với những dịch vụ đa dạng, PetCar luôn mang đến những trải nghiệm tốt và đáng nhớ nhất cho quý khách.',
      services: <String>[],
      workingHours: '',
      contactPhone: '',
    );
  }

  factory ClinicHomepageSetting.fromJson(Map<String, dynamic> json) {
    final defaults = ClinicHomepageSetting.defaults();
    final root = _resolveRoot(json);

    final heroMap = _asStringMap(root['hero']);
    final aboutMap = _asStringMap(root['about']);
    final gallerySectionMap = _asStringMap(root['gallerySection']);
    final teamSectionMap = _asStringMap(root['teamSection']);
    final locationSectionMap = _asStringMap(root['locationSection']);

    final bannerMap = _asStringMap(root['banner']);
    final introduction = _readString(root, 'introduction');

    final rawServices = root['services'];
    final services = rawServices is List
        ? rawServices
              .map((e) => e.toString().trim())
              .where((e) => e.isNotEmpty)
              .toList()
        : defaults.services;

    return ClinicHomepageSetting(
      hero: ClinicHeroSection(
        title: _firstNonBlank([
          _readString(heroMap, 'title'),
          _readString(bannerMap, 'title'),
          defaults.hero.title,
        ]),
        description: _firstNonBlank([
          _readString(heroMap, 'description'),
          _readString(heroMap, 'subtitle'),
          _readString(bannerMap, 'subtitle'),
          defaults.hero.description,
        ]),
        ctaText: _firstNonBlank([
          _readString(heroMap, 'ctaText'),
          defaults.hero.ctaText,
        ]),
        bannerImage: _firstNonBlank([
          _readString(heroMap, 'bannerImage'),
          _readString(root, 'bannerImage'),
          defaults.hero.bannerImage,
        ]),
      ),
      about: ClinicAboutSection(
        label: _firstNonBlank([
          _readString(aboutMap, 'label'),
          defaults.about.label,
        ]),
        title: _firstNonBlank([
          _readString(aboutMap, 'title'),
          defaults.about.title,
        ]),
        description: _firstNonBlank([
          _readString(aboutMap, 'description'),
          introduction,
          defaults.about.description,
        ]),
        highlightNumber: _firstNonBlank([
          _readString(aboutMap, 'highlightNumber'),
          defaults.about.highlightNumber,
        ]),
        highlightLabel: _firstNonBlank([
          _readString(aboutMap, 'highlightLabel'),
          defaults.about.highlightLabel,
        ]),
      ),
      gallerySection: ClinicGallerySection(
        title: _firstNonBlank([
          _readString(gallerySectionMap, 'title'),
          defaults.gallerySection.title,
        ]),
        subtitle: _firstNonBlank([
          _readString(gallerySectionMap, 'subtitle'),
          defaults.gallerySection.subtitle,
        ]),
      ),
      galleryImages: _parseGalleryImages(root['galleryImages']),
      teamSection: ClinicTeamSection(
        title: _firstNonBlank([
          _readString(teamSectionMap, 'title'),
          defaults.teamSection.title,
        ]),
      ),
      doctors: _parseDoctors(root['doctors']),
      locationSection: ClinicLocationSection(
        title: _firstNonBlank([
          _readString(locationSectionMap, 'title'),
          defaults.locationSection.title,
        ]),
        subtitle: _firstNonBlank([
          _readString(locationSectionMap, 'subtitle'),
          defaults.locationSection.subtitle,
        ]),
        address: _firstNonBlank([
          _readString(locationSectionMap, 'address'),
          defaults.locationSection.address,
        ]),
        mapEmbedUrl: _sanitizeMapValue(
          _normalizeMapEmbedValue(
            _firstNonBlank([
              _readString(locationSectionMap, 'mapEmbedUrl'),
              defaults.locationSection.mapEmbedUrl,
            ]),
          ),
        ),
        mapLink: _sanitizeMapValue(
          _firstNonBlank([
            _readString(locationSectionMap, 'mapLink'),
            defaults.locationSection.mapLink,
          ]),
        ),
      ),
      introduction: _firstNonBlank([introduction, defaults.introduction]),
      services: services,
      workingHours: _readString(root, 'workingHours'),
      contactPhone: _readString(root, 'contactPhone'),
    );
  }

  static Map<String, dynamic> _resolveRoot(Map<String, dynamic> json) {
    final settingsRaw = json['settings'];
    if (settingsRaw is Map<String, dynamic>) {
      return settingsRaw;
    }

    if (settingsRaw is String) {
      final parsed = _tryParseMap(settingsRaw);
      if (parsed != null) {
        return parsed;
      }
    }

    return json;
  }

  static List<ClinicGalleryImage> _parseGalleryImages(dynamic raw) {
    if (raw is! List || raw.isEmpty) {
      return _defaultGalleryImages;
    }

    final items = <ClinicGalleryImage>[];
    for (int i = 0; i < raw.length; i++) {
      final itemMap = _asStringMap(raw[i]);
      if (itemMap.isEmpty) {
        continue;
      }

      final fallback = i < _defaultGalleryImages.length
          ? _defaultGalleryImages[i]
          : ClinicGalleryImage(
              id: i + 1,
              image: '',
              alt: 'Ảnh thư viện ${i + 1}',
            );

      items.add(
        ClinicGalleryImage(
          id: _readInt(itemMap, 'id') ?? fallback.id,
          image: _readString(itemMap, 'image'),
          alt: _firstNonBlank([_readString(itemMap, 'alt'), fallback.alt]),
        ),
      );
    }

    return items.isEmpty ? _defaultGalleryImages : items;
  }

  static List<ClinicDoctorProfile> _parseDoctors(dynamic raw) {
    if (raw is! List || raw.isEmpty) {
      return _defaultDoctors;
    }

    final items = <ClinicDoctorProfile>[];
    for (int i = 0; i < raw.length; i++) {
      final itemMap = _asStringMap(raw[i]);
      if (itemMap.isEmpty) {
        continue;
      }

      final fallback = i < _defaultDoctors.length
          ? _defaultDoctors[i]
          : ClinicDoctorProfile(id: i + 1, name: 'Bác sĩ ${i + 1}', image: '');

      items.add(
        ClinicDoctorProfile(
          id: _readInt(itemMap, 'id') ?? fallback.id,
          name: _firstNonBlank([_readString(itemMap, 'name'), fallback.name]),
          image: _readString(itemMap, 'image'),
        ),
      );
    }

    return items.isEmpty ? _defaultDoctors : items;
  }

  static Map<String, dynamic> _asStringMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }
    return <String, dynamic>{};
  }

  static Map<String, dynamic>? _tryParseMap(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) {
      return null;
    }

    try {
      final parsed = jsonDecode(trimmed);
      if (parsed is Map<String, dynamic>) {
        return parsed;
      }
      if (parsed is Map) {
        return parsed.map((key, val) => MapEntry(key.toString(), val));
      }
    } catch (_) {
      return null;
    }

    return null;
  }

  static String _normalizeMapEmbedValue(String raw) {
    final normalizedRaw = raw.trim();
    if (normalizedRaw.isEmpty) {
      return '';
    }

    final iframeSrcMatch = RegExp(
      r'''src=(['"])(.*?)\1''',
      caseSensitive: false,
    ).firstMatch(normalizedRaw);
    if (iframeSrcMatch != null && iframeSrcMatch.groupCount >= 2) {
      final src = iframeSrcMatch.group(2)?.trim() ?? '';
      if (src.isNotEmpty) {
        return src;
      }
    }

    return normalizedRaw;
  }

  static String _sanitizeMapValue(String raw) {
    final normalized = raw.trim();
    if (normalized.isEmpty) {
      return '';
    }

    if (_isLegacyDefaultMapValue(normalized)) {
      return '';
    }

    return normalized;
  }

  static bool _isLegacyDefaultMapValue(String raw) {
    final uri = Uri.tryParse(raw.trim());
    if (uri == null) {
      return false;
    }

    final host = uri.host.toLowerCase();
    if (!host.contains('google.com')) {
      return false;
    }

    final placeQuery = (uri.queryParameters['q'] ?? uri.queryParameters['query'] ?? '')
        .toLowerCase()
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();

    return placeQuery == 'bệnh viện thú y procare' ||
        placeQuery == 'benh vien thu y procare';
  }

  static String _readString(Map<String, dynamic> map, String key) {
    final value = map[key];
    if (value == null) {
      return '';
    }

    final normalized = value.toString().trim();
    return normalized;
  }

  static int? _readInt(Map<String, dynamic> map, String key) {
    final value = map[key];
    if (value == null) {
      return null;
    }

    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value.toString().trim());
  }

  static String _firstNonBlank(List<String> values) {
    for (final value in values) {
      final normalized = value.trim();
      if (normalized.isNotEmpty) {
        return normalized;
      }
    }

    return '';
  }
}

class ClinicHeroSection {
  final String title;
  final String description;
  final String ctaText;
  final String bannerImage;

  const ClinicHeroSection({
    required this.title,
    required this.description,
    required this.ctaText,
    required this.bannerImage,
  });
}

class ClinicAboutSection {
  final String label;
  final String title;
  final String description;
  final String highlightNumber;
  final String highlightLabel;

  const ClinicAboutSection({
    required this.label,
    required this.title,
    required this.description,
    required this.highlightNumber,
    required this.highlightLabel,
  });
}

class ClinicGallerySection {
  final String title;
  final String subtitle;

  const ClinicGallerySection({required this.title, required this.subtitle});
}

class ClinicGalleryImage {
  final int id;
  final String image;
  final String alt;

  const ClinicGalleryImage({
    required this.id,
    required this.image,
    required this.alt,
  });
}

class ClinicTeamSection {
  final String title;

  const ClinicTeamSection({required this.title});
}

class ClinicDoctorProfile {
  final int id;
  final String name;
  final String image;

  const ClinicDoctorProfile({
    required this.id,
    required this.name,
    required this.image,
  });
}

class ClinicLocationSection {
  final String title;
  final String subtitle;
  final String address;
  final String mapEmbedUrl;
  final String mapLink;

  const ClinicLocationSection({
    required this.title,
    required this.subtitle,
    required this.address,
    required this.mapEmbedUrl,
    required this.mapLink,
  });
}
