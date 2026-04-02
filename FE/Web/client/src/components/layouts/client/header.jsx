import { EyeInvisibleOutlined, EyeOutlined, LockOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useState } from "react";
import { FaPaw } from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { changePasswordApi } from "../../../data/client/api/auth";
import { useAuth } from "../../../hooks/client/AuthContext";
import "./header.css";

const MIN_PASSWORD_LENGTH = 8;

const INITIAL_PASSWORD_FORM = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

const INITIAL_PASSWORD_ERRORS = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

const INITIAL_PASSWORD_VISIBILITY = {
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
};

function Header() {
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD_FORM);
    const [passwordErrors, setPasswordErrors] = useState(INITIAL_PASSWORD_ERRORS);
    const [passwordTouched, setPasswordTouched] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });
    const [passwordVisible, setPasswordVisible] = useState(INITIAL_PASSWORD_VISIBILITY);
    const navigate = useNavigate();
    const { logout, token, userProfile } = useAuth();

    const handleAccountClick = () => {
        setIsAccountDropdownOpen(!isAccountDropdownOpen);
    };

    const resetPasswordPopup = () => {
        setPasswordForm(INITIAL_PASSWORD_FORM);
        setPasswordErrors(INITIAL_PASSWORD_ERRORS);
        setPasswordTouched({
            currentPassword: false,
            newPassword: false,
            confirmPassword: false,
        });
        setPasswordVisible(INITIAL_PASSWORD_VISIBILITY);
    };

    const closeChangePasswordPopup = () => {
        setIsChangePasswordOpen(false);
        resetPasswordPopup();
    };

    const openChangePasswordPopup = () => {
        setIsAccountDropdownOpen(false);
        resetPasswordPopup();
        setIsChangePasswordOpen(true);
    };

    const validatePasswordForm = (values) => {
        const nextErrors = {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        };

        if (!values.currentPassword) {
            nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
        }

        if (!values.newPassword) {
            nextErrors.newPassword = "Vui lòng nhập mật khẩu mới";
        } else if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
            nextErrors.newPassword = `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
        }

        if (!values.confirmPassword) {
            nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
        } else if (values.confirmPassword !== values.newPassword) {
            nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        return nextErrors;
    };

    const handlePasswordFieldChange = (field, value) => {
        const nextForm = {
            ...passwordForm,
            [field]: value,
        };

        setPasswordForm(nextForm);

        if (passwordTouched[field] || (field === "newPassword" && passwordTouched.confirmPassword)) {
            const nextErrors = validatePasswordForm(nextForm);
            setPasswordErrors((prev) => ({
                ...prev,
                [field]: nextErrors[field],
                ...(field === "newPassword" ? { confirmPassword: nextErrors.confirmPassword } : {}),
            }));
        }
    };

    const handlePasswordFieldBlur = (field) => {
        const nextTouched = {
            ...passwordTouched,
            [field]: true,
        };

        setPasswordTouched(nextTouched);

        const nextErrors = validatePasswordForm(passwordForm);
        setPasswordErrors((prev) => ({
            ...prev,
            [field]: nextErrors[field],
            ...(field === "newPassword" ? { confirmPassword: nextErrors.confirmPassword } : {}),
        }));
    };

    const togglePasswordVisibility = (field) => {
        setPasswordVisible((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmitChangePassword = async (event) => {
        event.preventDefault();

        if (changingPassword) {
            return;
        }

        const nextErrors = validatePasswordForm(passwordForm);
        setPasswordTouched({
            currentPassword: true,
            newPassword: true,
            confirmPassword: true,
        });
        setPasswordErrors(nextErrors);

        if (Object.values(nextErrors).some(Boolean)) {
            return;
        }

        try {
            setChangingPassword(true);
            await changePasswordApi({
                oldPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            });
            message.success("Đổi mật khẩu thành công");
            closeChangePasswordPopup();
        } catch (error) {
            message.error(error?.response?.data?.message || error?.message || "Không thể đổi mật khẩu");
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <>
        <header className="petcare-header">
            <div className="header-container">
                <Link to="/" className="logo-section">
                    <div className="logo-icon"> <FaPaw size={28} color="var(--page-header-primary)" /></div>
                    <span className="logo-text">PetCareX</span>
                </Link>

                <nav className="nav-menu">
                    <NavLink 
                        to="/" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Trang chủ
                    </NavLink>
                    <NavLink 
                        to="/appointments" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Lịch hẹn
                    </NavLink>
                    <NavLink 
                        to="/listPetMedicalRecords" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Thú cưng của tôi
                    </NavLink>
                    <NavLink 
                        to="/forum" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Diễn đàn
                    </NavLink>
                    <NavLink 
                        to="/chatbot" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Chat Bot AI
                    </NavLink>
                </nav>

                <div className="auth-section">
                    {token ? (
                        <div className="user-section">
                            <div className="user-profile" onClick={handleAccountClick}>
                                <div className="user-avatar">
                                    <img src={userProfile?.avatarUrl || '/bs1.png'} alt="User Avatar" />
                                </div>
                                <span className="user-name">{userProfile?.fullName || 'Người dùng'}</span>
                                <span className={`dropdown-arrow ${isAccountDropdownOpen ? "open" : ""}`}>▼</span>
                            </div>

                            {isAccountDropdownOpen && (
                                <div className="user-dropdown">
                                    <Link to="/user/profile" className="dropdown-item">
                                        <span className="icon"><UserOutlined /></span>
                                        <span>Trang cá nhân</span>
                                    </Link>
                                    <button
                                        type="button"
                                        className="dropdown-item"
                                        onClick={openChangePasswordPopup}
                                    >
                                        <span className="icon"><LockOutlined /></span>
                                        <span>Đổi mật khẩu</span>
                                    </button>
                                    <div 
                                        className="dropdown-item logout"
                                        onClick={() => {
                                            logout();
                                            navigate("/login");
                                        }}
                                    >
                                        <span className="icon"><LogoutOutlined /></span>
                                        <span>Đăng xuất</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/register" className="btns register-btn">
                                Đăng ký
                            </Link>
                            <Link to="/login" className="btns login-btn">
                                Đăng nhập
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {isChangePasswordOpen && (
            <div className="password-modal-overlay" onClick={closeChangePasswordPopup}>
                <div className="password-modal" onClick={(event) => event.stopPropagation()}>
                    <button
                        type="button"
                        className="password-modal-close"
                        onClick={closeChangePasswordPopup}
                        aria-label="Đóng popup đổi mật khẩu"
                    >
                        ×
                    </button>

                    <h3 className="password-modal-title">Đổi mật khẩu</h3>

                    <form className="password-form" onSubmit={handleSubmitChangePassword}>
                        <div className="password-form-group">
                            <label htmlFor="current-password">Mật khẩu hiện tại</label>
                            <div className="password-input-wrap">
                                <input
                                    id="current-password"
                                    type={passwordVisible.currentPassword ? "text" : "password"}
                                    value={passwordForm.currentPassword}
                                    onChange={(event) => handlePasswordFieldChange("currentPassword", event.target.value)}
                                    onBlur={() => handlePasswordFieldBlur("currentPassword")}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-visibility-btn"
                                    onClick={() => togglePasswordVisibility("currentPassword")}
                                >
                                    {passwordVisible.currentPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </button>
                            </div>
                            {passwordTouched.currentPassword && passwordErrors.currentPassword ? (
                                <p className="password-field-error">{passwordErrors.currentPassword}</p>
                            ) : null}
                        </div>

                        <div className="password-form-group">
                            <label htmlFor="new-password">Mật khẩu mới</label>
                            <div className="password-input-wrap">
                                <input
                                    id="new-password"
                                    type={passwordVisible.newPassword ? "text" : "password"}
                                    value={passwordForm.newPassword}
                                    onChange={(event) => handlePasswordFieldChange("newPassword", event.target.value)}
                                    onBlur={() => handlePasswordFieldBlur("newPassword")}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-visibility-btn"
                                    onClick={() => togglePasswordVisibility("newPassword")}
                                >
                                    {passwordVisible.newPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </button>
                            </div>
                            {passwordTouched.newPassword && passwordErrors.newPassword ? (
                                <p className="password-field-error">{passwordErrors.newPassword}</p>
                            ) : null}
                        </div>

                        <div className="password-form-group">
                            <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                            <div className="password-input-wrap">
                                <input
                                    id="confirm-password"
                                    type={passwordVisible.confirmPassword ? "text" : "password"}
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) => handlePasswordFieldChange("confirmPassword", event.target.value)}
                                    onBlur={() => handlePasswordFieldBlur("confirmPassword")}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-visibility-btn"
                                    onClick={() => togglePasswordVisibility("confirmPassword")}
                                >
                                    {passwordVisible.confirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                </button>
                            </div>
                            {passwordTouched.confirmPassword && passwordErrors.confirmPassword ? (
                                <p className="password-field-error">{passwordErrors.confirmPassword}</p>
                            ) : null}
                        </div>

                        <div className="password-modal-actions">
                            <button
                                type="button"
                                className="password-cancel-btn"
                                onClick={closeChangePasswordPopup}
                                disabled={changingPassword}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="password-submit-btn"
                                disabled={changingPassword}
                            >
                                {changingPassword ? "Đang đổi mật khẩu..." : "Xác nhận"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}

export default Header;
