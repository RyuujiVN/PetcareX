import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as antd from 'antd';
import * as icons from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  APPOINTMENT_STATUS,
  getMyAppointmentsApi,
  updateAppointmentStatusApi,
} from '../../../../data/client/api/appointmentApi'; 
import { getBreedLabel } from '../../../../data/client/api/petApi';
import { PetDiagnosisContent } from '../PetDiagnosis/petDiagnosis';
import {
  generateAndStoreDiagnosisReport,
  getStoredDiagnosisReport,
} from '../../../../data/client/api/appointmentDiagnosis';
import './styles.css';

const formatDate = (dateValue) => new Date(dateValue).toLocaleDateString('vi-VN');
const formatTime = (timeValue) => (timeValue || '').slice(0, 5);

const calcDaysAgo = (dateValue) => {
  const now = new Date();
  const date = new Date(dateValue);
  const ms = now.getTime() - date.getTime();
  const days = Math.max(Math.floor(ms / (1000 * 60 * 60 * 24)), 0);

  if (days === 0) return 'Hôm nay';
  if (days < 7) return `${days} ngày`;
  return `${Math.floor(days / 7)} tuần`;
};

const AppointmentDetail = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isDiagnosisVisible, setIsDiagnosisVisible] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [diagnosisAppointment, setDiagnosisAppointment] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyAppointmentsApi(1, 200);
      setAppointments(Array.isArray(res?.items) ? res.items : []);
    } catch (error) {
      antd.message.error(error.message || 'Không thể tải lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchAppointments();
    }, 20000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAppointments();
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
      const dateText = formatDate(date);
      const timeText = formatTime(item.appointmentTime);

      return {
        id: item.id,
        petId: item.pet?.id,
        petName: item.pet?.name || 'Không rõ',
        breed: getBreedLabel(item.pet?.breed, item.pet?.species),
        avatar: item.pet?.avatar || '/gaugau.png',
        clinic: item.clinic?.name || 'Không rõ',
        clinicAddress: item.clinic?.address || 'Không rõ',
        service: `${item.service}`,
        date: dateText,
        time: timeText,
        veterinarian: item.veterinarian?.user?.fullName || 'Không rõ',
        species: item.pet?.species || '',
        notes: item.note,
        rawDate: date,
        status: item.status,
        daysAgo: calcDaysAgo(date),
      };
    });
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return mappedAppointments.filter((item) => {
      const dateTime = new Date(`${item.rawDate}T${item.time}:00`);
      const isFuture = dateTime >= now;
      const isDone = item.status === APPOINTMENT_STATUS.DONE;
      const isCanceled = item.status === APPOINTMENT_STATUS.CANCELED;
      return isFuture && !isDone && !isCanceled;
    });
  }, [mappedAppointments]);

  const medicalHistory = useMemo(() => {
    const now = new Date();
    return mappedAppointments.filter((item) => {
      const dateTime = new Date(`${item.rawDate}T${item.time}:00`);
      const isPast = dateTime < now;
      const isDone = item.status === APPOINTMENT_STATUS.DONE;
      const isCanceled = item.status === APPOINTMENT_STATUS.CANCELED;
      return isPast || isDone || isCanceled;
    });
  }, [mappedAppointments]);

  const handleCancelAppointment = (appointmentId) => {
    antd.Modal.confirm({
      title: 'Hủy lịch khám',
      content: 'Bạn chắc chắn muốn hủy lịch khám này không?',
      okText: 'Có, hủy',
      cancelText: 'Không, quay lại',
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        try {
          await updateAppointmentStatusApi(appointmentId, APPOINTMENT_STATUS.CANCELED);
          antd.message.success('Hủy lịch khám thành công');
          await fetchAppointments();
        } catch (error) {
          antd.message.error(error.message || 'Không thể hủy lịch khám');
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

  const handleOpenDiagnosis = async (appointment) => {
    setDiagnosisAppointment(appointment);
    setDiagnosisData(null);
    setIsDiagnosisVisible(true);
    setDiagnosisLoading(true);

    try {
      const cached = getStoredDiagnosisReport(appointment.id);
      if (cached) {
        setDiagnosisData(cached);
        return;
      }

      const report = await generateAndStoreDiagnosisReport({
        appointmentId: appointment.id,
        symptomsText: appointment.notes,
        petName: appointment.petName,
        species: appointment.species,
        appointmentDate: appointment.rawDate,
      });

      setDiagnosisData(report);
    } catch (error) {
      antd.message.error(error.message || 'Không thể tải chẩn đoán AI');
    } finally {
      setDiagnosisLoading(false);
    }
  };
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
              {isHistory && <antd.Tag color="blue">{appointment.daysAgo}</antd.Tag>}
              {!isHistory && <antd.Badge count={appointment.status} style={{ backgroundColor: 'var(--color-info)' }} />}
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
              Xem chi tiết
            </antd.Button>
            <antd.Button
              style={{ backgroundColor: 'var(--color-text-secondary)', borderColor: 'var(--color-text-secondary)' }}
              type="primary"
              block
              icon={<icons.ReadOutlined />}
              onClick={() => handleOpenDiagnosis(appointment)}
            >
              Chuẩn đoán
            </antd.Button>
            {!isHistory && (
              <antd.Button
                danger
                block
                icon={<icons.DeleteOutlined />}
                onClick={() => handleCancelAppointment(appointment.id)}
              >
                Hủy lịch
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
          <h1>Lịch khám</h1>
          <p>Quản lý các cuộc khám sức khỏe cho các bạn cưng của bạn</p>
          <antd.Button
            type="primary"
            size="large"
            onClick={handleBookingNew}
            style={{ marginTop: '16px', backgroundColor: 'var(--page-appointment-primary)', borderColor: 'var(--page-appointment-primary)' }}
          >
            + Đặt lịch khám mới
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
                  Lịch sắp tới ({upcomingAppointments.length })
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
                      description="Không có lịch khám sắp tới"
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
                  Lịch sử khám ({medicalHistory.length})
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
                    <antd.Empty description="Chưa có lịch khám" style={{ marginTop: '48px' }} />
                  )}
                </antd.Spin>
              ),
            },
          ]}
        />
        <antd.Modal
          title="Chi tiết lịch khám"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          centered
          maskClosable={false}
          footer={[
            <antd.Button key="back" onClick={() => setIsModalVisible(false)}>
              Đóng
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
              Xem hồ sơ thú cưng
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
            <h3 style={{fontSize: 17, fontWeight: 'bold'}}>Thông tin thú cưng</h3>
            <p style={{marginBottom: 0, margin: 0}}><strong>Tên:</strong> {selectedAppointment.petName}</p>
            <p style={{marginBottom: 0}}><strong>Giống loại:</strong> {selectedAppointment.breed}</p>
          </div>
        </antd.Col>
      </antd.Row>

      <antd.Divider />

      <div className="appointment-detail-info">
        <h3>Thông tin lịch khám</h3>

        <p>
          <icons.CalendarOutlined /> <strong>Ngày:</strong> {selectedAppointment.date}
        </p>

        <p>
          <icons.ClockCircleOutlined /> <strong>Giờ:</strong> {selectedAppointment.time}
        </p>

        <p>
          <icons.EnvironmentOutlined /> <strong>Phòng khám:</strong> {selectedAppointment.clinic}
        </p>

        <p>
          <icons.UserOutlined /> <strong>Bác sĩ:</strong> {selectedAppointment.veterinarian}
        </p>

        <p>
          <icons.MedicineBoxOutlined /> <strong>Dịch vụ:</strong> {selectedAppointment.service}
        </p>
      </div>

      {selectedAppointment.notes && (
        <>
          <antd.Divider />
          <div className="appointment-notes">
            <strong>Ghi chú:</strong>
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
    </div>
  );
};

export default AppointmentDetail;


