import { useState } from "react";
import { FaPaw } from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/adminClinic/AuthContext";
import "./header.module.css";

function Header() {
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const { logout, token, userProfile } = useAuth();

    const handleAccountClick = () => {
        setIsAccountDropdownOpen(!isAccountDropdownOpen);
    };

    return (
        <header className="petcare-header">
            <div className="header-container">
                <Link to="/admin/home" className="logo-section">
                    <div className="logo-icon"> <FaPaw size={28} color="var(--page-header-primary)" /></div>
                    <span className="logo-text">PetCareX</span>
                </Link>

                <nav className="nav-menu">
                    <NavLink 
                        to="/admin/home" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Trang chủ
                    </NavLink>
                    <NavLink 
                        to="/admin/clinic/appointments" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Lịch hẹn
                    </NavLink>
                    <NavLink 
                        to="/admin/clinic/medical-records" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Hồ sơ y tế
                    </NavLink>
                    <NavLink 
                        to="/admin/clinic/appointments" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Diễn đàn
                    </NavLink>
                    <NavLink 
                        to="/admin/clinic/appointments" 
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
                                    <Link to="/admin/clinic/profile" className="dropdown-item">
                                        <span className="icon">👤</span>
                                        <span>Trang cá nhân</span>
                                    </Link>
                                    <Link to="/admin/clinic/medical-records" className="dropdown-item">
                                        <span className="icon">🐶</span>
                                        <span>Thú cưng của tôi</span>
                                    </Link>
                                    <Link to="/admin/clinic/appointments" className="dropdown-item">
                                        <span className="icon">📅</span>
                                        <span>Lịch hẹn của tôi</span>
                                    </Link>
                                    <hr className="dropdown-divider" />
                                    <Link to="/admin/home" className="dropdown-item">
                                        <span className="icon">⚙️</span>
                                        <span>Cài đặt</span>
                                    </Link>
                                    <div 
                                        className="dropdown-item logout"
                                        onClick={() => {
                                            logout();
                                            navigate("/admin/login");
                                        }}
                                    >
                                        <span className="icon">🚪</span>
                                        <span>Đăng xuất</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/admin/register" className="btns register-btn">
                                Đăng ký
                            </Link>
                            <Link to="/admin/login" className="btns login-btn">
                                Đăng nhập
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;

