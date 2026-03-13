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
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-6 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="m-0 text-xl font-bold tracking-tight text-slate-800">PetcareX</h2>
        </div>
      </div>

      <div className="relative mx-auto mt-6 w-full max-w-2xl rounded-3xl border border-slate-100 bg-white px-6 py-10 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] sm:px-10">
        <div className="mb-6 text-center">
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

          <Form.Item className="mb-3">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ backgroundColor: '#13ECDA', color: 'white', fontWeight: 'bold', borderColor: '#13ECDA', height: 44 }}
            >
              Tạo tài khoản
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-4 text-center">
          <Text type="secondary">
            Bạn đã có tài khoản? <a style={{ color: '#13ECDA', fontWeight: 'bold' }} onClick={() => navigate("/login")}>Đăng nhập ngay</a>
          </Text>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          © 2026 PetcareX Việt Nam
        </div>
      </div>
    </div>
  );
}