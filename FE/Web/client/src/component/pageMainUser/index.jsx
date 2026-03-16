import { FaBolt, FaFileMedical, FaPlus, FaRobot } from "react-icons/fa";
import { message, Spin } from "antd";
import Footer from "../../default/footer";
import Header from "../../default/header";
import "./styles.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { getMyPetsApi } from "../../api/petApi";
import { APPOINTMENT_STATUS, getMyAppointmentsApi } from "../../api/appointmentApi";

const getPetAge = (birthDate) => {
  if (!birthDate) return "";

  const now = new Date();
  const date = new Date(birthDate);
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }

  return `${Math.max(age, 0)} tuổi`;
};

const formatAppointment = (item) => {
  const time = (item.appointmentTime || "").slice(0, 5);
  const title = `${item.service} ${item.pet?.name || ""}`.trim();

  return {
    id: item.id,
    time,
    title,
    status: item.status,
    rawDate: item.appointmentDate,
  };
};

export default function PageMainUser() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [petData, appointmentRes] = await Promise.all([
        getMyPetsApi(),
        getMyAppointmentsApi(1, 200),
      ]);

      const mappedPets = (Array.isArray(petData) ? petData : []).map((item) => ({
        id: item.id,
        petName: item.name,
        breed: item.breed?.name || "Chưa có giống",
        age: getPetAge(item.dateOfBirth),
        avatar: item.avatar || "/gaugau.png",
      }));

      setPets(mappedPets);
      setAppointments(Array.isArray(appointmentRes?.items) ? appointmentRes.items : []);
    } catch (error) {
      message.error(error.message || "Không thể tải dữ liệu trang chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .map(formatAppointment)
      .filter((item) => {
        const appointmentDateTime = new Date(`${item.rawDate}T${item.time}:00`);
        const isFuture = appointmentDateTime >= now;
        const isDone = item.status === APPOINTMENT_STATUS.DONE;
        const isCanceled = item.status === APPOINTMENT_STATUS.CANCELED;

        return isFuture && !isDone && !isCanceled;
      })
      .slice(0, 5);
  }, [appointments]);

  const historyAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .map(formatAppointment)
      .filter((item) => {
        const appointmentDateTime = new Date(`${item.rawDate}T${item.time}:00`);
        const isPast = appointmentDateTime < now;
        const isDone = item.status === APPOINTMENT_STATUS.DONE;
        const isCanceled = item.status === APPOINTMENT_STATUS.CANCELED;

        return isPast || isDone || isCanceled;
      })
      .slice(0, 5);
  }, [appointments]);

  const goToChatBot = () => {
    navigate("/chatbot");
  };

  const goToBooking = () => {
    navigate("/booking");
  };

  const goToMedicalRecords = () => {
    navigate("/listPet");
  };

  const goToAppointmentDetail = () => {
    navigate("/appointments");
  };

  return (
    <div className="user-dashboard">
      <Header />

      <header className="dashboard-header">
        <h1>
          Chào mừng, {userProfile?.fullName || "bạn"}!
        </h1>

        <p>
          Cùng dành những điều tuyệt vời nhất cho các “bạn cưng” của bạn ngày hôm nay
        </p>

        <button
          className="btn-primaryy"
          onClick={goToBooking}
        >
          Đặt lịch khám ngay
        </button>
      </header>

      <Spin spinning={loading}>
        <h2 className="section-titles">
          Thú cưng của bạn
        </h2>

        <section className="pet-listts">
          {pets.map((p) => (
            <article
              key={p.id}
              className="pet-card"
              style={{ width: "200px" }}
            >
              <img
                src={p.avatar}
                alt={p.petName}
                className="pet-avatar"
              />

              <div className="pet-details">
                <span className="pet-name">
                  {p.petName}
                </span>

                <span className="pet-meta">
                  {p.breed}
                  <br />
                  {p.age}
                </span>
              </div>

              <button
                className="btn-secondary"
                onClick={() => navigate(`/petProfile?id=${p.id}`)}
              >
                Quản lý
              </button>
            </article>
          ))}

          <article
            className="pet-card add-pet"
            onClick={() => navigate("/add-pet")}
            style={{ cursor: "pointer" }}
          >
            <div className="plus-circle">
              <FaPlus className="plus-icon" />
            </div>

            <span className="add-text">
              Thêm thú cưng mới
            </span>
          </article>
        </section>

        <section className="quick-links">
          <div className="quick-card green">
            <div className="icon-circle">
              <FaBolt className="quick-icon" />
            </div>

            <div className="quick-text">
              <h3>
                Diễn đàn cộng đồng
              </h3>

              <p>
                Giao lưu giữa bác sĩ và chủ nuôi
              </p>
            </div>

            <a
              href="#"
              className="quick-link"
            >
              Bắt đầu →
            </a>
          </div>

          <div className="quick-card blue">
            <div className="icon-circle">
              <FaRobot className="quick-icon" />
            </div>

            <div className="quick-text">
              <h3>
                Tư vấn với AI Chatbot
              </h3>

              <p>
                Hỏi đáp các triệu chứng sức khỏe ngay lập tức
              </p>
            </div>

            <a
              href="#"
              className="quick-link"
              onClick={(e) => {
                e.preventDefault();
                goToChatBot();
              }}
            >
              Trò chuyện →
            </a>
          </div>

          <div className="quick-card orange">
            <div className="icon-circle">
              <FaFileMedical className="quick-icon" />
            </div>

            <div className="quick-text">
              <h3>
                Hồ sơ y tế điện tử
              </h3>

              <p>
                Xem được tất cả hồ sơ khám của thú cưng bạn
              </p>
            </div>

            <a
              href="#"
              className="quick-link"
              onClick={(e) => {
                e.preventDefault();
                goToMedicalRecords();
              }}
            >
              Đi đến →
            </a>
          </div>
        </section>

        <section className="appointments">
          <div className="appointments-header">
            <h2>
              Lịch hẹn của tôi
            </h2>

            <div className="tabs">
              <button
                className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
              >
                Lịch hẹn sắp tới
              </button>

              <button
                className={`tab ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Lịch sử khám
              </button>
            </div>

            <a
              href="#"
              className="view-all"
              onClick={(e) => {
                e.preventDefault();
                goToAppointmentDetail();
              }}
            >
              Xem chi tiết
            </a>
          </div>

          <ul>
            {(activeTab === "upcoming" ? upcomingAppointments : historyAppointments).map((a) => (
              <li key={a.id}>
                <span
                  className="time"
                  style={{
                    padding: "10px",
                    color: "#f32d26",
                  }}
                >
                  {a.time}
                </span>

                {a.title}

                <span
                  className={`status ${activeTab === "upcoming" ? "upcoming" : "done"}`}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </Spin>

      <Footer />
    </div>
  );
}
