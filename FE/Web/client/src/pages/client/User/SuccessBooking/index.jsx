import { CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, message, Row } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { getServiceLabel } from '../../../../utils/enumLabel';
import './styles.css';

const SuccessBooking = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [appointmentData, setAppointmentData] = useState(null);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    const state = location.state?.appointmentData;

    if (!state) {
      message.warning(t('pages.successBooking.notFound'));
      navigate('/appointments');
      return;
    }

    setAppointmentData(state);
    setQrValue(`https://petcarex.app/check-in/${state.appointmentId}`);
  }, [location.state, navigate, t]);

  const handleViewAppointments = () => {
    navigate('/appointments');
  };

  if (!appointmentData) {
    return <div>{t('common.states.loading')}</div>;
  }

  return (
    <div className="success-booking-wrapper">
      <div className="success-booking-container">
        <div className="success-header">
          <CheckCircleOutlined className="success-icon" />
          <h1 className="success-title">{t('pages.successBooking.title')}</h1>
          <p className="success-subtitle">
            {t('pages.successBooking.subtitle')}
          </p>
        </div>

        <Card className="appointment-summary-card">
          <div className="summary-header">
            <CalendarOutlined className="summary-icon" />
            <h2>{t('pages.successBooking.summaryTitle')}</h2>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div className="summary-content">
            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">{t('pages.successBooking.petName')}</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.petName}</span>
              </Col>
            </Row>

            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">{t('pages.successBooking.doctor')}</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.doctorName}</span>
              </Col>
            </Row>

            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">{t('pages.successBooking.time')}</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.time}</span>
              </Col>
            </Row>

            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">{t('pages.successBooking.service')}</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{t(`enums.service.${appointmentData.service}`, { defaultValue: getServiceLabel(appointmentData.service, appointmentData.service) })}</span>
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: '24px 0' }} />
        </Card>

        <div className="action-buttons">
          <Button
            style={{ backgroundColor: 'var(--page-success-primary)' }}
            type="primary"
            size="large"
            block
            onClick={handleViewAppointments}
            className="primary-btn"
            icon={<CalendarOutlined />}
          >
            {t('pages.successBooking.goToAppointments')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessBooking;
