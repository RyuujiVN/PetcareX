import { useState } from "react";
import Header from "../../default/header";
import Footer from "../../default/footer";
import { FaSearch, FaMapMarkerAlt, FaClipboardList } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./styles.css"; 

const sampleClinics = [
  {
    id: 1,
    name: "PetCare Clinic",
    address: "34 Phạm Nhữ Tăng, Hòa Khê, Thanh Khê, Đà Nẵng, Việt Nam, Da Nang, Vietnam, 550000",
    time: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
    image: "./public/miniPet.png",
    rating: 4.8,
    reviews: 24,
  },
  {
    id: 2,
    name: "Bệnh Viện Thú Y Alpha",
    address: "456 Lê Văn Lương, Quận 3, TP.HCM",
    time: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
    image: "./public/36Pet.png",
    rating: 4.5,
    reviews: 17,
  },
  {
    id: 3,
    name: "PetCare Clinic - Chi nhánh 1",
    address: "789 Nguyễn Trãi, Quận 5, TP.HCM",
    time: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
    image: "./public/thanhThuy.png",
    rating: 4.2,
    reviews: 32,
  },
];

export default function ClinicSelection() {
  const [clinics] = useState(sampleClinics);
  const [searchText, setSearchText] = useState("");
  const [selectedClinic, setSelectedClinic] = useState(null);
  const navigate = useNavigate();

  const filtered = clinics.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChoose = (clinic) => {
    navigate("/clinic");
  };

  const closeModal = () => setSelectedClinic(null);

  return (
    <div className="clinic-page">
      <Header />
      <div className="clinic-header">
        <h2>Danh sách phòng khám đối tác</h2>
        <div className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="clinic-search"
              placeholder="Tìm kiếm theo tên"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="clinic-grid">
        {filtered.map((clinic) => (
          <div key={clinic.id} className="clinic-card">
            <img src={clinic.image} alt={clinic.name} className="clinic-img" />
            <div className="clinic-info">
              <h3>{clinic.name}</h3>
              <p>{clinic.address}</p>
              <p>{clinic.time}</p>  
            </div>
            <div className="clinic-meta">
              <span className="rating">{clinic.rating} ⭐ ({clinic.reviews})</span>
            </div>
            <button
              className="btn-choose"
              onClick={() => handleChoose(clinic)}
            >
              Chọn
            </button>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
