import { CameraOutlined, HomeOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Space, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserListApi,
  getUserProfileApi,
  updateUserProfileApi,
  uploadAvatarApi,
} from '../../../../data/client/api/user';
import { useAuth } from '../../../../hooks/client/AuthContext';
import './styles.css';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizePhone = (value) => String(value || '').trim();

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
        fullName: String(values.name || '').trim(),
        email: normalizeEmail(values.email),
        phone: normalizePhone(values.phone),
        address: String(values.address || '').trim(),
        avatarUrl: avatarUrl,
      };

      const currentData = {
        fullName: String(profileData?.fullName || '').trim(),
        email: normalizeEmail(profileData?.email),
        phone: normalizePhone(profileData?.phone),
        address: String(profileData?.address || '').trim(),
        avatarUrl: profileData?.avatarUrl || null,
      };

      const hasChanges =
        updateData.fullName !== currentData.fullName ||
        updateData.email !== currentData.email ||
        updateData.phone !== currentData.phone ||
        updateData.address !== currentData.address ||
        updateData.avatarUrl !== currentData.avatarUrl;

      if (!hasChanges) {
        message.info('Không có thay đổi để lưu');
        return;
      }

      const userListRes = await getUserListApi(1, 1000, '');
      const userItems = Array.isArray(userListRes?.data?.items) ? userListRes.data.items : [];
      const duplicatedEmail = userItems.some(
        (user) => user?.id !== profileData?.id && normalizeEmail(user?.email) === updateData.email,
      );
      const duplicatedPhone = userItems.some(
        (user) => user?.id !== profileData?.id && normalizePhone(user?.phone) === updateData.phone,
      );

      if (duplicatedEmail) {
        message.error('Email đã được sử dụng bởi tài khoản khác');
        return;
      }

      if (duplicatedPhone) {
        message.error('Số điện thoại đã được sử dụng bởi tài khoản khác');
        return;
      }

      await updateUserProfileApi(profileData.id, updateData);
      setProfileData((prev) => ({ ...prev, ...updateData }));
      await refreshUserProfile();
      message.success('Cập nhật hồ sơ thành công!');
      navigate(-1);
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
    <div className="profile-containers">
      <div className="profile-wrapper">
        <div className="profile-headers">
          <div className="profile-avatar-section">
            <Spin spinning={uploadingAvatar}>
              <div
                className={`profile-cover ${avatarUrl ? 'has-cover-image' : 'no-cover-image'}`}
                style={
                  avatarUrl
                    ? {
                        backgroundImage: `linear-gradient(120deg, rgba(13, 26, 53, 0.3) 100%, rgba(253, 253, 253, 0.26) 100%, rgba(116, 160, 220, 0.22) 100%), url(${avatarUrl})`,
                      }
                    : undefined
                }
              >
                {!avatarUrl && (
                  <div className="profile-cover-placeholder">
                    <UserOutlined />
                  </div>
                )}

                <label
                  htmlFor="avatar-upload"
                  className="cover-upload-btn"
                  style={{
                    opacity: uploadingAvatar || loading ? 0.5 : 1,
                    pointerEvents: uploadingAvatar || loading ? 'none' : 'auto',
                  }}
                >
                  <CameraOutlined />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploadingAvatar || loading}
                  style={{ display: 'none' }}
                />
              </div>
            </Spin>

            <div className="profile-info-header">
              <h2 className="profile-name">
                {profileData?.fullName || 'Người dùng'}
              </h2>
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
                  placeholder="Nhập email của bạn"
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
                placeholder="Nhập địa chỉ của bạn"
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
                  disabled={uploadingAvatar || loading}
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
