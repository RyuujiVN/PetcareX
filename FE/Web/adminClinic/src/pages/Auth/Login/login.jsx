import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { FaPaw } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import './login.module.css';

import { loginApi } from '../../../data/api/auth';
import { useAuth } from '../../../hooks/AuthContext';

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
    <div className="login-container">
      <div className="login-header-bar">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaPaw size={28} color="var(--auth-primary)" />
          <h2 className="logo-name-small" style={{ margin: 0, color: 'white' }}>PetcareX</h2>
        </div>
      </div>

      <div className="login-card" style={{ padding: '40px 30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <LockOutlined style={{ fontSize: '48px', color: 'var(--auth-primary)' }} />
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
            style={{width: '100%'}}
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email để đăng nhập!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)'}} />}
              placeholder="Nhập email của bạn"
            />
          </Form.Item>

          <Form.Item
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Mật khẩu</span>
                <Link href="/forgot-password" style={{ float: 'right', marginLeft: '400px', color: 'var(--auth-primary)' }}>Quên mật khẩu?</Link>
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ backgroundColor: 'var(--auth-primary)', color: 'white', fontWeight: 'bold', borderColor: 'var(--auth-primary)' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

        </Form>

        <Divider style={{ borderColor: '#d9d9d9' }} plain>
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

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">
            Chưa có tài khoản? <a style={{ color: 'var(--auth-primary)', fontWeight: 'bold' }} href="/register">Đăng ký ngay</a>
          </Text>
        </div>

      </div>
    </div>
  );
}
