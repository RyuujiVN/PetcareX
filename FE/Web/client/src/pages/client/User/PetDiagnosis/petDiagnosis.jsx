import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./petDiagnosis.module.css";

const formatDate = (dateValue, locale, t) => {
  if (!dateValue) return t("pages.petDiagnosis.unknownDate");
  return new Date(dateValue).toLocaleDateString(locale);
};

export function PetDiagnosisContent({
  diagnosis,
  appointment,
  onClose,
  inModal = false,
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? "en-US" : "vi-VN";
  const petName =
    diagnosis?.petName ||
    appointment?.petName ||
    t("pages.petDiagnosis.defaultPetName");
  const species = diagnosis?.species || appointment?.species;
  const appointmentDateLabel =
    diagnosis?.appointmentDateLabel ||
    formatDate(
      diagnosis?.appointmentDate || appointment?.rawDate,
      dateLocale,
      t,
    );
  const symptomsText = String(
    diagnosis?.symptoms || appointment?.symptoms || "",
  ).trim();
  const reportMarkdown =
    diagnosis?.reportMarkdown || t("pages.petDiagnosis.emptyReport");

  return (
    <div className={inModal ? styles.modalContainer : undefined}>
      {/* {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('pages.petDiagnosis.closeAria')}
        >
          <CloseOutlined />
        </button>
      )} */}

      <h1 className={styles.title}>
        {t("pages.petDiagnosis.reportTitle", { petName })}
        {species ? ` (${species})` : ""} - {appointmentDateLabel}
      </h1>

      <div
        className={`${styles.content} ${inModal ? styles.contentInModal : ""}`}
      >
        {symptomsText ? (
          <section className={styles.symptomsPanel}>
            <p className={styles.symptomsTitle}>
              Triệu chứng do chủ nuôi mô tả
            </p>
            <p className={styles.symptomsBody}>{symptomsText}</p>
          </section>
        ) : null}

        <div className="markdown-body">
          <Markdown remarkPlugins={[remarkGfm]}>{reportMarkdown}</Markdown>
        </div>
      </div>
    </div>
  );
}

export default function PetDiagnosis() {
  const navigate = useNavigate();
  const location = useLocation();
  const diagnosis = location.state?.diagnosis || null;
  const appointment = location.state?.appointment || null;

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/appointments");
  };

  return (
    <div className={styles.pageWrap}>
      <section className={styles.reportCard}>
        <PetDiagnosisContent
          diagnosis={diagnosis}
          appointment={appointment}
          onClose={handleClose}
        />
      </section>
    </div>
  );
}
