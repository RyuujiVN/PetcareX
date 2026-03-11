import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Checkbox,
  message,
  Typography,
} from "antd";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import "./styles.css";
import { registerApi } from "../../api/auth";
import { FaPaw } from "react-icons/fa";

const { Title, Text } = Typography;

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

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

  return (
    <div className="register-container">
      <div className="login-header-bar">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="logo-name-small" style={{ margin: 0, color: '#333' }}>PetcareX</h2>
        </div>
      </div>

      <div style={{ padding: '40px 25px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#13ECDA' }} />
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
              { validator: (_, value) => validateFullName(value) },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="Nhập họ và tên của bạn"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { validator: (_, value) => validateEmail(value) },
            ]}
          >
            <Input
              type="email"
              prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder="example@email.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { validator: (_, value) => validatePassword(value) },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
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
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
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
              <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#13ECDA" }}>
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#13ECDA" }}>
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
              style={{ backgroundColor: '#13ECDA', color: 'white', fontWeight: 'bold', borderColor: '#13ECDA' }}
            >
              Tạo tài khoản
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary">
            Bạn đã có tài khoản? <a style={{ color: '#13ECDA', fontWeight: 'bold' }} onClick={() => navigate("/login")}>Đăng nhập ngay</a>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#666' }}>
          © 2026 PetcareX Việt Nam
        </div>
      </div>
    </div>
  );
}