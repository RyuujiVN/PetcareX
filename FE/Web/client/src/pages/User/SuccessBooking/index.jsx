import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Divider, Space, message, QRCode } from 'antd';
import { CheckCircleOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles.css';

const SuccessBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointmentData, setAppointmentData] = useState(null);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    const state = location.state?.appointmentData;

    if (!state) {
      message.warning('Không tìm thấy dữ liệu lịch hẹn vừa đặt');
      navigate('/appointments');
      return;
    }

    setAppointmentData(state);
    setQrValue(`https://petcarex.app/check-in/${state.appointmentId}`);
  }, [location.state, navigate]);

  const handleViewAppointments = () => {
    navigate('/appointments');
  };

  if (!appointmentData) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="success-booking-wrapper">
      <div className="success-booking-container">
        <div className="success-header">
          <CheckCircleOutlined className="success-icon" />
          <h1 className="success-title">Đặt lịch thành công!</h1>
          <p className="success-subtitle">
            Lịch hẹn của bạn đã được ghi nhận. Vui lòng kiểm tra thông tin bên dưới.
          </p>
        </div>

        <Card className="appointment-summary-card">
          <div className="summary-header">
            <CalendarOutlined className="summary-icon" />
            <h2>Tóm tắt lịch hẹn</h2>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div className="summary-content">
            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">Tên thú cưng</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.petName}</span>
              </Col>
            </Row>

            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">Bác sĩ chuyên khoa</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.doctorName}</span>
              </Col>
            </Row>

            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">Thời gian hẹn</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.time}</span>
              </Col>
            </Row>

            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">Dịch vụ</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.service}</span>
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
            Đến Lịch hẹn của tôi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessBooking;

