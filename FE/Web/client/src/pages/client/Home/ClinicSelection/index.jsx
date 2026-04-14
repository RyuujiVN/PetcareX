import { message, Rate, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getClientInstance } from "../../../../services/apiClient";
import { getClinicByIdApi, getClinicListApi } from "../../../../services/clinicService";
import { getClinicInfoContent } from "../../../../utils/storage/clinicInfoStorage";
import "./styles.css";

export default function ClinicSelection() {
  const { t } = useTranslation();
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
        const response = await getClinicListApi(getClientInstance(), 1, 50, "");
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
        message.error(error.message || t("pages.home.clinicSelection.loadListFailed"));
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
      const clinicDetail = await getClinicByIdApi(getClientInstance(), clinic.id);
      const clinicInfo = getClinicInfoContent(clinic.id, clinicDetail || clinic);
      sessionStorage.setItem("selectedClinicId", String(clinic.id));

      navigate(`/clinic/${clinic.id}`, {
        state: {
          clinic: {
            ...clinicDetail,
            ...clinicInfo,
          },
          selectedClinicId: String(clinic.id),
        },
      });
    } catch (error) {
      message.error(error.message || t("pages.home.clinicSelection.loadDetailFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clinic-page">
      <div className="clinic-header">
        <h2>{t("pages.home.clinicSelection.title")}</h2>

        <div className="search-form">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />

            <input
              type="text"
              className="clinic-search"
              placeholder={t("pages.home.clinicSelection.searchPlaceholder")}
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
                    {t("common.labels.phone")}: {clinic.phone}
                  </p>
                ) : null}

                {(() => {
                  const avgRating = Number(clinic.avgRating) || 0;
                  const totalReviews = Number(clinic.totalReviews) || 0;
                  const hasReviews = totalReviews > 0;

                  return (
                    <div className="clinic-rating">
                      <Rate
                        disabled
                        allowHalf
                        value={hasReviews ? avgRating : 0}
                        className="clinic-rating-stars"
                      />
                      {hasReviews ? (
                        <p className="clinic-rating-text">
                          {avgRating.toFixed(1)} • {totalReviews} {t("pages.home.clinicSelection.reviewCount")}
                        </p>
                      ) : (
                        <p className="clinic-rating-empty">{t("pages.home.clinicSelection.noReview")}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button
                className="btn-choose"
                onClick={() => handleChoose(clinic)}
              >
                {t("pages.home.clinicSelection.chooseButton")}
              </button>
            </div>
          ))}
        </div>
      </Spin>
    </div>
  );
}


