import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../default/header";
import Footer from "../../default/footer";
import "../HomePage/styles.css"; // reuse existing base styles
import "./HomePageClinic.css";
import { FaMobileAlt, FaRobot, FaStethoscope, FaHeartbeat, FaFire } from "react-icons/fa";

export default function HomePageClinic() {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      icon: <FaMobileAlt className="feature-icon" />,
      title: "Đặt lịch Online",
      description: "Giúp bạn đặt lịch khám, chọn bác sĩ mong muốn nhanh chóng và tiện lợi hơn.",
      colorClass: "blue-bg"
    },
    {
      id: 2,
      icon: <FaRobot className="feature-icon" />,
      title: "Hồ sơ Y tế",
      description: "Cho bạn xem được chi tiết hồ sơ của thú cưng của bạn khi khám xong.",
      colorClass: "purple-bg"
    },
    {
      id: 3,
      icon: <FaStethoscope className="feature-icon" />,
      title: "AI ChatBot",
      description: "Hỗ trợ tư vấn kịp thời các vấn đề liên quan đến thú cưng của bạn nhanh và chính xác nhất.",
      colorClass: "yellow-bg"
    },
    {
      id: 4,
      icon: <FaHeartbeat className="feature-icon" />,
      title: "Diễn đàn Cộng đồng",
      description: "Trao đổi thêm các thông tin về thú cưng giữa cộng đồng và bác sĩ.",
      colorClass: "green-bg"
    }
  ];

  const doctors = [
    {
      id: 1,
      name: "ThS. Nguyễn Văn A - Bác sĩ Nội khoa",
      image: "./public/bs1.png"
    },
    {
      id: 2,
      name: "ThS. Lê Thị B - Bác sĩ Ngoại khoa",
      image: "./public/bs2.png"
    },
    {
      id: 3,
      name: "ThS. Trần Tiến C - Bác sĩ Thú y",
      image: "./public/bs3.png"
    },
    {
      id: 4,
      name: "ThS. Phạm Kim D - Bác sĩ Chẩn đoán hình ảnh",
      image: "./public/bs4.png"
    }
  ];

  const servicesLeft = [
    { id: 1, title: 'CẤP CỨU 24/7',
      description: 'PetCareX Phòng khám thú cưng luôn cấp cứu 24/7, sẵn sàng bên bé mọi lúc, mọi nơi. Vì mỗi nhịp tim nhỏ bé đều xứng đáng được bảo vệ và yêu thương.'
    },
    { id: 3, title: 'ĐỘI NGŨ BÁC SĨ',
      description: 'Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm và yêu thương thú cưng, luôn đặt sức khỏe và sự an toàn của bé lên hàng đầu.'
    },
    { id: 5, title: 'KHÁM CHỮA BỆNH TẠI NHÀ',
      description: 'Dịch vụ khám và điều trị thú cưng tại nhà – tiện lợi, an toàn, giúp bé được chăm sóc y tế tận nơi trong không gian quen thuộc.'
    }
  ];

  const servicesRight = [
    { id: 4, title: 'THẨM MỸ',
      description: 'Phòng khám cung cấp dịch vụ thẩm mỹ thú cưng chuyên nghiệp, giúp bé luôn sạch sẽ, thơm tho và rạng rỡ. Chăm sóc nhẹ nhàng – tạo kiểu tinh tế – nâng tầm vẻ đẹp và sự tự tin cho từng “boss”.'
    },
    { id: 2, title: 'TƯ VẤN DINH DƯỠNG',
      description: 'Dịch vụ tư vấn dinh dưỡng thú cưng – xây dựng khẩu phần ăn khoa học theo từng độ tuổi và tình trạng sức khỏe, giúp bé phát triển khỏe mạnh và phòng ngừa bệnh tật.'
    },
    { id: 6, title: 'TRANG THIẾT BỊ KHÁM',
      description: 'Phòng khám được trang bị thiết bị y tế hiện đại, hỗ trợ chẩn đoán nhanh và chính xác như máy xét nghiệm, siêu âm, X-quang,...'
    }
  ];

  const posts = [
    { id: 1, image: "./public/forum1.png", title: 'Thảo luận sốt mũi ở chó' },
    { id: 2, image: "./public/forum2.png", title: 'Cách chăm sóc mèo mới sinh' },
    { id: 3, image: "./public/forum3.png", title: 'Làm sao khi mèo bỏ ăn?' }
  ];

  const avatars = [
    { id: 1, image: './public/bs1.png', name: 'BS. Tuấn Minh' },
    { id: 2, image: './public/bs2.png', name: 'BS. Phương Lan' },
    { id: 3, image: './public/bs3.png', name: 'BS. Huy Hoàng' },
    { id: 4, image: './public/bs4.png', name: 'BS. Tuyết Mai' }
  ];

  const goTodownLoadApp = () => {
    navigate("/downloadApp");
  };

  const goToMainUser = () => {
    navigate("/main-user");
  };

  return (
    <div className="home-page clinic-page">
      <Header />

      <section className="hero-section clinic-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            PetCar - Khởi đầu cuộc sống tốt đẹp nhất cho thú cưng của bạn tại đây
          </h1>
          <p className="hero-description">
            Vươn thương hiệu chăm sóc thú cưng số 1 Việt Nam, luôn đặt lợi ích của 
            thú cưng và chủ nuôi lên hàng đầu.
          </p>

          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={goTodownLoadApp}>
              Tải ứng dụng ngay
            </button>
            <button className="btn btn-secondary-hero" onClick={goToMainUser}>
              Dành cho bạn
            </button>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="section-container about-grid about-split">
          <div className="about-left">
            <span className="about-label">Giới thiệu</span>
            <h2 className="about-title">Bệnh viện thú y PetCar</h2>
          </div>
          <div className="about-right">
            <p className="about-text">
              Được thành lập vào năm 2021 với cái tên phòng khám thú y PetCar luôn tự hào là
              một trong những bệnh viện thú y hàng đầu Việt Nam. Nhiều năm qua, PetCar đã
              được khách hàng tin tưởng và luôn đồng hành. Cùng với những dịch vụ đa dạng,
              PetCar luôn mang đến những trải nghiệm tốt và đáng nhớ nhất cho quý khách.
            </p>
            <button className="btn btn-secondary">ĐỌC THÊM -</button>
          </div>
          <div className="about-highlight">
            <div className="highlight-number">20 NĂM</div>
            <div className="highlight-label">5 CHI NHÁNH</div>
          </div>
        </div>
      </section>

      <section className="clinic-features">
        <div className="section-container">
          <h2 className="section-title">Mọi thứ mà người bạn nhỏ của bạn cần</h2>
          <p className="section-subtitle">
            Bộ công cụ toàn diện để quản lý sức khỏe và hạnh phúc cho thú cưng của bạn.
          </p>
          <div className="features-grid compact">
            {features.map((f) => (
              <div key={f.id} className="feature-card compact">
                <div className={`feature-icon-wrapper ${f.colorClass}`}>{f.icon}</div>
                <div className="feature-content">
                  <h4 className="feature-title">{f.title}</h4>
                  <p className="feature-desc">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="team-section">
        <div className="section-container">
          <h2 className="section-title">ĐỘI NGŨ PHÒNG KHÁM</h2>
          <div className="team-grid">
            {doctors.map((doc) => (
              <div key={doc.id} className="doctor-card">
                <img src={doc.image} alt={doc.name} />
                <div className="doctor-name">{doc.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="section-container services-layout">
          <div className="services-column left">
            {servicesLeft.map(s => (
              <div key={s.id} className="service-item">
                <h4 className="service-title">{s.title}</h4>
                <p className="service-desc">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="services-center-image">
            <img src="./public/pageMainClinic.png" alt="pet" />
          </div>

          <div className="services-column right">
            {servicesRight.map(s => (
              <div key={s.id} className="service-item">
                <h4 className="service-title">{s.title}</h4>
                <p className="service-desc">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="community-section">
        <div className="section-container">
          <div className="community-header">
            <span className="community-subtitle">CỘNG ĐỒNG KẾT NỐI</span>
            <h2 className="section-title">Diễn đàn cộng đồng PetCareX</h2>
            <div className="community-hot">
              <FaFire className="hot-icon" /> <span>Thảo luận sôi nổi</span>
            </div>
          </div>
          <div className="community-grid">
            {posts.map((p) => (
              <div key={p.id} className="community-card">
                <img src={p.image} alt={p.title} />
                <p>{p.title}</p>
              </div>
            ))}
          </div>
          <div className="community-doctors">
            <h3 className="doctors-heading">Bác sĩ tiêu biểu trong cộng đồng</h3>
            <div className="avatar-row">
              {avatars.map((a) => (
                <div key={a.id} className="avatar-item">
                  <img src={a.image} alt={a.name} />
                  <span className="avatar-name">{a.name}</span>
                  <span className="avatar-subtitle">{a.subtitle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
