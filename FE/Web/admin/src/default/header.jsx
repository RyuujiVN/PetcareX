import React, { useState } from "react";
import "./default.css";
import { Link, NavLink } from "react-router-dom";

function Header() {
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

    const handleAccountClick = () => {
        setIsAccountDropdownOpen(!isAccountDropdownOpen);
    };

    return (
        <header className="petcare-header">
            <div className="header-container">
                {/* Logo Section */}
                <Link to="/" className="logo-section">
                    <div className="logo-icon">🐾</div>
                    <span className="logo-text">PetCar</span>
                </Link>

                {/* Navigation Menu */}
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

                {/* User Profile Section */}
                <div className="user-section">
                    <div className="user-profile" onClick={handleAccountClick}>
                        <div className="user-avatar">
                            <img src={process.env.PUBLIC_URL + "/user-avatar.png"} alt="User Avatar" />
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
                            <Link to="/logout" className="dropdown-item logout">
                                <span className="icon">🚪</span>
                                <span>Đăng xuất</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
