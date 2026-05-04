import { Button, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLockReset } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { getClientInstance } from '../../../../services/apiClient';
import { forgotPasswordApi, resetPasswordApi } from '../../../../services/authService';
import './styles.css';

const OTP_EXPIRY_SECONDS = 300; // 5 phút theo backend
const RESEND_COOLDOWN_SECONDS = 60;

export default function ReEnterPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [otpExpiryLeft, setOtpExpiryLeft] = useState(OTP_EXPIRY_SECONDS);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      message.warning(t('pages.auth.resetPassword.enterEmailFirst'));
      navigate('/forgot-password');
    }
  }, [email, navigate, t]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  useEffect(() => {
    if (otpExpiryLeft === 0) {
      message.warning({
        content: t('pages.auth.resetPassword.otpExpired'),
        key: 'otp-expired',
      });
      return;
    }
    const id = setTimeout(() => setOtpExpiryLeft(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [otpExpiryLeft, t]);

  const handleGoBack = () => navigate('/login');

  const handleResendOtp = async () => {
    if (!email) {
      message.error(t('pages.auth.resetPassword.invalidEmail'));
      return;
    }
    setResendLoading(true);
    try {
      await forgotPasswordApi(getClientInstance(), email);
      message.success(t('pages.auth.resetPassword.otpResent'));
      form.setFieldValue('otp', '');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpExpiryLeft(OTP_EXPIRY_SECONDS);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || t('pages.auth.resetPassword.resendFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (otpExpiryLeft === 0) {
      message.warning(t('pages.auth.resetPassword.otpExpired'));
      return;
    }
    setLoading(true);
    try {
      const response = await resetPasswordApi(getClientInstance(), {
        email,
        otp: values.otp,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      message.success(response.data?.message || t('pages.auth.resetPassword.success'));
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || t('pages.auth.resetPassword.failed'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="lock-icon-section">
          <MdLockReset size={70} color="var(--auth-primary)" />
        </div>

        <div className="reset-password-header">
          <h1 className="reset-password-title">{t('pages.auth.resetPassword.heading')}</h1>
          <p className="reset-password-subtitle">
            {t('pages.auth.resetPassword.otpSentTo')} <strong>{email}</strong>
          </p>
        </div>

        <div className="reset-form-wrapper">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label={t('pages.auth.resetPassword.otpLabel')}
              name="otp"
              rules={[
                { required: true, message: t('pages.auth.resetPassword.validation.otpRequired') },
                { pattern: /^\d{6}$/, message: t('pages.auth.resetPassword.validation.otpInvalid') },
              ]}
            >
              <Input placeholder={t('pages.auth.resetPassword.otpPlaceholder')} maxLength={6} />
            </Form.Item>

            <div className="resend-otp-row">
              <span className="otp-expiry-hint">
                {otpExpiryLeft > 0 ? (
                  <>{t('pages.auth.resetPassword.otpExpiresIn')} <strong>{formatTime(otpExpiryLeft)}</strong></>
                ) : (
                  <span className="otp-expired-text">{t('pages.auth.resetPassword.otpExpiredShort')}</span>
                )}
              </span>
              <Button
                type="link"
                onClick={handleResendOtp}
                loading={resendLoading}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  color: resendCooldown > 0 ? '#999' : 'var(--auth-primary)',
                  padding: '0 4px',
                  height: 'auto',
                  fontSize: '14px',
                }}
              >
                {resendCooldown > 0
                  ? t('pages.auth.resetPassword.resendOtpCooldown', { seconds: resendCooldown })
                  : t('pages.auth.resetPassword.resendOtp')}
              </Button>
            </div>

            <Form.Item
              label={t('pages.auth.resetPassword.newPasswordLabel')}
              name="newPassword"
              rules={[
                { required: true, message: t('pages.auth.resetPassword.validation.newPasswordRequired') },
                { min: 6, message: t('pages.auth.resetPassword.validation.newPasswordMin') },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: t('pages.auth.resetPassword.validation.newPasswordComplexity'),
                },
              ]}
            >
              <Input.Password placeholder="••••••••" visibilityToggle />
            </Form.Item>

            <Form.Item
              label={t('pages.auth.resetPassword.confirmPasswordLabel')}
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: t('pages.auth.resetPassword.validation.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('pages.auth.resetPassword.validation.confirmPasswordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="••••••••" visibilityToggle />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="reset-submit-btn"
              >
                {loading ? t('pages.auth.resetPassword.updating') : t('pages.auth.resetPassword.submit')}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="reset-back-row">
          <Button
            type="link"
            onClick={handleGoBack}
            style={{ color: '#666', fontSize: '14px' }}
          >
            {t('pages.auth.resetPassword.backToLogin')}
          </Button>
        </div>
      </div>
    </div>
  );
}
