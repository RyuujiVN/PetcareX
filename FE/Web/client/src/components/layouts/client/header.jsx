import { EyeInvisibleOutlined, EyeOutlined, LockOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Empty, Form, List, Popover, Spin, Typography, message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaPaw } from "react-icons/fa";
import { FaRegCalendarCheck, FaRegCommentDots, FaRegThumbsUp } from "react-icons/fa6";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { changePasswordApi } from "../../../data/client/api/auth";
import { loadClientNotifications } from "../../../data/client/api/notificationApi";
import { useAuth } from "../../../hooks/client/AuthContext";
import "./header.css";

const MIN_PASSWORD_LENGTH = 8;
const NOTIFICATION_READ_STORAGE_KEY = "client_header_notification_read_ids";
const NOTIFICATION_LIKE_SNAPSHOT_STORAGE_KEY = "client_header_notification_like_snapshot";

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

const getScopedStorageKey = (baseKey, userId) => `${baseKey}:${userId}`;

const readStorageJson = (key, fallbackValue) => {
    if (!key) return fallbackValue;

    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallbackValue;
        return JSON.parse(raw);
    } catch {
        return fallbackValue;
    }
};

const formatNotificationTimeAgo = (dateValue) => {
    const createdAt = new Date(dateValue).getTime();
    if (Number.isNaN(createdAt)) return "Vừa xong";

    const diff = Date.now() - createdAt;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return "Vừa xong";
    if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
    if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
    return `${Math.floor(diff / day)} ngày trước`;
};

const formatSyncTime = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const renderNotificationIcon = (type) => {
    if (type === "appointment") {
        return <FaRegCalendarCheck />;
    }

    if (type === "forum-like") {
        return <FaRegThumbsUp />;
    }

    return <FaRegCommentDots />;
};

function Header() {
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationItems, setNotificationItems] = useState([]);
    const [notificationFilter, setNotificationFilter] = useState("all");
    const [notificationReadIds, setNotificationReadIds] = useState([]);
    const [notificationLastSyncedAt, setNotificationLastSyncedAt] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD_FORM);
    const [passwordErrors, setPasswordErrors] = useState(INITIAL_PASSWORD_ERRORS);
    const [passwordTouched, setPasswordTouched] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });
    const [passwordVisible, setPasswordVisible] = useState(INITIAL_PASSWORD_VISIBILITY);
    const accountMenuRef = useRef(null);
    const likeSnapshotRef = useRef({});
    const notificationRequestInFlightRef = useRef(false);
    const navigate = useNavigate();
    const { login, logout, token, userProfile } = useAuth();
    const currentUserId = String(userProfile?.id || "");

    const notificationReadIdSet = useMemo(() => new Set(notificationReadIds), [notificationReadIds]);

    const unreadNotificationCount = useMemo(
        () => notificationItems.reduce((count, item) => (notificationReadIdSet.has(item.id) ? count : count + 1), 0),
        [notificationItems, notificationReadIdSet],
    );

    const filteredNotificationItems = useMemo(() => {
        if (notificationFilter === "unread") {
            return notificationItems.filter((item) => !notificationReadIdSet.has(item.id));
        }

        return notificationItems;
    }, [notificationFilter, notificationItems, notificationReadIdSet]);

    const persistReadNotificationIds = useCallback(
        (nextReadIds) => {
            if (!currentUserId) return;

            const key = getScopedStorageKey(NOTIFICATION_READ_STORAGE_KEY, currentUserId);
            localStorage.setItem(key, JSON.stringify(nextReadIds.slice(-500)));
        },
        [currentUserId],
    );

    const persistLikeSnapshot = useCallback(
        (snapshot) => {
            if (!currentUserId) return;

            const key = getScopedStorageKey(NOTIFICATION_LIKE_SNAPSHOT_STORAGE_KEY, currentUserId);
            localStorage.setItem(key, JSON.stringify(snapshot || {}));
        },
        [currentUserId],
    );

    const markNotificationsAsRead = useCallback(
        (ids = []) => {
            if (!Array.isArray(ids) || ids.length === 0) return;

            setNotificationReadIds((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => {
                    if (id) {
                        next.add(id);
                    }
                });

                const nextList = Array.from(next);
                persistReadNotificationIds(nextList);
                return nextList;
            });
        },
        [persistReadNotificationIds],
    );

    const refreshNotifications = useCallback(
        async ({ silent = false } = {}) => {
            if (!token || !currentUserId) return;
            if (notificationRequestInFlightRef.current) return;

            notificationRequestInFlightRef.current = true;
            setNotificationLoading(true);

            try {
                const payload = await loadClientNotifications({
                    userId: currentUserId,
                    previousLikeSnapshot: likeSnapshotRef.current,
                });

                setNotificationItems(Array.isArray(payload?.items) ? payload.items : []);

                likeSnapshotRef.current = payload?.nextLikeSnapshot || {};
                persistLikeSnapshot(likeSnapshotRef.current);
                setNotificationLastSyncedAt(new Date().toISOString());

                if (payload?.hasPartialFailure && !silent) {
                    message.warning("Đã tải một phần thông báo, vui lòng thử lại sau");
                }
            } catch (error) {
                if (!silent) {
                    message.error(error?.message || "Không thể tải danh sách thông báo");
                }
            } finally {
                setNotificationLoading(false);
                notificationRequestInFlightRef.current = false;
            }
        },
        [currentUserId, persistLikeSnapshot, token],
    );

    const handleAccountClick = () => {
        setIsNotificationOpen(false);
        setIsAccountDropdownOpen((prev) => !prev);
    };

    const handleNotificationOpenChange = (nextOpen) => {
        setIsNotificationOpen(nextOpen);

        if (nextOpen) {
            setIsAccountDropdownOpen(false);
            void refreshNotifications({ silent: true });
        }
    };

    useEffect(() => {
        if (!isAccountDropdownOpen) {
            return;
        }

        const handleOutsideClick = (event) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
                setIsAccountDropdownOpen(false);
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === "Escape") {
                setIsAccountDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);
        document.addEventListener("keydown", handleEscapeKey);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [isAccountDropdownOpen]);

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
        setIsNotificationOpen(false);
        resetPasswordPopup();
        setIsChangePasswordOpen(true);
    };

    useEffect(() => {
        if (!token || !currentUserId) {
            setNotificationItems([]);
            setNotificationReadIds([]);
            setNotificationLastSyncedAt("");
            likeSnapshotRef.current = {};
            return;
        }

        const readKey = getScopedStorageKey(NOTIFICATION_READ_STORAGE_KEY, currentUserId);
        const likeSnapshotKey = getScopedStorageKey(NOTIFICATION_LIKE_SNAPSHOT_STORAGE_KEY, currentUserId);

        const storedReadIds = readStorageJson(readKey, []);
        const storedLikeSnapshot = readStorageJson(likeSnapshotKey, {});

        setNotificationReadIds(Array.isArray(storedReadIds) ? storedReadIds : []);
        likeSnapshotRef.current =
            storedLikeSnapshot && typeof storedLikeSnapshot === "object" ? storedLikeSnapshot : {};

        void refreshNotifications({ silent: true });
    }, [currentUserId, refreshNotifications, token]);

    useEffect(() => {
        if (!token || !currentUserId) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            void refreshNotifications({ silent: true });
        }, 60000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshNotifications({ silent: true });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [currentUserId, refreshNotifications, token]);

    const handleClickNotificationItem = (item) => {
        if (!item?.id) return;

        markNotificationsAsRead([item.id]);
        setIsNotificationOpen(false);

        if (item.href) {
            navigate(item.href);
        }
    };

    const handleMarkAllNotificationsAsRead = () => {
        markNotificationsAsRead(notificationItems.map((item) => item.id));
    };

    const notificationPanel = (
        <div className="notification-panel">
            <div className="notification-panel-header">
                <Typography.Title level={5} style={{ margin: 0 }}>
                    Thông báo
                </Typography.Title>

                <div className="notification-panel-actions">
                    <Button size="small" onClick={() => void refreshNotifications()}>
                        Làm mới
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        ghost
                        disabled={unreadNotificationCount === 0}
                        onClick={handleMarkAllNotificationsAsRead}
                    >
                        Đánh dấu đã đọc
                    </Button>
                </div>
            </div>

            <Form layout="inline" className="notification-filter-form">
                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        size="small"
                        type={notificationFilter === "all" ? "primary" : "default"}
                        onClick={() => setNotificationFilter("all")}
                    >
                        Tất cả
                    </Button>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        size="small"
                        type={notificationFilter === "unread" ? "primary" : "default"}
                        onClick={() => setNotificationFilter("unread")}
                    >
                        Chưa đọc
                    </Button>
                </Form.Item>
            </Form>

            <div className="notification-panel-content">
                {notificationLoading ? (
                    <div className="notification-panel-loading">
                        <Spin />
                    </div>
                ) : filteredNotificationItems.length === 0 ? (
                    <div className="notification-panel-empty">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
                    </div>
                ) : (
                    <List
                        className="notification-list"
                        dataSource={filteredNotificationItems}
                        renderItem={(item) => {
                            const isUnread = !notificationReadIdSet.has(item.id);

                            return (
                                <List.Item className="notification-list-item">
                                    <button
                                        type="button"
                                        className={`notification-item ${isUnread ? "unread" : ""}`}
                                        onClick={() => handleClickNotificationItem(item)}
                                    >
                                        {item.avatarUrl ? (
                                            <Avatar src={item.avatarUrl} size={42} />
                                        ) : (
                                            <span className={`notification-type-icon ${item.type}`}>
                                                {renderNotificationIcon(item.type)}
                                            </span>
                                        )}

                                        <span className="notification-item-text">
                                            <span className="notification-item-title">{item.title}</span>
                                            <span className="notification-item-description">{item.description}</span>
                                            <span className="notification-item-time">{formatNotificationTimeAgo(item.createdAt)}</span>
                                        </span>

                                        {isUnread ? <span className="notification-unread-dot" /> : null}
                                    </button>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </div>

            <Typography.Text className="notification-sync-text" type="secondary">
                Cập nhật lúc: {formatSyncTime(notificationLastSyncedAt)}
            </Typography.Text>
        </div>
    );

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
            const response = await changePasswordApi({
                oldPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            });

            const newToken = response?.data?.accessToken;
            if (newToken) {
                login(newToken);
            }

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
                        <div className="user-section" ref={accountMenuRef}>
                            <Popover
                                content={notificationPanel}
                                trigger="click"
                                placement="bottomRight"
                                open={isNotificationOpen}
                                onOpenChange={handleNotificationOpenChange}
                                overlayClassName="header-notification-popover"
                            >
                                <button
                                    type="button"
                                    className="notification-bell-btn"
                                    aria-label="Mở danh sách thông báo"
                                >
                                    <Badge count={unreadNotificationCount} overflowCount={99}>
                                        <IoMdNotificationsOutline size={23} />
                                    </Badge>
                                </button>
                            </Popover>

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
