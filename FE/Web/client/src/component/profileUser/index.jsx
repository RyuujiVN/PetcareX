import { CameraOutlined, HomeOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Select, message, Card, Avatar, Space, Spin } from 'antd';
import { useState, useEffect } from 'react';
import './styles.css';
import Header from '../../default/header';

export default function ProfileUser() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        setProfileData(userInfo);
        form.setFieldsValue({
          name: userInfo.fullName || '',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          age: userInfo.age || '',
          gender: userInfo.gender || 'Nam',
          address: userInfo.address || '',
        });
        setImagePreview(userInfo.avatar || null);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu hồ sơ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const updateData = {
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        age: values.age,
        gender: values.gender,
        address: values.address,
        ...(imagePreview && !imagePreview.startsWith('http') && { avatar: imagePreview }),
      };
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...updateData }));
      
      message.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Cập nhật hồ sơ thất bại!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchProfileData();
    message.info('Đã hủy thay đổi');
  };

  if (loading && !profileData) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="profile-container">
        <Header/>
      <div className="profile-wrapper">
        <div className="profile-header">
                        <h2 className="profile-title">Thông tin cá nhân</h2>

          <div className="profile-avatar-section">
              <p className="profile-description">
            Cập nhật thông tin cá nhân của bạn để nhận dịch vụ tốt nhất
          </p>
            <div className="profile-avatar-container">
              <Avatar
                size={120}
                icon={<UserOutlined />}
                src={imagePreview}
                className="profile-avatar"
              />
              <label htmlFor="avatar-upload" className="avatar-upload-btn">
                <CameraOutlined />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>

            <div className="profile-info-header">
              <h2 className="profile-name">
                {profileData?.fullName || 'Người dùng'}
              </h2>
              <p className="profile-subtitle">Chủ nuôi thú cưng</p>
            </div>
          </div>
        </div>

        <Card className="profile-form-card">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            requiredMark={false}
          >
            <div className="form-row">
              <Form.Item
                label="Tên"
                name="name"
                className="form-col"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên của bạn!' },
                  { min: 2, message: 'Tên phải có ít nhất 2 ký tự!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập tên của bạn"
                  size="large"
                  className="form-input"
                />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                className="form-col"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không đúng định dạng!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="nguyen@email.com"
                  size="large"
                  className="form-input"
                />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                label="Số điện thoại"
                name="phone"
                className="form-col"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { 
                    pattern: /^(\d{10}|\d{11})$/, 
                    message: 'Số điện thoại không đúng định dạng!' 
                  }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="090 123 4567"
                  size="large"
                  className="form-input"
                />
              </Form.Item>

              <Form.Item
                label="Tuổi"
                name="age"
                className="form-col"
                rules={[
                  { required: true, message: 'Vui lòng nhập tuổi!' },
                  { 
                    type: 'number', 
                    min: 1, 
                    max: 120, 
                    message: 'Tuổi phải từ 1 đến 120!' 
                  }
                ]}
              >
                <InputNumber
                  placeholder="22"
                  size="large"
                  className="form-input"
                  min={1}
                  max={120}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                label="Giới tính"
                name="gender"
                className="form-col"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
              >
                <Select
                  placeholder="Chọn giới tính"
                  size="large"
                  className="form-input"
                  options={[
                    { label: 'Nam', value: 'Nam' },
                    { label: 'Nữ', value: 'Nữ' },
                    { label: 'Khác', value: 'Khac' }
                  ]}
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[
                { required: true, message: 'Vui lòng nhập địa chỉ!' },
                { min: 5, message: 'Địa chỉ phải có ít nhất 5 ký tự!' }
              ]}
            >
              <Input
                prefix={<HomeOutlined />}
                placeholder="145/7 Trần Cao Vân, TP. Đà Nẵng"
                size="large"
                className="form-input"
              />
            </Form.Item>

            <Form.Item className="form-buttons">
              <Space style={{ width: '100%', gap: '12px' }}>
                <Button
                  size="large"
                  className="btn-cancel"
                  onClick={handleCancel}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  className="btn-submit"
                  htmlType="submit"
                  loading={loading}
                >
                  Lưu thay đổi
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
