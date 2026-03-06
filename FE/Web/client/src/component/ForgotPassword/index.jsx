import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import instance from '../../api/instance';
import { FaPaw } from "react-icons/fa";
import { MdLockReset } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    setLoading(true);

    try {
      instance.post('/auth/forgot-password', { email })
      .then(response => {
        if (!response.ok) {
          throw new Error('Không tìm thấy tài khoản với email này');
        }
        return response.json();
      })
      .then(() => {
        setSuccess('Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn');
      });

      setEmail('');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-header-bar">
        <div className="header-left">
           <FaPaw size={28} color="#13ECDA" />  
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="forgot-password-card">
        <div className="lock-icon-section">
            <MdLockReset size={70} color="#13ECDA"/>
        </div>

        <div className="forgot-password-header">
          <h1 className="forgot-password-title">Quên mật khẩu?</h1>
          <p className="forgot-password-subtitle">Đừng lo lắng! Nhập email liên kết với tài khoản của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Địa chỉ Email</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="forgot-password-button"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>

        <div className="back-to-login">
          <button type="button" className="back-login-link" onClick={handleGoBack}>
           <IoArrowBack size={100} color="#13ECDA"/>
            <span>Quay lại Đăng nhập</span>
          </button>
        </div>
        <div className="contact-support-link">
          <span>Bạn gặp khó khăn?</span>
          <a href="/contact-support">Liên hệ bộ phận hỗ trợ</a>
        </div>
      </div>

      <footer className="forgot-password-footer">
        <p>© 2026 PETCAREX INC. BẢO MẬT THÔNG TIN CỦA BẠN LÀ UU TIÊN CỦA CHÚNG TÔI</p>
      </footer>
    </div>
  );
}
