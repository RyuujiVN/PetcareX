import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Checkbox,
  message,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import "./styles.css";
import { registerApi } from "../../api/auth";

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
      <div className="register-card">
        <div className="register-header">
          <UserOutlined  className="register-icon" />
          <h1 className="register-title">Đăng ký tài khoản</h1>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegister}
          autoComplete="off"
          className="register-form"
        >
          <Form.Item
            name="fullName"
            label="Họ Và Tên"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
             
            ]}
          >
            <Input
              placeholder="Nhập họ và tên"
              size="large"
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
              placeholder="Nhập email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật Khẩu"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
            
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác Nhận Mật Khẩu"
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
            <Input.Password placeholder="Xác nhận mật khẩu" size="large" />
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
              <a href="/privacy" target="_blank"  rel="noopener noreferrer" style={{ color: "#13ECDA" }}>
                Chính sách bảo mật
              </a>{" "}
              của PetcareX
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              className="register-button"
            >
              Tạo Tài Khoản
            </Button>
          </Form.Item>
        </Form>

        <div className="login-link">
          <span>Bạn đã có tài khoản? </span>
          <a onClick={() => navigate("/login")}>Đăng nhập ngay</a>
        </div>

        <div className="footer-text">© 2026 PetcareX Việt Nam</div>
      </div>
    </div>
  );
}