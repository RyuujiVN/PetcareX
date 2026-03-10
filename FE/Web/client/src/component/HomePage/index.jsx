import { useNavigate } from "react-router-dom";
import "./styles.css";
import Header from "../../../../admin/src/default/header";
// import Footer from "../../../../admin/src/default/footer";

import { TbCircleCheck } from "react-icons/tb";
import { IoCloseCircle } from "react-icons/io5";
import { MdPets } from "react-icons/md";
import { FcDepartment, FcManager } from "react-icons/fc";
import { MdSecurity } from "react-icons/md";
import { TbLockAccess } from "react-icons/tb";
import { FcStatistics } from "react-icons/fc";
import { FcLock } from "react-icons/fc";
import { AiOutlineRise } from "react-icons/ai";





export default function HomePage() {
  const navigate = useNavigate();

  const stats = [
     { number: '30+', label: 'PHÒNG KHÁM TẠI VIỆT NAM' },
     { number: '50,000+', label: 'NGƯỜI DÙNG HỆ THỐNG' },
     { number: '999+', label: 'NGUỒN DỮ LIỆU THÚ CƯNG ĐA DẠNG' },
     { number: '24/7', label: 'HỔ TRỢ CHỦ NUÔI LIÊN TỤC' }
  ];

  const technologies = [
    {
      id: 1,
      title: "Đặt lịch khám trực tuyến",
      icon: "📱",
      description:
        "Kết nối chủ nuôi và bác sĩ nhanh chóng, giảm thời gian chờ đợi tại phòng khám."
    },
    {
      id: 2,
      title: "Sổ y tế điện tử",
      icon: "📖",
      description:
        "Lưu trữ lịch sử khám, phẫu thuật, tiêm phòng trọn đời cho từng thú cưng."
    },
    {
      id: 3,
      title: "Hổ trợ ChatBot AI",
      icon: "🤖",
      description:
        "Tư vấn sức khỏe sơ bộ 24/7, nhắc lịch tiêm chủng thông minh."
    },
    {
      id: 4,
      title: "Diễn đàn cộng cồng",
      icon: "👥",
      description:
        "Nơi chia sẻ kinh nghiệm chăm sóc, tìm kiếm thú cưng lạc và kết nối yêu thương."
    }
  ];
  const challenges = [
    {
      id: 1,
      title: 'Hỗ sợ bệnh án thủ công',
      description: 'Dễ mất lạc, khó tra cứu lịch sử khám chữa từ các cơ sở khác nhau'
    },
    {
      id: 2,
      title: 'Đặt lịch khám khó khăn',
      description: 'Phải gọi điện thoại, dễ sai lịch hoặc quên lịch khám'
    },
    {
      id: 3,
      title: 'Quản lý rời rạc',
      description: 'Khó theo dõi được doanh thu, từ sổ thuộc và nhân sự bị rối rạc'
    }
  ];

  const solutions = [
    {
      id: 1,
      title: 'Số hóa hồ sơ toàn diện',
      description: 'Lưu trữ đầm mây an toàn, truy cập mọi lúc mọi nơi, lịch sử minh bạch'
    },
    {
      id: 2,
      title: 'Đặt lịch Online 24/7',
      description: 'Thao tác nhanh trên App/Web, nhắc lịch tự động qua Zalo/SMS'
    },
    {
      id: 3,
      title: 'Báo cáo & Phân tích',
      description: 'Dashboard quản trị trực quan, tối ưu hóa vận hành phòng khám'
    }
  ];
  const features = [
    {
      id: 1,
      title: (
        <>
            <FcDepartment size={40}/> Phòng khám thú y
        </>),
      description: "Hệ thống quản lý phòng khám chuyên nghiệp. Tối ưu quy trình, quản lý nhân sự, kho thuốc và chăm sóc khách hàng tự động.",
      actionText: "Đăng ký Phòng khám",
      color: "green",
      items: [
        "Quản lý lịch hẹn & tiếp đón",
        "Quản lý kho được & bán hàng POS",
        "Báo cáo doanh thu chi tiết"
      ]
    },
    {
      id: 2,
      title: (
        <>
            <FcManager size={40}/>Người nuôi thú cưng
        </>),
      description:
        "Sổ sức khỏe điện tử cho thú cưng ngay trên điện thoại. Đặt lịch khám, mua sắm và nhận tư vấn từ chuyên gia dễ dàng.",
      actionText: "Tải App ngay",
      color: "orange",
      items: [
        "Lưu trữ hồ sơ sức khỏe trong đời",
        "Đặt lịch bác sĩ uy tín gần nhất",
        "Nhắc lịch tiêm & tẩy giun"
      ]
    }
  ];

  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/choose-clinic");

  return (
    <div className="home-page">
      

      <section className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Giải pháp #1 tại Việt Nam
            </div>

            <h1 className="hero-title">
              PetcareX - Hệ thống chăm sóc và quản lý thú cưng toàn diện
            </h1>

            <p className="hero-description">
              Chuyển đổi số toàn diện cho phòng khám thú y và mang lại trải nghiệm chăm sóc
              y tế tốt nhất, hiện đại nhất cho thú cưng của bạn.
            </p>

            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={handleLogin}>
                <MdPets size={20}/> 
                Dành cho Chủ nuôi
              </button>

              <button className="btn btn-secondary-hero" onClick={handleRegister}>
                <FcDepartment size={20}/> 
                Chọn phòng khám
              </button>
            </div>
          </div>
        </div>
      </section>


      <section className="stats-section">
        <div className="stats-container">
          <h2> <AiOutlineRise size={30} color="#eb524d"/> Cung cấp công cụ chăm sóc thú cưng toàn diện</h2>

          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="challenges-section">
        <div className="section-container">
          <h2 className="section-title">Thách thức & Giải pháp</h2>
          <p className="section-subtitle">
            Chúng tôi hiểu những khó khăn trong việc quản lý truyền thống và mang đến công nghệ để giải quyết triệt để
          </p>

          <div className="challenges-solutions-grid">
            <div className="challenges-column">
              <div className="column-header challenges-header">
                <span className="badge badge-red">THỰC TRẠNG</span>
              </div>

              <div className="items-list">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="challenge-item">
                    <div className="item-icon challenge-icon"><IoCloseCircle size={40}/></div>
                    <div className="item-content">
                      <h4>{challenge.title}</h4>
                      <p>{challenge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="solutions-column">
              <div className="column-header solutions-header">
                <span className="badge badge-green">GIẢI PHÁP PETCAREX</span>
              </div>

              <div className="items-list">
                {solutions.map((solution) => (
                  <div key={solution.id} className="solution-item">
                    <div className="item-icon solution-icon"><TbCircleCheck /></div>
                    <div className="item-content">
                      <h4>{solution.title}</h4>
                      <p>{solution.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    
      <section className="technology-section">
        <div className="section-container">
          <h2 className="section-title">Công Nghệ Phục Vụ Thú Cưng</h2>

          <div className="technology-grid">
            {technologies.map((tech) => (
              <div key={tech.id} className="tech-card">
                <div className="tech-icon">{tech.icon}</div>
                <h3>{tech.title}</h3>
                <p>{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="features-section">
        <div className="section-container">
          <div className="features-grid">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`feature-card feature-${feature.color}`}
              >
                <h3>{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                
                <div className="feature-items">
                  {feature.items.map((item, index) => (
                    <div key={index} className="feature-item">
                      <span className="feature-check">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button className="feature-btn">
                  {feature.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="security-section">
        <div className="section-container">
          <div className="security-content">
            <div className="security-icon">
              <MdSecurity size={50} color="#2563EB"/>
            </div>

            <h2 className="security-title">Cam kết An toàn & Bảo mật</h2>

            <p className="security-description">
              Chúng tôi xây dựng hệ sinh thái PetcareX dựa trên sự tin cậy. Dữ liệu của bạn được bảo về bằng các tiêu chuẩn bảo mật cao nhất, phân quyền chi tiết (RBAC) đảm bảo chỉ những người được ủy quyền mới có thể truy cập thông tin nhạy cảm.
            </p>

            <div className="security-features">
              <div className="security-feature-box">
                <FcLock size={40}/>
                <h4>Mã hóa dữ liệu</h4>
                <p>Bảo vệ toàn bộ thông tin bằng tiêu chuẩn SSL/TLS</p>
              </div>
              <div className="security-feature-box">
                <TbLockAccess size={40}/>
                <h4>Quản lý quyền truy cập</h4>
                <p>Phân quyền chi tiết RBAC cho mỗi người dùng</p>
              </div>
              <div className="security-feature-box">
                <FcStatistics size={40}/>
                <h4>Kiểm toán hoạt động</h4>
                <p>Ghi lại mọi thao tác cho mục đích quản lý</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-container">
          <h2 className="cta-title">Sẵn sàng chăm sóc thú cưng tốt hơn?</h2>
          <p className="cta-subtitle">
            Tham gia cùng cộng đồng hơn 30+ phòng khám và 50.000+ chủ nuôi tin dùng PetcareX.
          </p>

          <div className="cta-buttons">
            <button className="btn-cta btn-cta-primary" onClick={handleRegister}>
              Đăng ký miễn phí
            </button>
            <button className="btn-cta btn-cta-secondary">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}