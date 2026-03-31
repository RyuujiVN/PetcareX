import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { FaPaw } from "react-icons/fa";
import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import { loginApi } from '../../../../data/client/api/auth';
import { getAuthPortalByRole, getPostLoginPathByRole } from '../../../../constants/authRole';
import { useAuth as useAdminAuth } from '../../../../hooks/Clinic/AuthContext';
import { useAuth as useClientAuth } from '../../../../hooks/client/AuthContext';
import { authenticateClientWithGoogle } from '../../../../utils/clientGoogleAuth';
import { getFirebaseConfigError, isFirebaseGoogleAuthReady } from '../../../../utils/firebaseClient';

const { Title, Text, Link } = Typography;

export default function Login() {

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form] = Form.useForm();
  const { login: clientLogin } = useClientAuth();
  const { login: adminLogin } = useAdminAuth();
  const navigate = useNavigate();
  const hasGoogleAuth = isFirebaseGoogleAuthReady();
  const googleConfigError = getFirebaseConfigError();

  const normalizeAdminProfile = (userInfo, clinicInfo) => {
    if (!userInfo) return userInfo;
    if (!clinicInfo) return userInfo;

    return {
      ...userInfo,
      clinicId: userInfo?.clinicId || clinicInfo?.id,
      clinicName: userInfo?.clinicName || clinicInfo?.name || '',
      clinicInfo,
    };
  };

  const handleSuccessfulAuth = ({ accessToken, userInfo }) => {
    const portal = getAuthPortalByRole(userInfo);
    const redirectPath = getPostLoginPathByRole(userInfo);

    if (portal === 'admin') {
      adminLogin(accessToken, userInfo);
    } else {
      clientLogin(accessToken, userInfo);
    }

    message.success('Đăng nhập thành công!');
    navigate(redirectPath, { replace: true });
  };

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

      const { accessToken, userInfo, clinicInfo } = data;
      handleSuccessfulAuth({
        accessToken,
        userInfo: normalizeAdminProfile(userInfo, clinicInfo),
      });

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
      handleSuccessfulAuth({
        accessToken: authResult.accessToken,
        userInfo: authResult.userInfo,
      });
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
          <FaPaw style={{ fontSize: '48px', color: 'var(--auth-primary)', marginLeft: 'auto', marginRight: 'auto' }} />
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
              style={{ width: 590, height: 46, borderRadius: 15, fontWeight: 600 }}
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

