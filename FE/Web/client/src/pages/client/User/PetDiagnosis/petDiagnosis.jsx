import { CloseOutlined } from '@ant-design/icons';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './petDiagnosis.module.css';

const formatDate = (dateValue) => {
  if (!dateValue) return 'Không rõ ngày';
  return new Date(dateValue).toLocaleDateString('vi-VN');
};

export function PetDiagnosisContent({ diagnosis, appointment, onClose, inModal = false }) {
  const petName = diagnosis?.petName || appointment?.petName || 'thú cưng';
  const species = diagnosis?.species || appointment?.species;
  const appointmentDateLabel =
    diagnosis?.appointmentDateLabel || formatDate(diagnosis?.appointmentDate || appointment?.rawDate);
  const reportMarkdown = diagnosis?.reportMarkdown || 'Chưa có dữ liệu chẩn đoán AI cho lịch hẹn này.';

  return (
    <div className={inModal ? styles.modalContainer : undefined}>
      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Đóng báo cáo"
        >
          <CloseOutlined />
        </button>
      )}

      <h1 className={styles.title}>
        AI Báo cáo chẩn đoán sơ bộ cho {petName}
        {species ? ` (${species})` : ''} - {appointmentDateLabel}
      </h1>

      <div className={`${styles.content} ${inModal ? styles.contentInModal : ''}`}>
        <div className={styles.markdownReport}>
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

    navigate('/appointments');
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
