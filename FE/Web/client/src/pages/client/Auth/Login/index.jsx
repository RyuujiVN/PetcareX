import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import { isAdminClinicAccount } from '../../../../constants/authRole';
import { loginApi } from '../../../../data/client/api/auth';
import { useAuth } from '../../../../hooks/client/AuthContext';
import { authenticateClientWithGoogle } from '../../../../utils/clientGoogleAuth';
import { getFirebaseConfigError, isFirebaseGoogleAuthReady } from '../../../../utils/firebaseClient';

const { Title, Text, Link } = Typography;

export default function Login() {

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const hasGoogleAuth = isFirebaseGoogleAuthReady();
  const googleConfigError = getFirebaseConfigError();

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

      const adminAccount = isAdminClinicAccount(userInfo);

      if (adminAccount) {
        message.warning('Tài khoản phòng khám vui lòng đăng nhập tại cổng quản trị.');
        navigate('/admin/login', { replace: true });
        return;
      }

      login(accessToken, userInfo);

      message.success("Đăng nhập thành công!");

      navigate('/home');

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

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      const authResult = await authenticateClientWithGoogle();

      if (authResult.status === 'admin-account') {
        message.warning('Tài khoản phòng khám vui lòng đăng nhập tại cổng quản trị.');
        navigate('/admin/login', { replace: true });
        return;
      }

      login(authResult.accessToken, authResult.userInfo);
      message.success('Đăng nhập bằng Google thành công!');
      navigate('/home');
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Đăng nhập bằng Google thất bại.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ padding: '40px 30px', background: 'var(--color-surface-card)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '650px' }}>
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
              prefix={<UserOutlined style={{ color: 'var(--color-text-disabled)'}} />}
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
              prefix={<LockOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder="Nhập mật khẩu của bạn"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ backgroundColor: 'var(--auth-primary)', color: 'var(--color-surface-card)', fontWeight: 'bold', borderColor: 'var(--auth-primary)' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

        </Form>

        <Divider style={{ borderColor: 'var(--color-border-strong)' }} plain>
          Hoặc tiếp tục đăng nhập với
        </Divider>

        {hasGoogleAuth ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Button
              onClick={handleGoogleLogin}
              icon={<FcGoogle />}
              loading={googleLoading}
              size="large"
              style={{ width: 360, height: 44, borderRadius: 999, fontWeight: 600 }}
            >
              Tiếp tục với Google
            </Button>
          </div>
        ) : (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            {googleConfigError}
          </Text>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">
            Chưa có tài khoản? <a style={{ color: 'var(--auth-primary)', fontWeight: 'bold' }} href="/register">Đăng ký ngay</a>
          </Text>
        </div>

      </div>
    </div>
  );
}

