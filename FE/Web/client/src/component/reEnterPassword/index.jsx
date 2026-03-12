import { Button, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import { FaPaw } from 'react-icons/fa';
import { MdLockReset } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';
import { forgotPasswordApi, resetPasswordApi } from '../../api/auth';
import './styles.css';

const OTP_EXPIRY_SECONDS = 300; // 5 phút theo backend
const RESEND_COOLDOWN_SECONDS = 60;

export default function ReEnterPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [otpExpiryLeft, setOtpExpiryLeft] = useState(OTP_EXPIRY_SECONDS);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      message.warning('Vui lòng nhập email trước');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Đếm ngược cooldown nút gửi lại (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // Đếm ngược hiệu lực OTP (5 phút)
  useEffect(() => {
    if (otpExpiryLeft === 0) {
      message.warning({
        content: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP mới.',
        key: 'otp-expired',
      });
      return;
    }
    const id = setTimeout(() => setOtpExpiryLeft(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [otpExpiryLeft]);

  const handleGoBack = () => navigate('/login');

  const handleResendOtp = async () => {
    if (!email) {
      message.error('Email không hợp lệ');
      return;
    }
    setResendLoading(true);
    try {
      await forgotPasswordApi(email);
      message.success('Mã OTP đã được gửi lại. Vui lòng kiểm tra email của bạn');
      form.setFieldValue('otp', '');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpExpiryLeft(OTP_EXPIRY_SECONDS);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    if (otpExpiryLeft === 0) {
      message.warning('Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP mới.');
      return;
    }
    setLoading(true);
    try {
      const response = await resetPasswordApi({
        email,
        otp: values.otp,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      message.success(response.data?.message || 'Mật khẩu đã được đặt lại thành công');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại');
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
      <div className="reset-password-header-bar">
        <div className="header-left">
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="reset-password-card">
        <div className="lock-icon-section">
          <MdLockReset size={70} color="#13ECDA" />
        </div>

        <div className="reset-password-header">
          <h1 className="reset-password-title">Thiết lập lại mật khẩu</h1>
          <p className="reset-password-subtitle">
            Mã OTP đã được gửi tới <strong>{email}</strong>
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
              label="Nhập mã OTP"
              name="otp"
              rules={[
                { required: true, message: 'Vui lòng nhập mã OTP' },
                { pattern: /^\d{6}$/, message: 'Mã OTP phải gồm 6 chữ số' },
              ]}
            >
              <Input placeholder="Nhập mã OTP gồm 6 chữ số" maxLength={6} />
            </Form.Item>

            <div className="resend-otp-row">
              <span className="otp-expiry-hint">
                {otpExpiryLeft > 0 ? (
                  <>OTP hết hạn sau: <strong>{formatTime(otpExpiryLeft)}</strong></>
                ) : (
                  <span className="otp-expired-text">Mã OTP đã hết hạn</span>
                )}
              </span>
              <Button
                type="link"
                onClick={handleResendOtp}
                loading={resendLoading}
                disabled={resendLoading || resendCooldown > 0}
                style={{
                  color: resendCooldown > 0 ? '#999' : '#13ECDA',
                  padding: '0 4px',
                  height: 'auto',
                  fontSize: '14px',
                }}
              >
                {resendCooldown > 0 ? `Gửi lại mã OTP (${resendCooldown}s)` : 'Gửi lại mã OTP'}
              </Button>
            </div>

            <Form.Item
              label="Nhập mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
                },
              ]}
            >
              <Input.Password placeholder="••••••••" visibilityToggle />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu không khớp'));
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
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
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
            ← Quay lại Đăng nhập
          </Button>
        </div>
      </div>
    </div>
  );
}
