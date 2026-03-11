import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Divider, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { FaPaw } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import { loginApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const { Title, Text, Link } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      setLoading(true);

      const res = await loginApi(values.email, values.password);

      const { accessToken, userInfo } = res.data;

      if (!accessToken) throw new Error('Không tìm thấy token');

      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      login(accessToken);

      message.success('Đăng nhập thành công!');
      navigate('/home');

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Thông tin đăng nhập không đúng!';
      message.error(errorMsg);
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
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="logo-name-small" style={{ margin: 0, color: 'white' }}>PetcareX</h2>
        </div>
      </div>

      <div className="login-card" style={{ padding: '40px 30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <LockOutlined style={{ fontSize: '48px', color: '#13ECDA' }} />
          <Title level={2} style={{ margin: '16px 0 8px' }}>Đăng nhập</Title>
          <Text type="secondary">Chào mừng bạn đến với cộng đồng PetcareX</Text>
        </div>

        <Form
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
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
              placeholder="Nhập email của bạn" 
            />
          </Form.Item>

          <Form.Item
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Mật khẩu</span>
                <Link href="/forgot-password" style={{ float: 'right', marginLeft: '400px', color: '#13ECDA' }}>Quên mật khẩu?</Link>
              </div>
            }
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu để đăng nhập!' }]}
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
              style={{ backgroundColor: '#13ECDA', color: 'white', fontWeight: 'bold', borderColor: '#13ECDA' }}
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
            Chưa có tài khoản? <a style={{ color: '#13ECDA', fontWeight: 'bold' }} href="/register">Đăng ký ngay</a>
          </Text>

        </div>
      </div>
    </div>
  );
}
