import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import { FaPaw, FaEye, FaEyeSlash } from "react-icons/fa";
import { RxAvatar } from "react-icons/rx";
import instance from "../../api/instance";

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(pass);
  };

  const validateFullName = (name) => {
    // const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    const regex = /^[\p{L}\s]+$/u;
    return regex.test(name);
  };

  const validateEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
  };


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

    setErrors({
      ...errors,
      [e.target.name]: ""
    });
  };


  const handleRegister = async (e) => {

    e.preventDefault();

    let newErrors = {};

    if (!validateFullName(form.fullName)) {
      newErrors.fullName = "Họ tên không được chứa số hoặc ký tự đặc biệt";
    }

    if (!validateEmail(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!validatePassword(form.password)) {
      newErrors.password =
        "Mật khẩu phải ≥8 ký tự, gồm chữ hoa, chữ thường và số";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (!agreeTerms) {
      newErrors.terms = "Bạn phải đồng ý với điều khoản";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {

      setLoading(true);

      const res = await instance.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password
      });

      if (res.status === 200) {
        navigate("/login");
      }

    } catch (err) {

      setErrors({
        email: "Email đã tồn tại"
      });

    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="register-container">

      <div className="register-header-bar">
        <div className="header-left">
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="register-card">

        <RxAvatar size={50} />

        <h1 className="register-title">Đăng ký tài khoản</h1>

        <form onSubmit={handleRegister} className="register-form">

          <div className="form-group">

            <label className="form-label">Họ và tên</label>

            <input
              type="text"
              name="fullName"
              className={`form-input ${errors.fullName ? "error" : ""}`}
              placeholder="Nhập họ và tên"
              value={form.fullName}
              onChange={handleChange}
            />

            {errors.fullName && (
              <p className="error-text">{errors.fullName}</p>
            )}

          </div>

          <div className="form-group">

            <label className="form-label">Email</label>

            <input
              type="email"
              name="email"
              className={`form-input ${errors.email ? "error" : ""}`}
              placeholder="Nhập email"
              value={form.email}
              onChange={handleChange}
            />

            {errors.email && (
              <p className="error-text">{errors.email}</p>
            )}

          </div>

          <div className="form-group">

            <label className="form-label">Mật khẩu</label>

            <div className="input-wrapper">

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>

            </div>

            {errors.password && (
              <p className="error-text">{errors.password}</p>
            )}

          </div>

          <div className="form-group">

            <label className="form-label">Xác nhận mật khẩu</label>

            <div className="input-wrapper">

              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? "error" : ""}`}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>

            </div>

            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}

          </div>

          <div className="checkbox-group">

            <label className={`checkbox-label ${errors.terms ? "error" : ""}`}>

              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />               
              <span>Tôi đồng ý với <a href="/terms">Điều khoản dịch vụ</a> và <a href="/privacy">Chính sách bảo mật</a> của PetcareX</span>
            </label>

            {errors.terms && (
              <p className="error-text">{errors.terms}</p>
            )}

          </div>

          <button
            className="register-button"
            type="submit"
            onClick={handleRegister}
          >
            <span>Tạo tài khoản</span>
          </button>

        </form>
   <div className="login-link">
           <span>Bạn đã có tài khoản? </span>
           <a href="/login">Đăng nhập ngay</a>
            <p>© 2026 PetCareX Việt Nam</p>
         </div>
      </div>

    </div>
  );
}