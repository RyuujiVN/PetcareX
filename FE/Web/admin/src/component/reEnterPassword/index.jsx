import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles.css';
import instance from '../../api/instance';
import { FaPaw } from "react-icons/fa";
import { MdLockReset } from "react-icons/md";
import { Form, Input, Button, Card, Space, message } from 'antd';

export default function ReEnterPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const prevCountdownRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      message.warning('Vui lòng nhập email trước');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (otpCountdown <= 0) return;

    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCountdown]);

  useEffect(() => {
    if (prevCountdownRef.current > 0 && otpCountdown === 0) {
      const otpValue = form.getFieldValue('otp');
      if (!otpValue) {
        message.warning('Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP mới');
      }
    }
    prevCountdownRef.current = otpCountdown;
  }, [otpCountdown, form]);

  const handleGoBack = () => {
    navigate('/login');
  };

  const handleResendOtp = async () => {
    if (!email) {
      message.error('Email không hợp lệ');
      return;
    }

    setResendLoading(true);

    try {
      const response = await instance.post('/auth/forgot-password', {email})
      message.success('Mã OTP đã được gửi lại. Vui lòng kiểm tra email của bạn');
      form.setFieldValue('otp', '');
      setOtpCountdown(60);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP';
      message.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSuccess('');
    
    if (otpCountdown === 0 && values.otp) {
      message.warning('Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP mới');
      return;
    }

    setLoading(true);

    try {
      const response = await instance.post('/auth/reset-password', {
        email: email,
        otp: values.otp,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      const successMsg = response.data?.message || 'Mật khẩu đã được đặt lại thành công';
      setSuccess(successMsg);
      message.success(successMsg);
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-header-bar">
        <div className="header-left">
          <FaPaw size={28} color="#13ECDA" />           
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="reset-password-card" style={{ padding: '50px 40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '700px' }}>
        <div className="lock-icon-section">
          <MdLockReset size={70} color="#13ECDA" />
        </div>

        <div className="reset-password-header">
          <h1 className="reset-password-title">Thiết lập lại mật khẩu</h1>
          <p style={{ textAlign: 'center', color: '#666', marginTop: '8px' }}>
            Mã OTP đã được gửi tới <strong>{email}</strong>
          </p>
        </div>

          {success && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                color: '#52c41a',
                marginBottom: '16px',
              }}
            >
              {success}
            </div>
          )}

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
                {
                  pattern: /^\d{6}$/,
                  message: 'Mã OTP phải gồm 6 chữ số',
                },
              ]}
            >
              <Input
                placeholder="Nhập mã OTP gồm 6 chữ số"
                maxLength="6"
              />
            </Form.Item>

            <div style={{ marginTop: '-16px', marginBottom: '16px', textAlign: 'right' }}>
              <Button
                type="link"
                onClick={handleResendOtp}
                loading={resendLoading}
                disabled={resendLoading || otpCountdown > 0}
                style={{
                  color: otpCountdown > 0 ? '#999' : '#13ECDA',
                  padding: '0 4px',
                  height: 'auto',
                  fontSize: '14px',
                }}
              >
                {otpCountdown > 0
                  ? `Gửi lại mã OTP (${otpCountdown}s)`
                  : 'Gửi lại mã OTP'}
              </Button>
            </div>

            <Form.Item
              label="Nhập mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                {
                  min: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự',
                },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message:
                    'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
                },
              ]}
            >
              <Input.Password
                placeholder="••••••••"
                visibilityToggle
              />
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
                    return Promise.reject(
                      new Error('Mật khẩu không khớp')
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="••••••••"
                visibilityToggle
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  backgroundColor: '#13ECDA',
                  borderColor: '#13ECDA',
                  height: '44px',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
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
