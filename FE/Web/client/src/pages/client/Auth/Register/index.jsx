import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import {
    Button,
    Checkbox,
    Divider,
    Form,
    Input,
    message,
    Typography,
} from "antd";
import React from "react";
import { useTranslation } from 'react-i18next';
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { getFirebaseConfigError, isFirebaseGoogleAuthReady } from "../../../../config/firebaseClient";
import { getAuthPortalByRole, getPostLoginPathByRole } from "../../../../constants/authRole";
import { useAuth as useAdminAuth } from "../../../../hooks/Clinic/AuthContext";
import { useAuth } from "../../../../hooks/client/AuthContext";
import { getClientInstance } from "../../../../services/apiClient";
import { registerApi } from "../../../../services/authService";
import { authenticateClientWithGoogle } from "../../../../services/clientGoogleAuthService";
import "./styles.css";

const { Title, Text } = Typography;

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const { t } = useTranslation();
  const { login: clientLogin } = useAuth();
  const { login: adminLogin } = useAdminAuth();
  const hasGoogleAuth = isFirebaseGoogleAuthReady();
  const googleConfigError = getFirebaseConfigError();

  const handleSuccessfulAuth = ({ accessToken, userInfo }) => {
    const portal = getAuthPortalByRole(userInfo);
    const redirectPath = getPostLoginPathByRole(userInfo);

    if (portal === "admin") {
      adminLogin(accessToken, userInfo);
    } else {
      clientLogin(accessToken, userInfo);
    }

    message.success(t('pages.auth.register.googleSuccess'));
    navigate(redirectPath, { replace: true });
  };

  const validatePassword = (_, value) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!value) return Promise.reject(t('pages.auth.register.validation.passwordRequired'));
    if (value.length > 256) return Promise.reject(t('pages.auth.register.validation.passwordTooLong'));
    if (!regex.test(value)) {
      return Promise.reject(t('pages.auth.register.validation.passwordComplexity'));
    }

    return Promise.resolve();
  };

  const validateFullName = (_, value) => {
    const regex = /^[\p{L}\s]+$/u;

    if (!value) return Promise.reject(t('pages.auth.register.validation.fullNameRequired'));
    if (!regex.test(value)) {
      return Promise.reject(t('pages.auth.register.validation.fullNameInvalid'));
    }

    return Promise.resolve();
  };

  const validateEmail = (_, value) => {
    const regex = /^\S+@\S+\.\S+$/;

    if (!value) return Promise.reject(t('pages.auth.register.validation.emailRequired'));
    if (!regex.test(value)) {
      return Promise.reject(t('pages.auth.register.validation.emailInvalid'));
    }

    return Promise.resolve();
  };

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      await registerApi(getClientInstance(), {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      message.success(t('pages.auth.register.success'));
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      if (error.response?.status === 409) {
        form.setFields([
          {
            name: "email",
            errors: [t('pages.auth.register.emailExisted')],
          },
        ]);
      } else {
        message.error(
          error.response?.data?.message || t('pages.auth.register.failed')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setGoogleLoading(true);

      const authResult = await authenticateClientWithGoogle();
      handleSuccessfulAuth({
        accessToken: authResult.accessToken,
        userInfo: authResult.userInfo,
      });
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || t('pages.auth.register.googleFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div style={{ padding: '40px 25px', background: 'var(--color-surface-card)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/avatarProject.png"
            alt={t('pages.auth.register.heading')}
            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '16px', marginLeft: 'auto', marginRight: 'auto', display: 'block' }}
          />
          <Title level={2} style={{ margin: '16px 0 8px' }}>{t('pages.auth.register.heading')}</Title>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegister}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="fullName"
            label={t('pages.auth.register.fullNameLabel')}
            rules={[
              { validator: validateFullName },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder={t('pages.auth.register.fullNamePlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('pages.auth.register.emailLabel')}
            rules={[
              { validator: validateEmail },
            ]}
          >
            <Input
              type="email"
              prefix={<MailOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder={t('pages.auth.register.emailPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('pages.auth.register.passwordLabel')}
            rules={[
              { validator: validatePassword },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder={t('pages.auth.register.passwordPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('pages.auth.register.confirmPasswordLabel')}
            dependencies={["password"]}
            rules={[
              { required: true, message: t('pages.auth.register.validation.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(t('pages.auth.register.validation.confirmPasswordMismatch'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder={t('pages.auth.register.confirmPasswordPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="agree"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(t('pages.auth.register.validation.agreeRequired')),
              },
            ]}
          >
            <Checkbox>
              {t('pages.auth.register.agreePrefix')}{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--auth-primary)' }}>
                {t('pages.auth.register.terms')}
              </a>{" "}
              {t('pages.auth.register.and')}{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--auth-primary)' }}>
                {t('pages.auth.register.privacy')}
              </a>{" "}
              {t('pages.auth.register.agreeSuffix')}
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ backgroundColor: 'var(--auth-primary)', color: 'var(--color-surface-card)', fontWeight: 'bold', borderColor: 'var(--auth-primary)' }}
            >
              {t('pages.auth.register.createAccount')}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'var(--color-border-strong)' }} plain>
          {t('pages.auth.register.orContinueWith')}
        </Divider>

        {hasGoogleAuth ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Button
              onClick={handleGoogleRegister}
              icon={<FcGoogle />}
              loading={googleLoading}
              size="large"
              style={{ width: 600, height: 44, fontWeight: 600 }}
            >
              {t('pages.auth.register.continueWithGoogle')}
            </Button>
          </div>
        ) : (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            {googleConfigError}
          </Text>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">
            {t('pages.auth.register.haveAccount')} <a style={{ color: 'var(--auth-primary)', fontWeight: 'bold' }} onClick={() => navigate("/login")}>{t('pages.auth.register.loginNow')}</a>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {t('pages.auth.register.copyright')}
        </div>
      </div>
    </div>
  );
}
