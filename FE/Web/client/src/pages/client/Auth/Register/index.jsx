import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { GoogleLogin } from "@react-oauth/google";
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
import { useNavigate } from "react-router-dom";
import { isAdminClinicAccount } from "../../../../constants/authRole";
import { loginGoogleApi, registerApi } from "../../../../data/client/api/auth";
import { useAuth } from "../../../../hooks/client/AuthContext";
import { decodeGoogleCredential } from "../../../../utils/googleAuth";
import { getGoogleClientConfigError, getGoogleClientId, isGoogleClientIdValid } from "../../../../utils/googleOAuthConfig";
import "./styles.css";

const { Title, Text } = Typography;

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const { login } = useAuth();
  const googleClientId = getGoogleClientId();
  const hasValidGoogleClientId = isGoogleClientIdValid(googleClientId);
  const googleConfigError = getGoogleClientConfigError(googleClientId);

  const validatePassword = (value) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!value) return Promise.reject("Vui lòng nhập mật khẩu");
    if (!regex.test(value)) {
      return Promise.reject(
        "Mật khẩu phải ≥8 ký tự, gồm chữ hoa, chữ thường và số"
      );
    }
    return Promise.resolve();
  };

  const validateFullName = (value) => {
    const regex = /^[\p{L}\s]+$/u;
    if (!value) return Promise.reject("Vui lòng nhập họ và tên");
    if (!regex.test(value)) {
      return Promise.reject("Họ tên không được chứa số hoặc ký tự đặc biệt");
    }
    return Promise.resolve();
  };

  const validateEmail = (value) => {
    const regex = /^\S+@\S+\.\S+$/;
    if (!value) return Promise.reject("Vui lòng nhập email");
    if (!regex.test(value)) {
      return Promise.reject("Email không hợp lệ");
    }
    return Promise.resolve();
  };

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      await registerApi({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      message.success("Đăng ký thành công");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      if (error.response?.status === 409) {
        form.setFields([
          {
            name: "email",
            errors: ["Email đã tồn tại"],
          },
        ]);
      } else {
        message.error(
          error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    const googleIdToken = credentialResponse?.credential;

    if (!googleIdToken) {
      message.error("Không nhận được Google token. Vui lòng thử lại.");
      return;
    }

    try {
      setGoogleLoading(true);

      const { fullName, avatarUrl } = decodeGoogleCredential(googleIdToken);
      const res = await loginGoogleApi({ googleIdToken, fullName, avatarUrl });
      const data = res?.data;

      if (!data || !data.accessToken) {
        message.error(data?.message || "Đăng nhập bằng Google thất bại.");
        return;
      }

      const { accessToken, userInfo } = data;

      if (isAdminClinicAccount(userInfo)) {
        message.warning("Tài khoản phòng khám vui lòng đăng nhập tại cổng quản trị.");
        navigate("/admin/login", { replace: true });
        return;
      }

      login(accessToken, userInfo);
      message.success("Đăng nhập bằng Google thành công!");
      navigate("/home");
    } catch (error) {
      message.error(error?.response?.data?.message || "Đăng nhập bằng Google thất bại.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div style={{ padding: '40px 25px', background: 'var(--color-surface-card)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <UserOutlined style={{ fontSize: '48px', color: 'var(--auth-primary)' }} />
          <Title level={2} style={{ margin: '16px 0 8px' }}>Đăng ký tài khoản</Title>
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
            label="Họ và tên"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder="Nhập họ và tên của bạn"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
            ]}
          >
            <Input
              type="email"
              prefix={<MailOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder="example@email.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Mật khẩu xác nhận không khớp");
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-text-disabled)' }} />}
              placeholder="Nhập lại mật khẩu"
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
                    : Promise.reject("Bạn phải đồng ý với điều khoản"),
              },
            ]}
          >
            <Checkbox>
              Tôi đồng ý với{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--auth-primary)' }}>
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--auth-primary)' }}>
                Chính sách bảo mật
              </a>{" "}
              của PetcareX
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
              Tạo tài khoản
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'var(--color-border-strong)' }} plain>
          Hoặc tiếp tục đăng nhập với
        </Divider>

        {hasValidGoogleClientId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <GoogleLogin
              onSuccess={handleGoogleRegister}
              onError={() => message.error("Đăng nhập bằng Google thất bại. Vui lòng thử lại.")}
              text="signin_with"
              width="360"
              shape="pill"
              theme="outline"
              size="large"
              useOneTap={false}
            />
            {googleLoading && <Text type="secondary">Đang xác thực Google...</Text>}
          </div>
        ) : (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            {googleConfigError}
          </Text>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">
            Bạn đã có tài khoản? <a style={{ color: 'var(--auth-primary)', fontWeight: 'bold' }} onClick={() => navigate("/login")}>Đăng nhập ngay</a>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          © 2026 PetcareX Việt Nam
        </div>
      </div>
    </div>
  );
}
