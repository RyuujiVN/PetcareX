import { CameraOutlined, HomeOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Space, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/client/AuthContext';
import { getClientInstance } from '../../../../services/apiClient';
import {
    getUserProfileApi,
    updateUserProfileApi,
    uploadAvatarApi,
} from '../../../../services/userService';
import './styles.css';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizePhone = (value) => String(value || '').trim();

export default function ProfileUser() {
  const [form] = Form.useForm();
  const { t } = useTranslation();
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
      const res = await getUserProfileApi(getClientInstance());
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
      console.error('Failed to load profile data:', error);
      message.error(t('pages.profile.loadFailed'));
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
      const res = await uploadAvatarApi(file);
      setAvatarUrl(res.data.file);
      message.success(t('pages.profile.uploadSuccess'));
    } catch (error) {
      message.error(error?.message || t('pages.profile.uploadFailed'));
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
        message.info(t('pages.profile.noChanges'));
        return;
      }

      await updateUserProfileApi(getClientInstance(), profileData.id, updateData);
      setProfileData((prev) => ({ ...prev, ...updateData }));
      await refreshUserProfile();
      message.success(t('pages.profile.updateSuccess'));
      navigate(-1);
    } catch (error) {
      const errorMsg = error.message || error.response?.data?.message || t('pages.profile.updateFailed');
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchProfileData();
    message.info(t('pages.profile.cancelInfo'));
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
                {profileData?.fullName || t('header.user.defaultName')}
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
                label={t('pages.profile.fields.name')}
                name="name"
                className="form-col"
                rules={[
                  { required: true, message: t('pages.profile.validation.nameRequired') },
                  { min: 2, message: t('pages.profile.validation.nameMin') }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder={t('pages.profile.placeholders.name')}
                  size="large"
                  className="form-input"
                />
              </Form.Item>
              <Form.Item
                label={t('pages.profile.fields.phone')}
                name="phone"
                className="form-col"
                rules={[
                  { required: true, message: t('pages.profile.validation.phoneRequired') },
                  { 
                    pattern: /^(\d{10}|\d{11})$/, 
                    message: t('pages.profile.validation.phoneInvalid') 
                  }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder={t('pages.profile.placeholders.phone')}
                  size="large"
                  className="form-input"
                />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                label={t('pages.profile.fields.email')}
                name="email"
                className="form-col"
                rules={[
                  { required: true, message: t('pages.profile.validation.emailRequired') },
                  { type: 'email', message: t('pages.profile.validation.emailInvalid') }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder={t('pages.profile.placeholders.email')}
                  size="large"
                  className="form-input"
                />
              </Form.Item>
                 <Form.Item
              label={t('pages.profile.fields.address')}
              name="address"
              rules={[
                { required: true, message: t('pages.profile.validation.addressRequired') },
                { min: 5, message: t('pages.profile.validation.addressMin') }
              ]}
            >
              <Input
                prefix={<HomeOutlined />}
                placeholder={t('pages.profile.placeholders.address')}
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
                  {t('pages.profile.actions.cancel')}
                </Button>
                <Button
                  type="primary"
                  size="large"
                  className="btn-submit"
                  htmlType="submit"
                  loading={loading}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? t('pages.profile.actions.uploading') : t('pages.profile.actions.save')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
