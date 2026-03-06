import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import instance from '../../api/instance';
import { FaPaw, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdLockReset } from "react-icons/md";



export default function ReEnterPassword() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/login');
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      instance.post('/api/auth/otp', {otp, newPassword, confirmPassword});
      if (!response.ok) {
        throw new Error('Không thể gửi lại mã OTP');
      }

      setSuccess('Mã OTP đã được gửi lại');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      instance.post('/api/auth/confirmPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp,
          newPassword,
          rememberPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('Đặt lại mật khẩu thất bại');
      }

      setSuccess('Mật khẩu đã được đặt lại thành công');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-header-bar">
        <div className="header-left">
            <FaPaw size={28} color="#13ECDA" />           
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="reset-password-card">
        <div className="lock-icon-section">
          <MdLockReset size={70} color="#13ECDA"/>
        </div>

        <div className="reset-password-header">
          <h1 className="reset-password-title">Thiết lập lại mật khẩu</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form className="reset-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="otp" className="form-label">Nhập mã OTP</label>
            <div className="input-wrapper">
              <input
                id="otp"
                type="text"
                className="form-input"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button
              type="button"
              className="resend-otp-link"
              onClick={handleResendOtp}
              disabled={loading}
            >
              Gửi lại mã OTP
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">Nhập mật khẩu mới</label>
            <div className="input-wrapper password-wrapper">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Nhập lại mật khẩu mới</label>
            <div className="input-wrapper password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
              />
              <span>Ghi nhớ mật khẩu</span>
            </label>
          </div>

          <button
            type="submit"
            className="reset-password-button"
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
        <div className="contact-support-link">
          <span>Bạn gặp khó khăn?</span>
          <a href="/contact-support">Liên hệ bộ phận hỗ trợ</a>
        </div>
      <footer className="reset-password-footer">
        <p>© 2026 PETCAREХ Vietnam. Tất cả quyền được bảo lưu</p>
      </footer>
    </div>
  );
}
