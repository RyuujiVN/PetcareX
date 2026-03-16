import React, { useState } from 'react';
import * as antd from 'antd';
import * as icons from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from '../../default/header';
import Footer from '../../default/footer';
import './styles.css';
const AppointmentDetail = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const upcomingAppointments = [
    {
      id: 1,
      petName: 'LuLu',
      breed: 'Chó Poodle',
      avatar: '/public/gaugau.png',
      clinic: 'PetCare Clinic - Chi nhánh 1',
      clinicAddress: '123 Đường Nguyễn Huệ, Quận 1',
      service: 'Dịch vụ: Tiêm phòng',
      date: '28/10/2023',
      time: '09:00',
      veterinarian: 'Bác sĩ Nguyễn Văn A',
      notes: 'Vui lòng đưa thú cưng đến 15 phút trước giờ hẹn',
    },
    {
      id: 2,
      petName: 'Mimi',
      breed: 'Mèo Anh Lông Ngắn',
      avatar: '/public/meomeo.png',
      clinic: 'PetCare Clinic - Chi nhánh 3',
      clinicAddress: '456 Lê Lợi, Quận 5 Việt',
      service: 'Dịch vụ: Khám tổng quát',
      date: '30/10/2023',
      time: '14:30',
      veterinarian: 'Bác sĩ Trần Thị B',
    },
  ];

  const medicalHistory = [
    {
      id: 1,
      petName: 'LuLu',
      breed: 'Chó Poodle',
      avatar: '/public/gaugau.png',
      clinic: 'PetCare Clinic - Chi nhánh 1',
      clinicAddress: '123 Đường Nguyễn Huệ, Quán 1',
      service: 'Dịch vụ: Tiêm phòng',
      date: '25/10/2023',
      time: '14:30',
      daysAgo: '3 ngày',
      veterinarian: 'Bác sĩ Nguyễn Văn A',
      diagnosis: 'Khỏe mạnh',
      prescription: 'Tiêm phòng cúm',
    },
    {
      id: 2,
      petName: 'Mimi',
      breed: 'Mèo Anh Lông Ngắn',
      avatar: '/public/meomeo.png',
      clinic: 'PetCare Clinic - Chi nhánh 3',
      clinicAddress: '456 Lê Lợi, Quận 5 Việt',
      service: 'Dịch vụ: Khám tổng quát',
      date: '22/10/2023',
      time: '09:00',
      daysAgo: '2 ngày',
      veterinarian: 'Bác sĩ Trần Thị B',
      diagnosis: 'Cần kiểm tra văng tai',
      prescription: 'Thuốc trị viêm tai',
    },
    {
      id: 3,
      petName: 'Bông',
      breed: 'Mèo Ba Tư',
      avatar: '/public/lulu.png',
      clinic: 'PetCare Clinic - Chi nhánh 2',
      clinicAddress: '789 Cách Mạng Tháng 8, Quận 3',
      service: 'Dịch vụ: Khám nha khoa',
      date: '20/10/2023',
      time: '10:30',
      daysAgo: '1 tuần',
      veterinarian: 'Bác sĩ Lê Văn C',
      diagnosis: 'Sạch răng - Không có sâu',
      prescription: 'Vệ sinh lại định kỳ',
    },
  ];

  const handleCancelAppointment = (appointmentId) => {
    antd.Modal.confirm({
      title: 'Hủy lịch khám',
      content: 'Bạn chắc chắn muốn hủy lịch khám này không?',
      okText: 'Có, hủy',
      cancelText: 'Không, quay lại',
      okButtonProps: { danger: true },
      onOk() {
      antd.message.success('Hủy lịch khám thành công');
      setActiveTab('upcoming');
      },
    });
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalVisible(true);
  };

  const handleBookingNew = () => {
    navigate('/booking');
  };

  const AppointmentCard = ({ appointment, isHistory = false }) => (
    <antd.Card className="appointment-card" hoverable style={{ marginBottom: '16px' }}>
      <antd.Row gutter={[16, 16]}>
        <antd.Col xs={24} sm={6}>
          <div className="appointment-pet-image">
            <img src={appointment.avatar} alt={appointment.petName} />
            {!isHistory && <antd.Badge count={appointment.status} style={{ backgroundColor: '#1890ff' }} />}
          </div>
        </antd.Col>
        <antd.Col xs={24} sm={12}>
          <div className="appointment-content">
            <div className="appointment-header">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                {appointment.petName} - {appointment.breed}
              </h3>
              {isHistory && <antd.Tag color="blue">{appointment.daysAgo}</antd.Tag>}
            </div>

            <div className="appointment-info">
              <p style={{ marginBottom: '8px' }}>
                <icons.MedicineBoxOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                {appointment.service}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <icons.EnvironmentOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                {appointment.clinic}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>{appointment.clinicAddress}</span>
              </p>
              <p style={{ marginBottom: '0' }}>
                <icons.CalendarOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                {appointment.date} <icons.ClockCircleOutlined style={{ marginLeft: '16px', marginRight: '8px' }} />
                {appointment.time}
              </p>
            </div>
          </div>
        </antd.Col>
        <antd.Col xs={24} sm={6}>
          <antd.Space direction="vertical" style={{ width: '100%'}}>
            <antd.Button
              style={{backgroundColor: '#13ECDA'}}
              type="primary"
              block
              icon={<icons.EyeOutlined />}
              onClick={() => handleViewDetails(appointment)}
            >
              Xem chi tiết
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
      <Header />
      <div className="appointment-detail-container">
        <div className="appointment-header-section">
          <h1>Lịch sử khám</h1>
          <p>Quản lý các cuộc khám sức khỏe cho các bạn cưng của bạn để đảng</p>
          <antd.Button
            type="primary"
            size="large"
            onClick={handleBookingNew}
            style={{ marginTop: '16px', backgroundColor: '#13ECDA', borderColor: '#13ECDA' }}
          >
            + Đặt lịch khám mới
          </antd.Button>
        </div>

        <antd.Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="appointment-tabs"
          items={[
            {
              key: 'upcoming',
              label: (
                <span>
                  <icons.CalendarOutlined/>
                  Lịch sắp tới ({upcomingAppointments.length})
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
                      style={{ marginTop: '48px'}}
                    />
                  )}
                </antd.Spin>
              ),
            },
            {
              key: 'history',
              label: (
                <span>
                  <icons.MedicineBoxOutlined />
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
                          isHistory={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <antd.Empty  description="Chưa có lịch khám" style={{ marginTop: '48px' }} />
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
          footer={[
            <antd.Button key="back" onClick={() => setIsModalVisible(false)}>
              Đóng
            </antd.Button>,
            <antd.Button
            style = {{ backgroundColor: '#13ECDA', borderColor: '#13ECDA' }}
              key="submit"
              type="primary"
              onClick={() => {
                setIsModalVisible(false);
                navigate('/profile');
              }}
            >
              Xem hồ sơ thú cưng
            </antd.Button>,
          ]}
          width={700}
        >
          {selectedAppointment && (
            <div className="modal-contents">
              <antd.Row gutter={[16, 16]}>
                <antd.Col span={8}>
                  <img
                    src={selectedAppointment.avatar}
                    alt={selectedAppointment.petName}
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                </antd.Col>
                <antd.Col span={16}>
                  <h3>Thông tin thú cưng</h3>
                  <p>
                    <strong>Tên:</strong> {selectedAppointment.petName}
                  </p>
                  <p>
                    <strong>Giống loại:</strong> {selectedAppointment.breed}
                  </p>
                  <antd.Divider />
                  <h3>Thông tin lịch khám</h3>
                  <p>
                    <icons.CalendarOutlined /> <strong>Ngày:</strong> {selectedAppointment.date}
                  </p>
                  <p>
                    <icons.ClockCircleOutlined /> <strong>Giờ:</strong> {selectedAppointment.time}
                  </p>
                  <p>
                    <icons.EnvironmentOutlined /> <strong>Phòng khám:</strong>{' '}
                    {selectedAppointment.clinic}
                  </p>
                  <p>
                    <icons.UserOutlined /> <strong>Bác sĩ:</strong>{' '}
                    {selectedAppointment.veterinarian}
                  </p>
                  <p>
                    <icons.MedicineBoxOutlined /> <strong>Dịch vụ:</strong>{' '}
                    {selectedAppointment.service}
                  </p>
                </antd.Col>
              </antd.Row>

              {selectedAppointment.diagnosis && (
                <>
                  <antd.Divider />
                  <h3>Kết quả khám</h3>
                  <p>
                    <strong>Chẩn đoán:</strong> {selectedAppointment.diagnosis}
                  </p>
                  <p>
                    <strong>Đơn thuốc:</strong> {selectedAppointment.prescription}
                  </p>
                </>
              )}

              {selectedAppointment.notes && (
                <>
                  <antd.Divider />
                  <p>
                    <strong>Ghi chú:</strong> {selectedAppointment.notes}
                  </p>
                </>
              )}
            </div>
          )}
        </antd.Modal>
      </div>
      <Footer />
    </div>
  );
};

export default AppointmentDetail;
