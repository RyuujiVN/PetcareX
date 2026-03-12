// FE/Web/client/src/component/pageMainUser/index.jsx
import { FaBolt, FaFileMedical, FaPlus, FaRobot } from 'react-icons/fa';
import Footer from '../../default/footer';
import Header from '../../default/header';
import './styles.css';
// import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const dummyPets = [
  { id: 1, name: 'Mochi', breed: 'Cockapoo', age: '2 tuổi', avatar: '/public/gaugau.png' },
  { id: 2, name: 'Lulu',  breed: 'Mèo Anh lông ngắn', age: '1 tuổi', avatar: '/public/meomeo.png' },
  { id: 3, name: 'Bông',  breed: 'Mèo Ba Tư', age: '3 tuổi', avatar: '/public/lulu.png' },
];


// const goToChatBot = () => Navigate("/chatbot");
// const goToBooking = () => Navigate("/booking");


export default function PageMainUser() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const goToChatBot = () => {
    navigate("/chatbot");
  }

  const goToBooking = () => {
    navigate("/booking");
  }

  return (
    
    <div className="user-dashboard">
      <Header/>
      <header className="dashboard-header">
        <h1>Chào mừng trở lại, {userProfile?.fullName || 'bạn'}!</h1>
        <p>Cùng dành những điều tuyệt vời nhất cho các “bạn cưng” của bạn ngày hôm nay</p>
        <button className="btn-primaryy" onClick={goToBooking}>
          Đặt lịch khám ngay
        </button>
        
      </header>

      <h2 className="section-titles">Thú cưng của bạn</h2>
      <section className="pet-list">
        {dummyPets.map(p => (
          <article key={p.id} className="pet-card">
            <img src={p.avatar} alt={p.name} className="pet-avatar" />
            <div className="pet-details">
              <span className="pet-name">{p.name}</span>
              <span className="pet-meta">{p.breed} {p.age}</span>
            </div>
            <button className="btn-secondary">Quản lý</button>
          </article>
        ))}

        <article className="pet-card add-pet" onClick={() => navigate('/add-pet')} style={{cursor: 'pointer'}}>
          <div className="plus-circle"><FaPlus className="plus-icon" /></div>
          <span className="add-text">Thêm thú cưng mới</span>
        </article>
      </section>

      <section className="quick-links">
        <div className="quick-card green">
          <div className="icon-circle">
            <FaBolt className="quick-icon" />
          </div>
          <div className="quick-text">
            <h3>Diễn đàn cộng đồng</h3>
            <p>Giao lưu giữa bác sĩ và chủ nuôi</p>
          </div>
          <a href="#" className="quick-link">Bắt đầu →</a>
        </div>
        <div className="quick-card blue">
          <div className="icon-circle">
            <FaRobot className="quick-icon" />
          </div>
          <div className="quick-text">
            <h3>Tư vấn với AI Chatbot</h3>
            <p>Hỏi đáp các triệu chứng sức khỏe ngay lập tức</p>
          </div>
          <a href="#" className="quick-link" onClick={(e) => { e.preventDefault(); goToChatBot(); }}>
            Trò chuyện →
          </a>
        </div>
        <div className="quick-card orange">
          <div className="icon-circle">
            <FaFileMedical className="quick-icon" />
          </div>
          <div className="quick-text">
            <h3>Hồ sơ y tế điện tử</h3>
            <p>Xem được tất cả hồ sơ khám của thú cưng bạn</p>
          </div>
          <a href="#" className="quick-link">Đi đến →</a>
        </div>
      </section>

      <section className="appointments">
        <div className="appointments-header">
          <h2>Lịch hẹn của tôi</h2>
          <div className="tabs">
            <button className="tab active">Lịch hẹn sắp tới</button>
            <button className="tab">Lịch sử khám</button>
          </div>
          <a href="#" className="view-all">Xem chi tiết</a>
        </div>
        <ul>
          <li><span className="date">24</span> Tiêm phòng định kỳ Mochi <span className="status done">Đã hẹn</span></li>
          <li><span className="date">26</span> Khám tổng quát Lulu <span className="status done">Đã hẹn</span></li>
        </ul>
      </section>
      <Footer/>
    </div>
    
  );
}