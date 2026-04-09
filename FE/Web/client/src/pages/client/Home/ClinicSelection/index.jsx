import { useEffect, useRef, useState } from "react";
import { message, Spin } from "antd";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getClinicByIdApi, getClinicListApi } from "../../../../data/client/api/clinicApi";
import { getClinicInfoContent } from "../../../../data/client/utils/clinicInfoStorage";
import "./styles.css";

export default function ClinicSelection() {
  const [clinics, setClinics] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchClinics = async () => {
      try {
        setLoading(true);
        const response = await getClinicListApi(1, 50, "");
        const clinicItems = Array.isArray(response?.items) ? response.items : [];

        if (!mounted) return;

        const normalized = clinicItems.map((clinic) => {
          const clinicInfo = getClinicInfoContent(clinic.id, clinic);

          return {
            ...clinic,
            ...clinicInfo,
            time: clinicInfo.timeDisplay || "8:00 - 20:00",
            image: clinicInfo.avatarUrl || clinic.avatarUrl || "/miniPet.png",
          };
        });

        setClinics(normalized);
      } catch (error) {
        message.error(error.message || "Không thể tải danh sách phòng khám");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchClinics();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = clinics.filter((c) =>
    (c.name || "").toLowerCase().includes(searchText.toLowerCase())
  );

useEffect(() => {
  const update = () => {
    nameRefs.current.forEach((el) => {
      if (!el) return;

      const textEl = el.querySelector(".clinic-name-text");
      if (!textEl) return;

      const isOverflow = textEl.scrollWidth > el.clientWidth;

      el.classList.toggle("is-overflow", isOverflow);
    });
  };

  requestAnimationFrame(update);
  window.addEventListener("resize", update);

  return () => window.removeEventListener("resize", update);
}, [filtered]);

  const handleChoose = async (clinic) => {
    try {
      setLoading(true);
      const clinicDetail = await getClinicByIdApi(clinic.id);
      const clinicInfo = getClinicInfoContent(clinic.id, clinicDetail || clinic);
      sessionStorage.setItem("selectedClinicId", String(clinic.id));

      navigate("/clinic", {
        state: {
          clinic: {
            ...clinicDetail,
            ...clinicInfo,
          },
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
          {filtered.map((clinic, index) => (
            <div key={clinic.id} className="clinic-card">
              <img
                src={clinic.image}
                alt={clinic.name}
                className="clinic-img"
              />

              <div className="clinic-info" style={{ color: "var(--color-text-primary)" }}>
                <h3
                  className="clinic-name"
                  title={clinic.name}
                  ref={(el) => (nameRefs.current[index] = el)}
                >
                  <span className="clinic-name-text">
                    {clinic.name}
                  </span>
                </h3>

                <p className="clinic-address" title={clinic.address}>
                  {clinic.address}
                </p>

                <p className="clinic-time" title={clinic.time}>
                  {clinic.time}
                </p>

                {clinic.phone ? (
                  <p className="clinic-phone" title={clinic.phone}> 
                   <p>SĐT: {clinic.phone}</p>
                  </p>
                ) : null}
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
    </div>
  );
}


