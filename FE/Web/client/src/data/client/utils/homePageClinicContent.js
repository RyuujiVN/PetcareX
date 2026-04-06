import i18n from '../../../i18n';

const tr = (key, defaultValue) => i18n.t(key, { defaultValue });

export const getDefaultClinicHomeContent = () => ({
  hero: {
    title: tr('pages.home.homePageClinic.content.hero.title', 'PetCar - Khởi đầu cuộc sống tốt đẹp nhất cho thú cưng của bạn tại đây'),
    description: tr(
      'pages.home.homePageClinic.content.hero.description',
      'Vươn thương hiệu chăm sóc thú cưng số 1 Việt Nam, luôn đặt lợi ích của thú cưng và chủ nuôi lên hàng đầu.',
    ),
    ctaText: tr('pages.home.homePageClinic.content.hero.ctaText', 'Đặt lịch khám ngay'),
    bannerImage: '/homePageClinic.png',
  },
  about: {
    label: tr('pages.home.homePageClinic.content.about.label', 'Giới thiệu'),
    title: tr('pages.home.homePageClinic.content.about.title', 'Bệnh viện thú y PetCar'),
    description: tr(
      'pages.home.homePageClinic.content.about.description',
      'Được thành lập vào năm 2021 với cái tên phòng khám thú y PetCar luôn tự hào là một trong những bệnh viện thú y hàng đầu Việt Nam. Nhiều năm qua, PetCar đã được khách hàng tin tưởng và luôn đồng hành. Cùng với những dịch vụ đa dạng, PetCar luôn mang đến những trải nghiệm tốt và đáng nhớ nhất cho quý khách.',
    ),
    highlightNumber: tr('pages.home.homePageClinic.content.about.highlightNumber', '20 NAM'),
    highlightLabel: tr('pages.home.homePageClinic.content.about.highlightLabel', '5 CHI NHANH'),
  },
  gallerySection: {
    title: tr('pages.home.homePageClinic.content.gallerySection.title', 'THƯ VIỆN ẢNH'),
    subtitle: tr('pages.home.homePageClinic.content.gallerySection.subtitle', 'Hoạt động thường nhật của phòng khám.'),
  },
  galleryImages: [
    {
      id: 1,
      image: '/homePageClinic.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.1', 'Hoạt động phòng khám'),
    },
    {
      id: 2,
      image: '/pageMainClinic.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.2', 'Đội ngũ tại phòng khám'),
    },
    {
      id: 3,
      image: '/forum1.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.3', 'Sự kiện cộng đồng'),
    },
    {
      id: 4,
      image: '/forum2.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.4', 'Hình ảnh thường ngày'),
    },
    {
      id: 5,
      image: '/forum3.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.5', 'Hoạt động nội bộ'),
    },
    {
      id: 6,
      image: '/bs1.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.6', 'Bác sĩ tại phòng khám'),
    },
    {
      id: 7,
      image: '/bs2.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.7', 'Khoảnh khắc làm việc'),
    },
    {
      id: 8,
      image: '/bs3.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.8', 'Đội ngũ chuyên môn'),
    },
    {
      id: 9,
      image: '/bs4.png',
      alt: tr('pages.home.homePageClinic.content.galleryImages.9', 'Sinh hoạt phòng khám'),
    },
  ],
  locationSection: {
    title: tr('pages.home.homePageClinic.content.location.title', 'ĐỊA CHỈ PHÒNG KHÁM'),
    subtitle: tr('pages.home.homePageClinic.content.location.subtitle', 'Tìm đường đến phòng khám nhanh chóng qua Google Maps.'),
    address: tr('pages.home.homePageClinic.content.location.address', '240 Phan Đăng Lưu, Phường 1, Quận Phú Nhuận, TP. Hồ Chí Minh'),
    mapEmbedUrl: 'https://www.google.com/maps?q=B%E1%BB%87nh%20vi%E1%BB%87n%20th%C3%BA%20y%20Procare&output=embed',
    mapLink: 'https://www.google.com/maps/search/?api=1&query=B%E1%BB%87nh%20vi%E1%BB%87n%20th%C3%BA%20y%20Procare',
  },
  featuresSection: {
    title: 'Mọi thứ mà người bạn nhỏ của bạn cần',
    subtitle: 'Bộ công cụ toàn diện để quản lý sức khỏe và hạnh phúc cho thú cưng của bạn.',
  },
  features: [
    {
      id: 1,
      title: 'Đặt lịch Online',
      description: 'Giúp bạn đặt lịch khám, chọn bác sĩ mong muốn nhanh chóng và tiện lợi hơn.',
      colorClass: 'blue-bg',
    },
    {
      id: 2,
      title: 'Hồ sơ Y tế',
      description: 'Cho bạn xem được chi tiết hồ sơ của thú cưng khi khám xong.',
      colorClass: 'purple-bg',
    },
    {
      id: 3,
      title: 'AI ChatBot',
      description: 'Hỗ trợ tư vấn kịp thời các vấn đề liên quan đến thú cưng của bạn nhanh và chính xác nhất.',
      colorClass: 'yellow-bg',
    },
    {
      id: 4,
      title: 'Diễn đàn Cộng đồng',
      description: 'Trao đổi thêm các thông tin về thú cưng giữa cộng đồng và bác sĩ.',
      colorClass: 'green-bg',
    },
  ],
  teamSection: {
    title: tr('pages.home.homePageClinic.content.team.title', 'ĐỘI NGŨ PHÒNG KHÁM'),
  },
  doctors: [
    {
      id: 1,
      name: tr('pages.home.homePageClinic.content.doctors.1', 'ThS. Nguyễn Văn A - Bác sĩ Nội khoa'),
      image: '/bs1.png',
    },
    {
      id: 2,
      name: tr('pages.home.homePageClinic.content.doctors.2', 'ThS. Lê Thị B - Bác sĩ Ngoại khoa'),
      image: '/bs2.png',
    },
    {
      id: 3,
      name: tr('pages.home.homePageClinic.content.doctors.3', 'ThS. Trần Tiến C - Bác sĩ Thú y'),
      image: '/bs3.png',
    },
    {
      id: 4,
      name: tr('pages.home.homePageClinic.content.doctors.4', 'ThS. Phạm Kim D - Bác sĩ Chẩn đoán hình ảnh'),
      image: '/bs4.png',
    },
  ],
  servicesSection: {
    centerImage: '/pageMainClinic.png',
  },
  servicesLeft: [
    {
      id: 1,
      title: 'CẤP CỨU 24/7',
      description:
        'PetCareX phòng khám thú cưng luôn cấp cứu 24/7, sẵn sàng bên bé mọi lúc, mọi nơi. Vì mỗi nhịp tim nhỏ bé đều xứng đáng được bảo vệ và yêu thương.',
    },
    {
      id: 3,
      title: 'ĐỘI NGŨ BÁC SĨ',
      description:
        'Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm và yêu thương thú cưng, luôn đặt sức khỏe và sự an toàn của bé lên hàng đầu.',
    },
    {
      id: 5,
      title: 'KHÁM CHỮA BỆNH TẠI NHÀ',
      description:
        'Dịch vụ khám và điều trị thú cưng tại nhà - tiện lợi, an toàn, giúp bé được chăm sóc y tế tận nơi trong không gian quen thuộc.',
    },
  ],
  servicesRight: [
    {
      id: 4,
      title: 'THẨM MỸ',
      description:
        'Phòng khám cung cấp dịch vụ thẩm mỹ thú cưng chuyên nghiệp, giúp bé luôn sạch sẽ, thơm tho và rạng rỡ. Chăm sóc nhẹ nhàng - tạo kiểu tinh tế - nâng tầm vẻ đẹp và sự tự tin cho từng boss.',
    },
    {
      id: 2,
      title: 'TƯ VẤN DINH DƯỠNG',
      description:
        'Dịch vụ tư vấn dinh dưỡng thú cưng - xây dựng khẩu phần ăn khoa học theo từng độ tuổi và tình trạng sức khỏe, giúp bé phát triển khỏe mạnh và phòng ngừa bệnh tật.',
    },
    {
      id: 6,
      title: 'TRANG THIẾT BỊ KHÁM',
      description:
        'Phòng khám được trang bị thiết bị y tế hiện đại, hỗ trợ chẩn đoán nhanh và chính xác như máy xét nghiệm, siêu âm, X-quang,...',
    },
  ],
  community: {
    subtitle: 'CỘNG ĐỒNG KẾT NỐI',
    title: 'Diễn đàn cộng đồng PetCareX',
    doctorsHeading: 'Bác sĩ tiêu biểu trong cộng đồng',
  },
  posts: [
    {
      id: 1,
      image: '/forum1.png',
      title: 'Thảo luận sốt mũi ở chó',
    },
    {
      id: 2,
      image: '/forum2.png',
      title: 'Cách chăm sóc mèo mới sinh',
    },
    {
      id: 3,
      image: '/forum3.png',
      title: 'Làm sao khi mèo bỏ ăn?',
    },
  ],
  avatars: [
    {
      id: 1,
      image: '/bs1.png',
      name: 'BS. Tuấn Minh',
      subtitle: '',
    },
    {
      id: 2,
      image: '/bs2.png',
      name: 'BS. Phương Lan',
      subtitle: '',
    },
    {
      id: 3,
      image: '/bs3.png',
      name: 'BS. Huy Hoàng',
      subtitle: '',
    },
    {
      id: 4,
      image: '/bs4.png',
      name: 'BS. Tuyết Mai',
      subtitle: '',
    },
  ],
});

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const normalizeArray = (incoming, fallback) => {
  if (!Array.isArray(incoming)) {
    return cloneDeep(fallback);
  }

  return incoming.map((item, index) => ({
    ...fallback[index],
    ...item,
    id: item?.id || fallback[index]?.id || index + 1,
  }));
};

export const buildClinicHomeContent = (incoming = {}) => {
  const base = cloneDeep(getDefaultClinicHomeContent());

  return {
    ...base,
    ...incoming,
    hero: {
      ...base.hero,
      ...incoming.hero,
    },
    about: {
      ...base.about,
      ...incoming.about,
    },
    featuresSection: {
      ...base.featuresSection,
      ...incoming.featuresSection,
    },
    gallerySection: {
      ...base.gallerySection,
      ...incoming.gallerySection,
    },
    teamSection: {
      ...base.teamSection,
      ...incoming.teamSection,
    },
    locationSection: {
      ...base.locationSection,
      ...incoming.locationSection,
    },
    servicesSection: {
      ...base.servicesSection,
      ...incoming.servicesSection,
    },
    community: {
      ...base.community,
      ...incoming.community,
    },
    features: normalizeArray(incoming.features, base.features),
    galleryImages: normalizeArray(incoming.galleryImages, base.galleryImages),
    doctors: normalizeArray(incoming.doctors, base.doctors),
    servicesLeft: normalizeArray(incoming.servicesLeft, base.servicesLeft),
    servicesRight: normalizeArray(incoming.servicesRight, base.servicesRight),
    posts: normalizeArray(incoming.posts, base.posts),
    avatars: normalizeArray(incoming.avatars, base.avatars),
  };
};
