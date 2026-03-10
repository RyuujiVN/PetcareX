import React, { useState } from "react";
import "./header.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaPaw } from "react-icons/fa";

function Header() {
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const { logout, token } = useAuth();

    const handleAccountClick = () => {
        setIsAccountDropdownOpen(!isAccountDropdownOpen);
    };

    return (
        <header className="petcare-header">
            <div className="header-container">
                <Link to="/" className="logo-section">
                    <div className="logo-icon"> <FaPaw size={28} color="#13ECDA" /></div>
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
                        to="/lich-hen" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Lịch hẹn
                    </NavLink>
                    <NavLink 
                        to="/phong-kham" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Phòng khám
                    </NavLink>
                    <NavLink 
                        to="/dien-dan" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Diễn đàn
                    </NavLink>
                    <NavLink 
                        to="/hoi-dap" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                    >
                        Hỏi đáp
                    </NavLink>
                </nav>

                <div className="auth-section">
                    {token ? (
                        <div className="user-section">
                            <div className="user-profile" onClick={handleAccountClick}>
                                <div className="user-avatar">
                                    <img src="/user-avatar.png" alt="User Avatar" />
                                </div>
                                <span className="user-name">Công Thành</span>
                                <span className={`dropdown-arrow ${isAccountDropdownOpen ? "open" : ""}`}>▼</span>
                            </div>

                            {isAccountDropdownOpen && (
                                <div className="user-dropdown">
                                    <Link to="/my-profile" className="dropdown-item">
                                        <span className="icon">👤</span>
                                        <span>Trang cá nhân</span>
                                    </Link>
                                    <Link to="/my-pets" className="dropdown-item">
                                        <span className="icon">🐶</span>
                                        <span>Thú cưng của tôi</span>
                                    </Link>
                                    <Link to="/appointments" className="dropdown-item">
                                        <span className="icon">📅</span>
                                        <span>Lịch hẹn của tôi</span>
                                    </Link>
                                    <hr className="dropdown-divider" />
                                    <Link to="/settings" className="dropdown-item">
                                        <span className="icon">⚙️</span>
                                        <span>Cài đặt</span>
                                    </Link>
                                    <div 
                                        className="dropdown-item logout"
                                        onClick={() => {
                                            logout();
                                            navigate("/login");
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
                            <Link to="/register" className="btn register-btn">
                                Đăng ký
                            </Link>
                            <Link to="/login" className="btn login-btn">
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
