import { CameraOutlined, HomeOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Form, Input, message, Space, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfileApi, updateUserProfileApi, uploadAvatarApi } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import Header from '../../default/header';
import './styles.css';

export default function ProfileUser() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await getUserProfileApi();
      const data = res.data;
      setProfileData(data);
      setAvatarUrl(data.avatarUrl || null);
      form.setFieldsValue({
        name: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
    } catch (error) {
      console.error('Lỗi tải dữ liệu hồ sơ:', error);
      message.error('Không thể tải thông tin hồ sơ!');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAvatarApi(formData);
      setAvatarUrl(res.data.file);
      message.success('Tải ảnh lên thành công!');
    } catch (error) {
      message.error('Tải ảnh thất bại!');
      setAvatarUrl(profileData?.avatarUrl || null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (values) => {
    if (uploadingAvatar) return;
    try {
      setLoading(true);
      const updateData = {
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        avatarUrl: avatarUrl,
      };
      await updateUserProfileApi(profileData.id, updateData);
      setProfileData((prev) => ({ ...prev, ...updateData }));
      await refreshUserProfile();
      message.success('Cập nhật hồ sơ thành công!');
      navigate (-1);
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
    navigate(-1);
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
              <Spin spinning={uploadingAvatar} style={{ display: 'inline-block' }}>
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  src={avatarUrl}
                  className="profile-avatar"
                />
              </Spin>
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
            </div>

            <div className="form-row">
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
            </div>
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
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Đang tải ảnh...' : 'Lưu thay đổi'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
