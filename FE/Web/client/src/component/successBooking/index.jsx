import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Divider, Space, message, QRCode } from 'antd';
import { CheckCircleOutlined, CalendarOutlined, UserOutlined, ClockCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../default/header';
import Footer from '../../default/footer';
import './styles.css';

const SuccessBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointmentData, setAppointmentData] = useState(null);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    // Get appointment data from location state or use mock data
    const state = location.state?.appointmentData || {
      petName: 'LuLu',
      doctorName: 'Dr. Nam',
      time: '09:00 AM 20/05/2024',
      service: 'Khám sức khỏe định kỳ',
      clinic: 'PetCare Clinic - Chi nhánh 1',
      appointmentId: 'APT-' + Date.now(),
    };
    
    setAppointmentData(state);
    // Generate QR code value (in real app, this would be unique to appointment)
    setQrValue(`https://petcarex.app/check-in/${state.appointmentId}`);
  }, [location.state]);

  const handleViewAppointments = () => {
    navigate('/appointments');
  };

  const handleDownloadQR = () => {
    // This would trigger QR code download in real implementation
    message.success('QR code đã được tải xuống');
  };

  if (!appointmentData) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="success-booking-wrapper">
      <Header />

      <div className="success-booking-container">
        {/* Success Icon Section */}
        <div className="success-header">
          <CheckCircleOutlined className="success-icon" />
          <h1 className="success-title">Đặt lịch thành công!</h1>
          <p className="success-subtitle">
            Lịch hẹn của bạn đã được ghi nhận. Vui lòng kiểm tra thông tin bên dưới.
          </p>
        </div>

        {/* Appointment Summary Card */}
        <Card className="appointment-summary-card">
          <div className="summary-header">
            <CalendarOutlined className="summary-icon" />
            <h2>Tóm tắt lịch hẹn</h2>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div className="summary-content">
            {/* Pet Name */}
            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">Tên thú cưng</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.petName}</span>
              </Col>
            </Row>

            {/* Doctor Name */}
            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">Bác sĩ chuyên khoa</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.doctorName}</span>
              </Col>
            </Row>

            {/* Time */}
            <Row gutter={[24, 24]} className="summary-row">
              <Col xs={24} sm={12} className="summary-label">
                <span className="label-text">Thời gian hẹn</span>
              </Col>
              <Col xs={24} sm={12} className="summary-value">
                <span className="value-text">{appointmentData.time}</span>
              </Col>
            </Row>

            {/* Service */}
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

          {/* QR Code Section */}
          <div className="qr-section">
            <h3 className="qr-title">MÃ QR CHECK-IN</h3>
            <p className="qr-instruction">
              Vui lòng xuất trình mã QR này tại lễ tân bên dưới để làm thủ tục check-in nhân chứng
            </p>

            <div className="qr-code-container">
              <QRCode
                value={qrValue}
                size={200}
                level="H"
                includeMargin={true}
                errorLevel="H"
              />
            </div>

            <button 
              className="qr-download-btn" 
              onClick={handleDownloadQR}
            >
              📥 Tải QR Code
            </button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Button
            type="primary"
            size="large"
            block
            onClick={handleViewAppointments}
            className="primary-btn"
            icon={<CalendarOutlined />}
          >
            Đến Lịch hẹn của tôi
          </Button>

          <Button
            type="default"
            size="large"
            block
            onClick={() => navigate('/')}
            style={{ marginTop: '12px' }}
          >
            Quay về Trang chủ
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="info-card">
          <h3>ℹ️ Thông tin quan trọng</h3>
          <ul className="info-list">
            <li>Vui lòng đến 15 phút trước giờ hẹn</li>
            <li>Mang theo chứng minh thư hoặc ID của chủ pet</li>
            <li>Chuẩn bị các hồ sơ y tế của thú cưng nếu có</li>
            <li>Liên hệ phòng khám nếu cần hủy hoặc rescheduler lịch hẹn</li>
          </ul>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default SuccessBooking;
