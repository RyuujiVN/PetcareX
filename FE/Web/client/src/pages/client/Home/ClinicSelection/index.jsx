import { message, Spin } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMapMarkerAlt, FaSearch, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getClientInstance } from "../../../../services/apiClient";
import { getClinicByIdApi, getNearbyClinicListApi } from "../../../../services/clinicService";
import { useUserLocation } from "../../../../hooks/client/useUserLocation";
import { formatDistance } from "../../../../utils/formatDistance";
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
  const { lat, lon, isLoading: locationLoading } = useUserLocation();

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
    // Chờ xong bước lấy vị trí rồi mới fetch — tránh fire 2 request (default + real).
    if (locationLoading) return;

    let mounted = true;

    const fetchClinics = async () => {
      try {
        setLoading(true);
        const clinicItems = await getNearbyClinicListApi(getClientInstance(), {
          page: 1,
          limit: 50,
          lat,
          lon,
          sortBy: "distance",
        });

        if (!mounted) return;

        const normalized = (Array.isArray(clinicItems) ? clinicItems : []).map((clinic) =>
          hydrateClinicFromLocalInfo(clinic),
        );

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
  }, [hydrateClinicFromLocalInfo, t, lat, lon, locationLoading]);

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

  // BE đã sort theo distance (ES _geo_distance) — giữ nguyên thứ tự, FE chỉ lọc theo tên.
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

      <Spin spinning={loading || locationLoading}>
        <div className="clinic-grid">
          {filtered.map((clinic, index) => {
            const avgRating = Number(clinic.avgRating) || 0;
            const totalReviews = Number(clinic.totalReviews) || 0;
            const hasReviews = totalReviews > 0;
            const distanceLabel = formatDistance(clinic.distance);

            return (
              <div key={clinic.id} className="clinic-card">
                <img
                  src={clinic.image}
                  alt={clinic.name}
                  className="clinic-img"
                />

                <div
                  className={`clinic-rating-badge ${hasReviews ? "" : "is-empty"}`}
                  title={
                    hasReviews
                      ? `${avgRating.toFixed(1)} • ${totalReviews} ${t("pages.home.clinicSelection.reviewCount")}`
                      : t("pages.home.clinicSelection.noReview")
                  }
                >
                  <FaStar className="clinic-rating-badge-icon" aria-hidden="true" />
                  <span className="clinic-rating-badge-value">
                    {hasReviews
                      ? avgRating.toFixed(1)
                      : t("pages.home.clinicSelection.ratingBadgeFallback")}
                  </span>
                </div>

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

                  {distanceLabel && (
                    <p className="clinic-distance" title={distanceLabel}>
                      <FaMapMarkerAlt className="clinic-distance-icon" aria-hidden="true" />
                      <span>{distanceLabel}</span>
                    </p>
                  )}

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
                </div>

                <button
                  className="btn-choose"
                  onClick={() => handleChoose(clinic)}
                >
                  {t("pages.home.clinicSelection.chooseButton")}
                </button>
              </div>
            );
          })}
        </div>
      </Spin>
    </div>
  );
}


