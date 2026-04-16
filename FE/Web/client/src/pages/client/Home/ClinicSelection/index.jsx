import { message, Rate, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getClientInstance } from "../../../../services/apiClient";
import { getClinicByIdApi, getClinicListApi } from "../../../../services/clinicService";
import {
  CLINIC_INFO_STORAGE_PREFIX,
  CLINIC_INFO_UPDATED_EVENT,
  formatClinicOpenHours,
  getClinicInfoContent,
} from "../../../../utils/storage/clinicInfoStorage";
import "./styles.css";

const formatPhoneVN = (phone) => {
  if (!phone) return "";

  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return String(phone);
};

export default function ClinicSelection() {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRefs = useRef([]);
  const navigate = useNavigate();

  const hydrateClinicFromLocalInfo = useCallback((clinic) => {
    const clinicInfo = getClinicInfoContent(clinic.id, clinic);
    const mergedName = String(clinicInfo.name || clinic.name || "").trim();
    const mergedAddress = String(clinicInfo.address || clinic.address || "").trim();
    const mergedPhone = String(clinicInfo.phone || clinic.phone || clinic.phoneNumber || "").trim();
    const mergedOpeningTime = String(
      clinicInfo.openingTime || clinicInfo.opening_time || clinic.openingTime || clinic.opening_time || "",
    ).trim();
    const mergedClosingTime = String(
      clinicInfo.closingTime || clinicInfo.closing_time || clinic.closingTime || clinic.closing_time || "",
    ).trim();
    const mergedTime =
      formatClinicOpenHours({ openingTime: mergedOpeningTime, closingTime: mergedClosingTime }) ||
      String(clinicInfo.timeDisplay || clinic.time || "").trim() ||
      "8:00 - 20:00";

    const rawImage =
      String(clinicInfo.avatarUrl || clinic.avatarUrl || clinic.image || "/miniPet.png").trim();
    const imageVersion = Number(clinicInfo.updatedAt) || 0;
    const mergedImage =
      rawImage && /^https?:\/\//i.test(rawImage) && imageVersion > 0
        ? `${rawImage}${rawImage.includes("?") ? "&" : "?"}v=${imageVersion}`
        : rawImage;

    return {
      ...clinic,
      ...clinicInfo,
      name: mergedName,
      address: mergedAddress,
      phone: mergedPhone,
      openingTime: mergedOpeningTime,
      closingTime: mergedClosingTime,
      localInfo: clinicInfo,
      time: mergedTime,
      image: mergedImage,
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchClinics = async () => {
      try {
        setLoading(true);
        const response = await getClinicListApi(getClientInstance(), 1, 50, "");
        const clinicItems = Array.isArray(response?.items) ? response.items : [];

        if (!mounted) return;

        const normalized = clinicItems.map((clinic) => hydrateClinicFromLocalInfo(clinic));

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
  }, [hydrateClinicFromLocalInfo, t]);

  useEffect(() => {
    const syncClinicsFromLocalStorage = (clinicId = "") => {
      const normalizedClinicId = String(clinicId || "").trim();

      setClinics((prev) =>
        prev.map((clinic) => {
          if (!normalizedClinicId || String(clinic.id) === normalizedClinicId) {
            return hydrateClinicFromLocalInfo(clinic);
          }

          return clinic;
        }),
      );
    };

    const handleStorage = (event) => {
      if (!event?.key || !event.key.startsWith(CLINIC_INFO_STORAGE_PREFIX)) {
        return;
      }

      const changedClinicId = String(event.key || "")
        .replace(CLINIC_INFO_STORAGE_PREFIX, "")
        .trim();
      syncClinicsFromLocalStorage(changedClinicId);
    };

    const handleClinicInfoUpdated = (event) => {
      syncClinicsFromLocalStorage(event?.detail?.clinicId || "");
    };

    const handleWindowFocus = () => {
      syncClinicsFromLocalStorage();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncClinicsFromLocalStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CLINIC_INFO_UPDATED_EVENT, handleClinicInfoUpdated);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CLINIC_INFO_UPDATED_EVENT, handleClinicInfoUpdated);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hydrateClinicFromLocalInfo]);

  const getRatingPercentage = (clinic) => {
    const avgRating = Number(clinic?.avgRating) || 0;
    const boundedRating = Math.max(0, Math.min(5, avgRating));
    return (boundedRating / 5) * 100;
  };

  const filtered = clinics.filter((c) =>
    (c.name || "").toLowerCase().includes(searchText.toLowerCase())
  ).sort((a, b) => {
    const percentageDiff = getRatingPercentage(b) - getRatingPercentage(a);
    if (percentageDiff !== 0) return percentageDiff;

    const reviewDiff = (Number(b?.totalReviews) || 0) - (Number(a?.totalReviews) || 0);
    if (reviewDiff !== 0) return reviewDiff;

    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });

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

                {(() => {
                  const clinicPhone = clinic.phone || clinic.localInfo?.phone;
                  if (!clinicPhone) return null;

                  return (
                    <p className="clinic-phone" title={clinicPhone}>
                      {t("common.labels.phone")}: {formatPhoneVN(clinicPhone)}
                    </p>
                  );
                })()}

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


