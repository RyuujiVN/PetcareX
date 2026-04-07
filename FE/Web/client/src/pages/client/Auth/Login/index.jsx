import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPaw } from "react-icons/fa";
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import { getFirebaseConfigError, isFirebaseGoogleAuthReady } from '../../../../config/firebaseClient';
import { getAuthPortalByRole, getPostLoginPathByRole } from '../../../../constants/authRole';
import { useAuth as useAdminAuth } from '../../../../hooks/Clinic/AuthContext';
import { useAuth as useClientAuth } from '../../../../hooks/client/AuthContext';
import { getClientInstance } from '../../../../services/apiClient';
import { loginApi } from '../../../../services/authService';
import { authenticateClientWithGoogle } from '../../../../services/clientGoogleAuthService';

const { Title, Text, Link } = Typography;

export default function Login() {

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();
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

    message.success(t('pages.auth.login.success'));
    navigate(redirectPath, { replace: true });
  };

  const handleLogin = async (values) => {

    try {

      setLoading(true);

      const email = values.email.trim().toLowerCase();
      const password = values.password;

      const res = await loginApi(getClientInstance(), email, password);

      const data = res.data;

      if (!data || !data.accessToken) {

        form.setFields([
          {
            name: "password",
            errors: [data?.message || t('pages.auth.login.invalidCredentials')],
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
        t('pages.auth.login.invalidCredentials');

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
      message.error(error?.response?.data?.message || error?.message || t('pages.auth.login.googleLoginFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ padding: '40px 30px', background: 'var(--color-surface-card)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <FaPaw style={{ fontSize: '48px', color: 'var(--auth-primary)', marginLeft: 'auto', marginRight: 'auto' }} />
          <Title level={2} style={{ margin: '16px 0 8px' }}>{t('pages.auth.login.title')}</Title>
          <Text type="secondary">{t('pages.auth.login.welcome')}</Text>
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
            label={t('pages.auth.login.emailLabel')}
            name="email"
            rules={[
              { required: true, message: t('pages.auth.login.validation.emailRequired') },
              { type: 'email', message: t('pages.auth.login.validation.emailInvalid') }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--color-text-disabled)'}} />}
              placeholder={t('pages.auth.login.emailPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{t('pages.auth.login.passwordLabel')}</span>
                <Link href="/forgot-password" style={{ float: 'right', marginLeft: '400px', color: 'var(--auth-primary)' }}>{t('pages.auth.login.forgotPassword')}</Link>
              </div>
            }
            name="password"
            rules={[
              { required: true, message: t('pages.auth.login.validation.passwordRequired') },
              { min: 6, message: t('pages.auth.login.validation.passwordMin') }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder={t('pages.auth.login.passwordPlaceholder')}
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
              {t('pages.auth.login.submit')}
            </Button>
          </Form.Item>

        </Form>

        <Divider style={{ borderColor: 'var(--color-border-strong)' }} plain>
          {t('pages.auth.login.orContinueWith')}
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
              {t('pages.auth.login.continueWithGoogle')}
            </Button>
          </div>
        ) : (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            {googleConfigError}
          </Text>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">
            {t('pages.auth.login.noAccount')} <a style={{ color: 'var(--auth-primary)', fontWeight: 'bold' }} href="/register">{t('pages.auth.login.registerNow')}</a>
          </Text>
        </div>

      </div>
    </div>
  );
}

