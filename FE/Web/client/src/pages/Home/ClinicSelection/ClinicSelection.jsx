import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import Header from "../../../components/layout/header";
import Footer from "../../../components/layout/footer";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getClinicByIdApi, getClinicListApi } from "../../../data/api/clinicApi";
import "./styles.css"; 

export default function ClinicSelection() {
  const [clinics, setClinics] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchClinics = async () => {
      try {
        setLoading(true);
        const response = await getClinicListApi(1, 50, "");
        const clinicItems = Array.isArray(response?.items) ? response.items : [];

        if (!mounted) {
          return;
        }

        const normalized = clinicItems.map((clinic) => ({
          ...clinic,
          time: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
          image: clinic.avatarUrl || "/miniPet.png",
          rating: 5,
          reviews: 0,
        }));

        setClinics(normalized);
      } catch (error) {
        message.error(error.message || "Không thể tải danh sách phòng khám");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchClinics();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = clinics.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChoose = async (clinic) => {
    try {
      setLoading(true);
      const clinicDetail = await getClinicByIdApi(clinic.id);
      sessionStorage.setItem("selectedClinicId", String(clinic.id));
      navigate("/clinic", {
        state: {
          clinic: clinicDetail,
          selectedClinicId: String(clinic.id),
        },
      });
    } catch (error) {
      message.error(error.message || "Không thể tải chi tiết phòng khám");
    } finally {
      setLoading(false);
    }
  };

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

      <Spin spinning={loading}>
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
      </Spin>
      <Footer />
    </div>
  );
}
