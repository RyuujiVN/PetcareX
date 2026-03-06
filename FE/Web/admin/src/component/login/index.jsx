import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import axios from "axios";

import { FaPaw, FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "../../context/AuthContext";
import { RxAvatar } from "react-icons/rx";
import instance from '../../api/instance';
import { FcGoogle } from "react-icons/fc";

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    instance.post('/auth/login', {
      email,
      password
    })
      .then((res) => {

        const token = res.data.data || res.data.token;

        if (token) {

          login(token);

          toast.success("Đăng nhập thành công", {
            position: "bottom-right",
            autoClose: 1000,
            onClose: () => navigate("/dashboard")
          });

        } else {

          toast.error("Thông tin đăng nhập không đúng!", {
            position: "bottom-right",
            autoClose: 1500
          });

        }

      })
      .catch((err) => {

        console.log(err);

        toast.error("Thông tin đăng nhập không đúng!", {
          position: "bottom-right",
          autoClose: 1500
        });

      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGoogleLogin = () => {
    instance.get('/auth/google/');
  };

  return (
    <div className="login-container">

      <div className="login-header-bar">
        <div className="header-left">
            <FaPaw size={28} color="#13ECDA" />
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="login-card">
          <RxAvatar size={50}/>
        <div className="login-header">
          
          <h1 className="login-title">Đăng nhập</h1>
          <p className="login-subtitle">Chào mừng bạn đến với cộng đồng PetcareX</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="password-header">
              <label className="form-label">Mật khẩu</label>
              <a href="/forgot-password" className="forgot-password-link">
                Quên mật khẩu?
              </a>
            </div>

            <div className="input-wrapper password-wrapper">

              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={handleTogglePassword}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>

            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

        </form>

        <div className="divider">
          <span>Hoặc tiếp tục đăng nhập với</span>
        </div>

       <button
          type="button"
          className="google-login-button"
          onClick={handleGoogleLogin}
        >
            <FcGoogle size={18}/>
          <span>Đăng nhập với Google</span>
        </button>

        <div className="register-link">
          <span>Bạn chưa có tài khoản? </span>
          <a href="/register">Đăng ký ngay</a>
          <p>© 2026 PetCareX Việt Nam. Tất cả quyền được bảo lưu</p>
        </div>

      </div>

      <ToastContainer />

    </div>
  );
}