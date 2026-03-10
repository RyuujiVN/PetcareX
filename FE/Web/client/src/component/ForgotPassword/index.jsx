import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import './styles.css';

export default function ForgotPassword() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: values.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không tìm thấy tài khoản với email này');
      }

      const data = await response.json();
      message.success(data.message || 'Gửi email thành công');
      
      // Navigate to Re-Enter Password page with email
      setTimeout(() => {
        navigate('/reEnterPassword', { state: { email: values.email } });
      }, 1000);
    } catch (err) {
      message.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/login');
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-content">
        <div className="forgot-password-card">
          {/* Icon */}
          <div className="forgot-password-icon">
            <svg viewBox="0 0 80 80" className="lock-icon-svg">
              <defs>
                <style>{`.lock-fill { fill: #13ECDA; }`}</style>
              </defs>
              <circle cx="40" cy="40" r="40" className="lock-fill" opacity="0.15" />
              <path
                d="M40 20C35.58 20 32 23.58 32 28V35C30.9 35 30 35.9 30 37V58C30 59.1 30.9 60 32 60H48C49.1 60 50 59.1 50 58V37C50 35.9 49.1 35 48 35V28C48 23.58 44.42 20 40 20ZM40 24C42.76 24 45 26.24 45 29V35H35V29C35 26.24 37.24 24 40 24Z"
                className="lock-fill"
              />
              <path
                d="M50 8L60 20L50 32L52.12 34.12L65 21.24L52.12 8.36Z"
                className="lock-fill"
              />
            </svg>
          </div>

          {/* Header */}
          <div className="forgot-password-header">
            <h1 className="forgot-password-title">Quên mật khẩu?</h1>
            <p className="forgot-password-subtitle">
              Đừng lo lắng! Nhập email liên kết với tài khoản của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu
            </p>
          </div>

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              name="email"
              label={<span className="form-label">Địa chỉ Email</span>}
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập email',
                },
                {
                  type: 'email',
                  message: 'Email không hợp lệ',
                },
              ]}
            >
              <Input
                placeholder="Nhập email của bạn"
                className="form-input"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="forgot-password-button"
              >
                Gửi liên kết đặt lại
              </Button>
            </Form.Item>
          </Form>

          {/* Back to login */}
          <div className="back-to-login">
            <Button
              type="text"
              onClick={handleGoBack}
              className="back-login-link"
            >
              ← Quay lại Đăng nhập
            </Button>
          </div>

          {/* Support link */}
          <div className="contact-support-link">
            <span>Bạn gặp khó khăn?</span>
            <a href="/contact-support">Liên hệ bộ phận hỗ trợ</a>
          </div>
        </div>

        {/* Footer */}
        <footer className="forgot-password-footer">
          <p>© 2026 PETCAREX INC. BẢO MẬT THÔNG TIN CỦA BẠN LÀ UU TIÊN CỦA CHÚNG TÔI</p>
        </footer>
      </div>
    </div>
  );
}
