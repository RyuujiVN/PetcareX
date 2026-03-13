import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { FaPaw } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';

import { loginApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const { Title, Text, Link } = Typography;

export default function Login() {

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (values) => {

    try {

      setLoading(true);

      const email = values.email.trim().toLowerCase();
      const password = values.password;

      const res = await loginApi(email, password);

      const data = res.data;

      if (!data || !data.accessToken) {

        form.setFields([
          {
            name: "password",
            errors: [data?.message || "Email hoặc mật khẩu không đúng!"],
          },
        ]);

        return;
      }

      const { accessToken, userInfo } = data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      login(accessToken);

      message.success("Đăng nhập thành công!");

      navigate("/home");

    } catch (err) {

      const errorMsg =
        err.response?.data?.message ||
        "Email hoặc mật khẩu không đúng!";

      form.setFields([
        {
          name: "password",
          errors: [errorMsg],
        },
      ]);

    } finally {

      setLoading(false);

    }

  };

  const handleGoogleLogin = () => {
    window.location.href = `${window.location.origin}/auth/google`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute -left-16 top-16 h-52 w-52 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="m-0 text-xl font-bold tracking-tight text-slate-800">PetcareX</h2>
        </div>
      </div>

      <div className="relative mx-auto mt-6 w-full max-w-2xl rounded-3xl border border-slate-100 bg-white px-6 py-10 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] sm:px-10">
        <div className="mb-6 text-center">
          <LockOutlined style={{ fontSize: '48px', color: '#13ECDA' }} />
          <Title level={2} style={{ margin: '16px 0 8px' }}>Đăng nhập</Title>
          <Text type="secondary">Chào mừng bạn đến với cộng đồng PetcareX</Text>
        </div>

        <Form
          form={form}
          name="loginForm"
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email để đăng nhập!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Nhập email của bạn"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="flex w-full items-center justify-between">
                <span>Mật khẩu</span>
                <Link href="/forgot-password" style={{ color: '#13ECDA' }}>Quên mật khẩu?</Link>
              </div>
            }
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu để đăng nhập!' },
              { min: 6, message: 'Mật khẩu phải tối thiểu 6 ký tự!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Nhập mật khẩu của bạn"
            />
          </Form.Item>

          <Form.Item className="mb-3">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ backgroundColor: '#13ECDA', color: 'white', fontWeight: 'bold', borderColor: '#13ECDA', height: 44 }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

        </Form>

        <Divider style={{ borderColor: '#d9d9d9', marginTop: 8 }} plain>
          Hoặc tiếp tục đăng nhập với
        </Divider>

        <Button
          block
          size="large"
          onClick={handleGoogleLogin}
          icon={<FcGoogle />}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          Đăng nhập với Google
        </Button>

        <div className="mt-4 text-center">
          <Text type="secondary">
            Chưa có tài khoản? <a style={{ color: '#13ECDA', fontWeight: 'bold' }} href="/register">Đăng ký ngay</a>
          </Text>
        </div>

      </div>
    </div>
  );
}
