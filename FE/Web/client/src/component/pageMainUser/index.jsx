// import { FaBolt, FaFileMedical, FaPlus, FaRobot } from "react-icons/fa";
// import Footer from "../../default/footer";
// import Header from "../../default/header";
// import "./styles.css";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { useState, useEffect } from "react";

// const dummyPets = [
//   {
//     id: 1,
//     name: "Mochi",
//     breed: "Cockapoo",
//     age: "2 tuổi",
//     avatar: "/public/gaugau.png",
//   },
//   {
//     id: 2,
//     name: "Lulu",
//     breed: "Mèo Anh lông ngắn",
//     age: "1 tuổi",
//     avatar: "/public/meomeo.png",
//   },
//   {
//     id: 3,
//     name: "Bông",
//     breed: "Mèo Ba Tư",
//     age: "3 tuổi",
//     avatar: "/public/lulu.png",
//   },
// ];

// const upcomingAppointments = [
//   {
//     id: 1,
//     time: "09:30",
//     title: "Tiêm phòng định kỳ Mochi",
//     status: "Đã hẹn",
//   },
//   {
//     id: 2,
//     time: "14:00",
//     title: "Khám tổng quát Lulu",
//     status: "Đã hẹn",
//   },
// ];

// const historyAppointments = [
//   {
//     id: 3,
//     time: "10:15",
//     title: "Khám da liễu Bông",
//     status: "Hoàn thành",
//   },
//   {
//     id: 4,
//     time: "15:45",
//     title: "Tiêm vaccine Lulu",
//     status: "Hoàn thành",
//   },
// ];

// export default function PageMainUser() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { userProfile } = useAuth();

//   const [activeTab, setActiveTab] = useState("upcoming");

//   const [pets, setPets] = useState(dummyPets);

//   useEffect(() => {
//     if (location.state) {
//       setPets((prevPets) => [...prevPets, location.state]);
//     }
//   }, [location.state]);

//   const goToChatBot = () => {
//     navigate("/chatbot");
//   };

//   const goToBooking = () => {
//     navigate("/booking");
//   };

//   const goToMedicalRecords = () => {
//     navigate("/listPet");
//   };

//   const goToAppointmentDetail = () => {
//     navigate("/appointments");
//   };

//   return (
//     <div className="user-dashboard">
//       <Header />

//       <header className="dashboard-header">
//         <h1>Chào mừng, {userProfile?.fullName || "bạn"}!</h1>
//         <p>
//           Cùng dành những điều tuyệt vời nhất cho các “bạn cưng” của bạn ngày hôm
//           nay
//         </p>

//         <button className="btn-primaryy" onClick={goToBooking}>
//           Đặt lịch khám ngay
//         </button>
//       </header>

//       <h2 className="section-titles">Thú cưng của bạn</h2>

//       <section className="pet-listts">
//         {pets.map((p) => (
//           <article key={p.id} className="pet-card" style={{ width: "200px" }}>
//             <img src={p.avatar} alt={p.name} className="pet-avatar" />

//             <div className="pet-details">
//               <span className="pet-name">{p.name}</span>
//               <span className="pet-meta">
//                 {p.breed} <br />
//                 {p.age}
//               </span>
//             </div>

//             <button
//               className="btn-secondary"
//               onClick={() => navigate(`/petProfile`)}
//             >
//               Quản lý
//             </button>
//           </article>
//         ))}

//         <article
//           className="pet-card add-pet"
//           onClick={() => navigate("/add-pet")}
//           style={{ cursor: "pointer" }}
//         >
//           <div className="plus-circle">
//             <FaPlus className="plus-icon" />
//           </div>

//           <span className="add-text">Thêm thú cưng mới</span>
//         </article>
//       </section>

//       <section className="quick-links">
//         <div className="quick-card green">
//           <div className="icon-circle">
//             <FaBolt className="quick-icon" />
//           </div>

//           <div className="quick-text">
//             <h3>Diễn đàn cộng đồng</h3>
//             <p>Giao lưu giữa bác sĩ và chủ nuôi</p>
//           </div>

//           <a href="#" className="quick-link">
//             Bắt đầu →
//           </a>
//         </div>

//         <div className="quick-card blue">
//           <div className="icon-circle">
//             <FaRobot className="quick-icon" />
//           </div>

//           <div className="quick-text">
//             <h3>Tư vấn với AI Chatbot</h3>
//             <p>Hỏi đáp các triệu chứng sức khỏe ngay lập tức</p>
//           </div>

//           <a
//             href="#"
//             className="quick-link"
//             onClick={(e) => {
//               e.preventDefault();
//               goToChatBot();
//             }}
//           >
//             Trò chuyện →
//           </a>
//         </div>

//         <div className="quick-card orange">
//           <div className="icon-circle">
//             <FaFileMedical className="quick-icon" />
//           </div>

//           <div className="quick-text">
//             <h3>Hồ sơ y tế điện tử</h3>
//             <p>Xem được tất cả hồ sơ khám của thú cưng bạn</p>
//           </div>

//           <a
//             href="#"
//             className="quick-link"
//             onClick={(e) => {
//               e.preventDefault();
//               goToMedicalRecords();
//             }}
//           >
//             Đi đến →
//           </a>
//         </div>
//       </section>

//       <section className="appointments">
//         <div className="appointments-header">
//           <h2>Lịch hẹn của tôi</h2>

//           <div className="tabs">
//             <button
//               className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
//               onClick={() => setActiveTab("upcoming")}
//             >
//               Lịch hẹn sắp tới
//             </button>

//             <button
//               className={`tab ${activeTab === "history" ? "active" : ""}`}
//               onClick={() => setActiveTab("history")}
//             >
//               Lịch sử khám
//             </button>
//           </div>

//           <a
//             href="#"
//             className="view-all"
//             onClick={(e) => {
//               e.preventDefault();
//               goToAppointmentDetail();
//             }}
//           >
//             Xem chi tiết
//           </a>
//         </div>

//         <ul>
//           {(activeTab === "upcoming"
//             ? upcomingAppointments
//             : historyAppointments
//           ).map((a) => (
//             <li key={a.id}>
//               <span className="time" style={{padding: '10px', color: '#f32d26'}}>{a.time}</span>

//               {a.title}

//               <span
//                 className={`status ${
//                   activeTab === "upcoming" ? "upcoming" : "done"
//                 }`}
//               >
//                 {a.status}
//               </span>
//             </li>
//           ))}
//         </ul>
//       </section>
//       <Footer />
//     </div>
//   );
// }

import { FaBolt, FaFileMedical, FaPlus, FaRobot } from "react-icons/fa";
import Footer from "../../default/footer";
import Header from "../../default/header";
import "./styles.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";

const dummyPets = [
  {
    id: 1,
    petName: "Mochi",
    breed: "Cockapoo",
    age: "2 tuổi",
    avatar: "/gaugau.png",
  },
  {
    id: 2,
    petName: "Lulu",
    breed: "Mèo Anh lông ngắn",
    age: "1 tuổi",
    avatar: "/meomeo.png",
  },
  {
    id: 3,
    petName: "Bông",
    breed: "Mèo Ba Tư",
    age: "3 tuổi",
    avatar: "/lulu.png",
  },
];

const upcomingAppointments = [
  {
    id: 1,
    time: "09:30",
    title: "Tiêm phòng định kỳ Mochi",
    status: "Đã hẹn",
  },
  {
    id: 2,
    time: "14:00",
    title: "Khám tổng quát Lulu",
    status: "Đã hẹn",
  },
];

const historyAppointments = [
  {
    id: 3,
    time: "10:15",
    title: "Khám da liễu Bông",
    status: "Hoàn thành",
  },
  {
    id: 4,
    time: "15:45",
    title: "Tiêm vaccine Lulu",
    status: "Hoàn thành",
  },
];

export default function PageMainUser() {

  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [pets, setPets] = useState(dummyPets);

  useEffect(() => {

    if (location.state) {

      setPets((prevPets) => [...prevPets, location.state]);

    }

  }, [location.state]);

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

          {(activeTab === "upcoming"
            ? upcomingAppointments
            : historyAppointments
          ).map((a) => (

            <li key={a.id}>

              <span
                className="time"
                style={{
                  padding: "10px",
                  color: "#f32d26"
                }}
              >
                {a.time}
              </span>

              {a.title}

              <span
                className={`status ${
                  activeTab === "upcoming"
                    ? "upcoming"
                    : "done"
                }`}
              >
                {a.status}
              </span>

            </li>

          ))}

        </ul>

      </section>

      <Footer />

    </div>

  );

}