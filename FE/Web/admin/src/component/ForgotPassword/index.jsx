import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Spin } from 'antd';
import { FaPaw } from 'react-icons/fa';

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không tìm thấy tài khoản với email này');
      }

      message.success({
        content: 'Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư đến hoặc thư mục spam.',
        duration: 3,
      });
      
      setTimeout(() => {
        navigate('/reEnterPassword', { state: { email: values.email } });
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
      message.error({
        content: err.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute -left-16 top-12 h-52 w-52 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="m-0 text-xl font-bold tracking-tight text-slate-800">PetcareX</h2>
        </div>
      </div>

      <div className="relative mx-auto mt-6 w-full max-w-2xl rounded-3xl border border-slate-100 bg-white px-6 py-10 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] sm:px-10">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-50">
          <svg viewBox="0 0 80 80" className="h-14 w-14">
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

          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Quên mật khẩu?</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Đừng lo lắng! Nhập email liên kết với tài khoản của bạn và chúng tôi sẽ gửi mã OTP để bạn có thể khôi phục mật khẩu
            </p>
          </div>

          <Spin spinning={loading} tip="Đang gửi mã OTP...">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
            >
              <Form.Item
                name="email"
                label={<span className="font-medium text-slate-700">Địa chỉ Email</span>}
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
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{ backgroundColor: '#13ECDA', borderColor: '#13ECDA', fontWeight: 700, height: 44 }}
                >
                  Gửi mã OTP
                </Button>
              </Form.Item>
            </Form>
          </Spin>

          <div className="text-center">
            <Button
              type="text"
              onClick={handleGoBack}
              disabled={loading}
            >
              ← Quay lại Đăng nhập
            </Button>
          </div>

          <div className="mt-3 text-center text-sm text-slate-500">
            <span>Bạn gặp khó khăn?</span>
            <a className="ml-1 font-medium text-cyan-600" href="/contact-support">Liên hệ bộ phận hỗ trợ</a>
          </div>
        </div>
    </div>
  );
}
