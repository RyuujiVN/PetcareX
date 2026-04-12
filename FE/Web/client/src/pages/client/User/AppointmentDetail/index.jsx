import * as icons from '@ant-design/icons';
import * as antd from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import ScrollToTopButton from '../../../../components/common/ScrollToTopButton/ScrollToTopButton';
import { getClientInstance } from '../../../../services/apiClient';
import {
    APPOINTMENT_STATUS,
  getAppointmentAiDiagnosisApi,
    getMyAppointmentsApi,
    updateAppointmentStatusApi,
} from '../../../../services/appointmentService';
import { getBreedLabel } from '../../../../services/petService';
import { getAppointmentStatusLabel, getServiceLabel } from '../../../../utils/enumLabel';
import { PetDiagnosisContent } from '../PetDiagnosis/petDiagnosis';
import './styles.css';

const formatDate = (dateValue, locale) => new Date(dateValue).toLocaleDateString(locale);
const formatTime = (timeValue) => (timeValue || '').slice(0, 5);
const buildAppointmentsSignature = (items) =>
  items
    .map(
      (item) =>
        `${item?.id || ''}:${item?.status || ''}:${item?.appointmentDate || ''}:${item?.appointmentTime || ''}:${item?.updatedAt || ''}`,
    )
    .join('|');

const APPOINTMENT_STATUS_TAG_COLOR = {
  [APPOINTMENT_STATUS.BOOKED]: 'blue',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'processing',
  [APPOINTMENT_STATUS.COMPLETED]: 'success',
  [APPOINTMENT_STATUS.CANCELLED]: 'error',
};

const AppointmentDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isDiagnosisVisible, setIsDiagnosisVisible] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [diagnosisAppointment, setDiagnosisAppointment] = useState(null);
  const autoOpenedDiagnosisRef = useRef('');
  const inFlightRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const lastDataSignatureRef = useRef('');

  const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    try {
      if (!hasLoadedOnceRef.current && !silent) {
        setLoading(true);
      }

      const res = await getMyAppointmentsApi(getClientInstance(), 1, 200);
      const nextItems = Array.isArray(res?.items) ? res.items : [];
      const nextSignature = buildAppointmentsSignature(nextItems);

      if (nextSignature !== lastDataSignatureRef.current) {
        lastDataSignatureRef.current = nextSignature;
        setAppointments(nextItems);
      }

      hasLoadedOnceRef.current = true;
    } catch (error) {
      antd.message.error(error.message || t('pages.appointmentDetail.loadFailed'));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchAppointments({ silent: true });
    }, 20000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAppointments({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchAppointments]);

  const mappedAppointments = useMemo(() => {
    return appointments.map((item) => {
      const date = item.appointmentDate;
      const dateText = formatDate(date, dateLocale);
      const timeText = formatTime(item.appointmentTime);

      return {
        id: item.id,
        petId: item.pet?.id,
        petName: item.pet?.name || t('pages.appointmentDetail.unknownPet'),
        breed: getBreedLabel(item.pet?.breed, item.pet?.species),
        avatar: item.pet?.avatar || '/gaugau.png',
        clinic: item.clinic?.name || t('pages.appointmentDetail.unknownClinic'),
        clinicAddress: item.clinic?.address || t('pages.appointmentDetail.unknownAddress'),
        service: getServiceLabel(item.service, `${item.service}`),
        date: dateText,
        time: timeText,
        veterinarian: item.veterinarian?.user?.fullName || t('pages.appointmentDetail.unknownDoctor'),
        species: item.pet?.species || '',
        notes: item.note,
        symptoms: item.symptoms || item.medical?.symptoms || '',
        rawDate: date,
        status: item.status,
        statusLabel: getAppointmentStatusLabel(item.status, item.status),
      };
    });
  }, [appointments, dateLocale, t]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return mappedAppointments.filter((item) => {
      const dateTime = new Date(`${item.rawDate}T${item.time}:00`);
      const isFuture = dateTime >= now;
      const isDone = item.status === APPOINTMENT_STATUS.COMPLETED;
      const isCanceled = item.status === APPOINTMENT_STATUS.CANCELLED;
      return isFuture && !isDone && !isCanceled;
    }).sort((a, b) => new Date(`${a.rawDate}T${a.time}:00`).getTime() - new Date(`${b.rawDate}T${b.time}:00`).getTime());
  }, [mappedAppointments]);

  const medicalHistory = useMemo(() => {
    const now = new Date();
    return mappedAppointments.filter((item) => {
      const dateTime = new Date(`${item.rawDate}T${item.time}:00`);
      const isPast = dateTime < now;
      const isDone = item.status === APPOINTMENT_STATUS.COMPLETED;
      const isCanceled = item.status === APPOINTMENT_STATUS.CANCELLED;
      return isPast || isDone || isCanceled;
    }).sort((a, b) => new Date(`${b.rawDate}T${b.time}:00`).getTime() - new Date(`${a.rawDate}T${a.time}:00`).getTime());
  }, [mappedAppointments]);

  const handleCancelAppointment = (appointmentId) => {
    antd.Modal.confirm({
      title: t('pages.appointmentDetail.confirmCancel.title'),
      content: t('pages.appointmentDetail.confirmCancel.content'),
      okText: t('pages.appointmentDetail.confirmCancel.okText'),
      cancelText: t('pages.appointmentDetail.confirmCancel.cancelText'),
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        try {
          await updateAppointmentStatusApi(getClientInstance(), appointmentId, APPOINTMENT_STATUS.CANCELLED);
          antd.message.success(t('pages.appointmentDetail.cancelSuccess'));
          await fetchAppointments({ silent: true });
        } catch (error) {
          antd.message.error(error.message || t('pages.appointmentDetail.cancelFailed'));
        }
      },
    });
  };
const handleViewDetails = (appointment) => {
  const img = new Image();
  img.src = appointment.avatar;

  setSelectedAppointment(appointment);
  setIsModalVisible(true);
};

  const handleOpenDiagnosis = useCallback(async (appointment) => {
    setDiagnosisAppointment(appointment);
    setDiagnosisData(null);
    setIsDiagnosisVisible(true);
    setDiagnosisLoading(true);

    try {
      const diagnosisResponse = await getAppointmentAiDiagnosisApi(
        getClientInstance(),
        appointment.id,
      );

      const report = {
        appointmentId: appointment.id,
        petName: diagnosisResponse?.pet?.name || appointment.petName,
        species: appointment.species,
        appointmentDate: appointment.rawDate,
        appointmentDateLabel: formatDate(appointment.rawDate, dateLocale),
        symptoms:
          diagnosisResponse?.symptoms ||
          diagnosisResponse?.medical?.symptoms ||
          appointment.symptoms ||
          '',
        reportMarkdown:
          diagnosisResponse?.diagnosis || t('pages.petDiagnosis.emptyReport'),
        source: 'backend',
        generatedAt: diagnosisResponse?.createdAt || new Date().toISOString(),
      };

      setDiagnosisData(report);
    } catch (error) {
      antd.message.error(error.message || t('pages.appointmentDetail.diagnosisLoadFailed'));
    } finally {
      setDiagnosisLoading(false);
    }
  }, [dateLocale, t]);

  const diagnosisAppointmentIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return String(params.get('appointmentId') || '').trim();
  }, [location.search]);

  useEffect(() => {
    if (!diagnosisAppointmentIdFromQuery) return;
    if (autoOpenedDiagnosisRef.current === diagnosisAppointmentIdFromQuery) return;

    const targetAppointment = mappedAppointments.find(
      (item) => String(item.id) === diagnosisAppointmentIdFromQuery,
    );

    if (!targetAppointment) return;

    autoOpenedDiagnosisRef.current = diagnosisAppointmentIdFromQuery;
    void handleOpenDiagnosis(targetAppointment);
    navigate('/appointments', { replace: true });
  }, [diagnosisAppointmentIdFromQuery, handleOpenDiagnosis, mappedAppointments, navigate]);
  const handleBookingNew = () => {
    navigate('/booking');
  };

  const AppointmentCard = ({ appointment, isHistory = false }) => (
    <antd.Card className="appointment-card" hoverable style={{ marginBottom: '16px' }}>
      <antd.Row gutter={[16, 16]}>
        <antd.Col xs={24} sm={6}>
          <div className="appointment-pet-image">
            <antd.Image
              style={{width: 150, height: 170, objectFit: 'cover', margin: '0 auto', borderRadius: 12}}
              src={appointment.avatar}
              alt={appointment.petName}
              >
              </antd.Image>
          </div>
        </antd.Col>
        <antd.Col xs={24} sm={12}>
          <div className="appointment-content">
            <div className="appointment-header">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                {appointment.petName} - {appointment.breed}
              </h3>
              <antd.Tag color={APPOINTMENT_STATUS_TAG_COLOR[appointment.status] || 'default'}>{appointment.statusLabel}</antd.Tag>
            </div>

            <div className="appointment-info">
              <p style={{ marginBottom: '8px' }}>
                <icons.MedicineBoxOutlined style={{ marginRight: '8px', color: 'var(--color-info)' }} />
                {appointment.service}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <icons.EnvironmentOutlined style={{ marginRight: '8px', color: 'var(--color-success)' }} />
                {appointment.clinic}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-disabled)' }}>{appointment.clinicAddress}</span>
              </p>
              <p style={{ marginBottom: '0' }}>
                <icons.CalendarOutlined style={{ marginRight: '8px', color: 'var(--color-warning)' }} />
                {appointment.date} <icons.ClockCircleOutlined style={{ marginLeft: '16px', marginRight: '8px' }} />
                {appointment.time}
              </p>
            </div>
          </div>
        </antd.Col>
        <antd.Col xs={24} sm={6}>
          <antd.Space direction="vertical" style={{ width: '100%' }}>
            <antd.Button
              style={{ backgroundColor: 'var(--page-appointment-primary)', borderColor: 'var(--page-appointment-primary)' }}
              type="primary"
              block
              icon={<icons.EyeOutlined />}
              onClick={() => handleViewDetails(appointment)}
            >
              {t('pages.appointmentDetail.actions.viewDetail')}
            </antd.Button>
            <antd.Button
              style={{ backgroundColor: 'var(--color-text-secondary)', borderColor: 'var(--color-text-secondary)' }}
              type="primary"
              block
              icon={<icons.ReadOutlined />}
              onClick={() => handleOpenDiagnosis(appointment)}
            >
              {t('pages.appointmentDetail.actions.diagnosis')}
            </antd.Button>
            {!isHistory && (
              <antd.Button
                danger
                block
                icon={<icons.DeleteOutlined />}
                onClick={() => handleCancelAppointment(appointment.id)}
              >
                {t('pages.appointmentDetail.actions.cancel')}
              </antd.Button>
            )}
          </antd.Space>
        </antd.Col>
      </antd.Row>
    </antd.Card>
  );

  return (
    <div className="appointment-detail-wrapper">
      <div className="appointment-detail-container">
        <div className="appointment-header-section">
          <h1>{t('pages.appointmentDetail.title')}</h1>
          <p>{t('pages.appointmentDetail.subtitle')}</p>
          <antd.Button
            type="primary"
            size="large"
            onClick={handleBookingNew}
            style={{ marginTop: '16px', backgroundColor: 'var(--page-appointment-primary)', borderColor: 'var(--page-appointment-primary)' }}
          >
            + {t('pages.appointmentDetail.bookNew')}
          </antd.Button>
        </div>

        <antd.Tabs
        style={{ color: 'var(--page-appointment-primary)' }}
          activeKey={activeTab}
          onChange={setActiveTab}
          className="appointment-tabs"
          items={[
            {
              key: 'upcoming',
              label: (
                <span style={{ color: 'var(--page-appointment-primary)' }}>
                  <icons.CalendarOutlined style={{ color: 'var(--page-appointment-primary)', margin: '0 8px 0 0' }}/>
                  {t('pages.appointmentDetail.tabs.upcoming')} ({upcomingAppointments.length })
                </span>
              ),
              children: (
                <antd.Spin spinning={loading}>
                  {upcomingAppointments.length > 0 ? (
                    <div>
                      {upcomingAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          isHistory={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <antd.Empty
                      description={t('pages.appointmentDetail.emptyUpcoming')}
                      style={{ marginTop: '48px' }}
                    />
                  )}
                </antd.Spin>
              ),
            },
            {
              key: 'history',
              label: (
                <span style={{ color: 'var(--page-appointment-primary)' }}>
                  <icons.MedicineBoxOutlined style={{ color: 'var(--page-appointment-primary)', margin: '0 8px 0 0' }} />
                  {t('pages.appointmentDetail.tabs.history')} ({medicalHistory.length})
                </span>
              ),
              children: (
                <antd.Spin spinning={loading}>
                  {medicalHistory.length > 0 ? (
                    <div>
                      {medicalHistory.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          isHistory
                        />
                      ))}
                    </div>
                  ) : (
                    <antd.Empty description={t('pages.appointmentDetail.emptyHistory')} style={{ marginTop: '48px' }} />
                  )}
                </antd.Spin>
              ),
            },
          ]}
        />
        <antd.Modal
          title={t('pages.appointmentDetail.modal.title')}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          centered
          maskClosable={false}
          footer={[
            <antd.Button key="back" onClick={() => setIsModalVisible(false)}>
              {t('common.actions.close')}
            </antd.Button>,
            <antd.Button
              style={{ backgroundColor: 'var(--page-appointment-primary)', borderColor: 'var(--page-appointment-primary)' }}
              key="submit"
              type="primary"
              onClick={() => {
                setIsModalVisible(false);
                navigate(`/petProfile?id=${selectedAppointment.petId}`);
              }}
            >
              {t('pages.appointmentDetail.modal.viewPetProfile')}
            </antd.Button>,
          ]}
          width={700}
          className="custom-modal-fixed"
          forceRender
            modalRender={(node) => <div style={{ willChange: 'transform' }}>{node}</div>}

        >
          {selectedAppointment && (
       <div className="modal-contents">
      <antd.Row gutter={16} align="middle">
        <antd.Col span={5}>
          <img
            src={selectedAppointment.avatar}
            alt={selectedAppointment.petName}
            className="modal-avatar"
          />
        </antd.Col>

        <antd.Col span={16}>
          <div className="info-header">
            <h3 style={{fontSize: 17, fontWeight: 'bold'}}>{t('pages.appointmentDetail.modal.petInfoTitle')}</h3>
            <p style={{marginBottom: 0, margin: 0}}><strong>{t('pages.appointmentDetail.modal.petName')}:</strong> {selectedAppointment.petName}</p>
            <p style={{marginBottom: 0}}><strong>{t('pages.appointmentDetail.modal.breed')}:</strong> {selectedAppointment.breed}</p>
          </div>
        </antd.Col>
      </antd.Row>

      <antd.Divider />

      <div className="appointment-detail-info">
        <h3>{t('pages.appointmentDetail.modal.appointmentInfoTitle')}</h3>

        <p>
          <icons.CalendarOutlined /> <strong>{t('pages.appointmentDetail.modal.date')}:</strong> {selectedAppointment.date}
        </p>

        <p>
          <icons.ClockCircleOutlined /> <strong>{t('pages.appointmentDetail.modal.time')}:</strong> {selectedAppointment.time}
        </p>

        <p>
          <icons.EnvironmentOutlined /> <strong>{t('pages.appointmentDetail.modal.clinic')}:</strong> {selectedAppointment.clinic}
        </p>

        <p>
          <icons.UserOutlined /> <strong>{t('pages.appointmentDetail.modal.doctor')}:</strong> {selectedAppointment.veterinarian}
        </p>

        <p>
          <icons.MedicineBoxOutlined /> <strong>{t('pages.appointmentDetail.modal.service')}:</strong> {selectedAppointment.service}
        </p>
      </div>

      {selectedAppointment.notes && (
        <>
          <antd.Divider />
          <div className="appointment-notes">
            <strong>{t('pages.appointmentDetail.modal.notes')}:</strong>
          <div className="notes-content modal-notes">
          {selectedAppointment.notes}
            </div>
          </div>
        </>
      )}
    </div>
          )}
        </antd.Modal>

        <antd.Modal
          open={isDiagnosisVisible}
          onCancel={() => {
            setIsDiagnosisVisible(false);
            setDiagnosisData(null);
            setDiagnosisAppointment(null);
          }}
          footer={null}
          width={920}
          centered
          className="diagnosis-modal"
          destroyOnClose
        >
          <div className="diagnosis-modal-shell">
            {diagnosisLoading ? (
              <div className="diagnosis-loading-wrap">
                <antd.Spin size="large" />
              </div>
            ) : (
              <PetDiagnosisContent
                diagnosis={diagnosisData}
                appointment={diagnosisAppointment}
                onClose={() => {
                  setIsDiagnosisVisible(false);
                  setDiagnosisData(null);
                  setDiagnosisAppointment(null);
                }}
                inModal
              />
            )}
          </div>
        </antd.Modal>
      </div>
      <ScrollToTopButton threshold={300} />
    </div>
  );
};

export default AppointmentDetail;


