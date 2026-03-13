import React, { useState } from "react";
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
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to="/" className="group flex items-center gap-2 text-slate-900">
                    <FaPaw size={24} color="#13ECDA" />
                    <span className="text-xl font-bold tracking-tight transition group-hover:text-cyan-600">PetCareX</span>
                </Link>

                <nav className="hidden items-center gap-2 md:flex">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-cyan-50 text-cyan-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                        }
                    >
                        Trang chủ
                    </NavLink>
                    <NavLink
                        to="/lich-hen"
                        className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-cyan-50 text-cyan-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                        }
                    >
                        Lịch hẹn
                    </NavLink>
                    <NavLink
                        to="/phong-kham"
                        className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-cyan-50 text-cyan-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                        }
                    >
                        Phòng khám
                    </NavLink>
                    <NavLink
                        to="/dien-dan"
                        className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-cyan-50 text-cyan-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                        }
                    >
                        Diễn đàn
                    </NavLink>
                    <NavLink
                        to="/hoi-dap"
                        className={({ isActive }) =>
                            `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-cyan-50 text-cyan-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                        }
                    >
                        Hỏi đáp
                    </NavLink>
                </nav>

                <div>
                    {token ? (
                        <div className="relative">
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm hover:bg-slate-50"
                                onClick={handleAccountClick}
                            >
                                <img src="/user-avatar.png" alt="User Avatar" className="h-8 w-8 rounded-full object-cover" />
                                <span className="hidden text-sm font-medium text-slate-700 sm:inline">Công Thành</span>
                                <span className={`text-xs text-slate-500 transition ${isAccountDropdownOpen ? "rotate-180" : ""}`}>▼</span>
                            </button>

                            {isAccountDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                    <Link to="/my-profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <span>👤</span>
                                        <span>Trang cá nhân</span>
                                    </Link>
                                    <Link to="/my-pets" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <span>🐶</span>
                                        <span>Thú cưng của tôi</span>
                                    </Link>
                                    <Link to="/appointments" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <span>📅</span>
                                        <span>Lịch hẹn của tôi</span>
                                    </Link>
                                    <div className="my-1 border-t border-slate-100" />
                                    <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <span>⚙️</span>
                                        <span>Cài đặt</span>
                                    </Link>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                                        onClick={() => {
                                            logout();
                                            navigate("/login");
                                        }}
                                    >
                                        <span>🚪</span>
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/register" className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-medium text-cyan-600 hover:bg-cyan-50">
                                Đăng ký
                            </Link>
                            <Link to="/login" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600">
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
