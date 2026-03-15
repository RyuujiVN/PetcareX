import React, { useState } from 'react';
import * as antd from 'antd';
import * as icons from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from '../../default/header';
import Footer from '../../default/footer';

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
    <antd.Card
      hoverable
      className="appointment-card-slide !rounded-xl !border-[#f0f0f0] transition-all duration-300 ease-in-out hover:!shadow-[0_4px_16px_rgba(19,236,218,0.18)] hover:!border-[#13ECDA]"
      styles={{ body: { padding: '20px' } }}
      style={{ marginBottom: '16px' }}
    >
      <antd.Row gutter={[16, 16]} align="middle">

        <antd.Col xs={24} sm={5} className="relative max-[768px]:mb-2">
          <div className="flex justify-center items-center w-full">
            <div className="relative">
              <img
                src={appointment.avatar}
                alt={appointment.petName}
                className="w-[100px] h-[100px] rounded-xl object-cover shadow-[0_2px_8px_rgba(0,0,0,0.10)] max-[768px]:w-[80px] max-[768px]:h-[80px]"
              />
              {!isHistory && appointment.status && (
                <antd.Badge
                  count={appointment.status}
                  style={{ backgroundColor: '#1890ff' }}
                  className="!absolute !-top-2 !-right-2 !text-[11px] !px-2 !py-0.5 !rounded-xl"
                />
              )}
            </div>
          </div>
        </antd.Col>

        <antd.Col xs={24} sm={13} className="px-2 max-[992px]:px-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>
                {appointment.petName}
              </span>
              <span className="text-[13px] text-[#8c8c8c]">• {appointment.breed}</span>
              {isHistory && (
                <antd.Tag
                  style={{
                    borderColor: '#13ECDA',
                    color: '#0ab5a6',
                    backgroundColor: '#f0fffe',
                    margin: 0,
                    fontSize: '12px',
                  }}
                >
                  {appointment.daysAgo} trước
                </antd.Tag>
              )}
            </div>

            {/* Dịch vụ — .appointment-info-item */}
            <div className="flex items-start gap-2">
              {/* .info-icon */}
              <icons.MedicineBoxOutlined style={{ color: '#13ECDA', fontSize: '14px', marginTop: 2, flexShrink: 0 }} />
              {/* .label */}
              <span style={{ fontSize: '14px', color: '#262626', fontWeight: 500 }}>
                {appointment.service}
              </span>
            </div>

            {/* Phòng khám + địa chỉ — .appointment-info-item */}
            <div className="flex items-start gap-2">
              <icons.EnvironmentOutlined style={{ color: '#13ECDA', fontSize: '14px', marginTop: 2, flexShrink: 0 }} />
              <div>
                {/* .label */}
                <span style={{ fontSize: '14px', color: '#262626', fontWeight: 500 }}>
                  {appointment.clinic}
                </span>
                {/* .address */}
                <p style={{ fontSize: '12px', color: '#8c8c8c', margin: '4px 0 0 0' }}>
                  {appointment.clinicAddress}
                </p>
              </div>
            </div>

            {/* Ngày giờ — .info-row */}
            <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '13px', color: '#666' }}>
              <icons.CalendarOutlined style={{ color: '#faad14' }} />
              {/* .value */}
              <span style={{ color: '#262626', fontWeight: 500 }}>{appointment.date}</span>
              <icons.ClockCircleOutlined style={{ marginLeft: '8px' }} />
              <span style={{ color: '#262626', fontWeight: 500 }}>{appointment.time}</span>
            </div>
          </div>
        </antd.Col>

        {/* Nút hành động — .action-col */}
        <antd.Col
          xs={24}
          sm={6}
          className="action-col flex items-center gap-2 max-[768px]:flex-wrap max-[576px]:gap-1"
        >
          <antd.Space direction="vertical" style={{ width: '100%' }}>
            <antd.Button
              type="primary"
              block
              icon={<icons.EyeOutlined />}
              onClick={() => handleViewDetails(appointment)}
              style={{ backgroundColor: '#13ECDA', borderColor: '#13ECDA' }}
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
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <Header />

      <div className="flex-1 max-w-[1200px] mx-auto w-full my-8 px-4 max-[768px]:my-4 max-[768px]:px-3 max-[576px]:px-2">

        <div
          className="rounded-xl mb-8 max-[768px]:mb-4 max-[576px]:p-4"
          style={{
            background: '#ffffff',
            padding: '32px',
            paddingTop: '90px',
            borderRadius: '12px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >

          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#262626',
              margin: '0 0 8px 0',
              lineHeight: 1.3,
            }}
            className="max-[768px]:!text-[22px] max-[576px]:!text-[18px]"
          >
            Lịch sử khám
          </div>
          <p style={{ fontSize: '14px', color: '#8c8c8c', margin: '0 0 16px 0' }}>
            Quản lý các cuộc khám sức khỏe cho các bạn cưng của bạn
          </p>

          <antd.Button
            type="primary"
            size="large"
            icon={<icons.PlusOutlined />}
            onClick={handleBookingNew}
            style={{ marginTop: '16px', backgroundColor: '#13ECDA', borderColor: '#13ECDA' }}
          >
            Đặt lịch khám mới
          </antd.Button>
        </div>

        <div
          className="rounded-lg max-[768px]:p-4 max-[576px]:p-3"
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: '20px',
          }}
        >
          <antd.Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="appointment-tabs"
            items={[
              {
                key: 'upcoming',
                label: (
                  <span>
                    <icons.CalendarOutlined />
                    {' '}Lịch sắp tới ({upcomingAppointments.length})
                  </span>
                ),
                children: (
                  <antd.Spin spinning={loading}>
                    {upcomingAppointments.length > 0 ? (
                      /* .appointment-list */
                      <div className="flex flex-col gap-4">
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
                  <span>
                    <icons.MedicineBoxOutlined />
                    {' '}Lịch sử khám ({medicalHistory.length})
                  </span>
                ),
                children: (
                  <antd.Spin spinning={loading}>
                    {medicalHistory.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {medicalHistory.map((appointment) => (
                          <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            isHistory={true}
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
        </div>
      </div>

      <antd.Modal
        title="Chi tiết lịch khám"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <antd.Button key="back" onClick={() => setIsModalVisible(false)}>
            Đóng
          </antd.Button>,
          <antd.Button
            key="submit"
            type="primary"
            style={{ backgroundColor: '#13ECDA', borderColor: '#13ECDA' }}
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
          <div style={{ padding: '16px 0' }}>
            <antd.Row gutter={[16, 16]}>
              <antd.Col span={8}>
                <img
                  src={selectedAppointment.avatar}
                  alt={selectedAppointment.petName}
                  className="w-full rounded-xl object-cover"
                />
              </antd.Col>
              <antd.Col span={16}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#262626' }}>
                  Thông tin thú cưng
                </h3>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#262626' }}>Tên:</strong> {selectedAppointment.petName}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#262626' }}>Giống loại:</strong> {selectedAppointment.breed}
                </p>

                <antd.Divider />

                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#262626' }}>
                  Thông tin lịch khám
                </h3>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <icons.CalendarOutlined style={{ marginRight: 6 }} />
                  <strong style={{ color: '#262626' }}>Ngày:</strong> {selectedAppointment.date}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <icons.ClockCircleOutlined style={{ marginRight: 6 }} />
                  <strong style={{ color: '#262626' }}>Giờ:</strong> {selectedAppointment.time}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <icons.EnvironmentOutlined style={{ marginRight: 6 }} />
                  <strong style={{ color: '#262626' }}>Phòng khám:</strong>{' '}
                  {selectedAppointment.clinic}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <icons.UserOutlined style={{ marginRight: 6 }} />
                  <strong style={{ color: '#262626' }}>Bác sĩ:</strong>{' '}
                  {selectedAppointment.veterinarian}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <icons.MedicineBoxOutlined style={{ marginRight: 6 }} />
                  <strong style={{ color: '#262626' }}>Dịch vụ:</strong>{' '}
                  {selectedAppointment.service}
                </p>
              </antd.Col>
            </antd.Row>

            {selectedAppointment.diagnosis && (
              <>
                <antd.Divider />
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#262626' }}>
                  Kết quả khám
                </h3>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#262626' }}>Chẩn đoán:</strong> {selectedAppointment.diagnosis}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#262626' }}>Đơn thuốc:</strong> {selectedAppointment.prescription}
                </p>
              </>
            )}

            {selectedAppointment.notes && (
              <>
                <antd.Divider />
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#262626' }}>Ghi chú:</strong> {selectedAppointment.notes}
                </p>
              </>
            )}
          </div>
        )}
      </antd.Modal>

      <Footer />
    </div>
  );
};

export default AppointmentDetail;
