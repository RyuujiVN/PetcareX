import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Form,
  List,
  Popover,
  Spin,
  Typography,
  message,
  notification,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPaw } from "react-icons/fa";
import { BsRobot } from "react-icons/bs";
import {
  FaRegCalendarCheck,
  FaRegCommentDots,
  FaRegThumbsUp,
} from "react-icons/fa6";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/client/AuthContext";
import { getClientInstance } from "../../../services/apiClient";
import { changePasswordApi } from "../../../services/authService";
import {
  loadClientNotifications,
  mapBeNotification,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
  resolveNotificationHref,
} from "../../../services/notificationService";
import LanguageSwitcher from "../../common/LanguageSwitcher/LanguageSwitcher";
import "./header.css";
import notifySocket from "../../../socket/notifySocket";

const WS_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api\/?$/, "");
const NOTIFICATION_SOCKET_URL = `${WS_BASE_URL}/notification`;

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

const isNotFoundNotificationError = (error) => {
  if (error?.response?.status === 404) return true;
  const normalizedMessage = String(error?.message || "").toLowerCase();
  return (
    normalizedMessage.includes("không tìm thấy thông báo") ||
    normalizedMessage.includes("khong tim thay thong bao")
  );
};

const formatNotificationTimeAgo = (dateValue, t) => {
  const createdAt = new Date(dateValue).getTime();
  if (Number.isNaN(createdAt)) return t("header.notifications.justNow");

  const diff = Date.now() - createdAt;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return t("header.notifications.justNow");
  if (diff < hour)
    return t("header.notifications.minutesAgo", {
      count: Math.floor(diff / minute),
    });
  if (diff < day)
    return t("header.notifications.hoursAgo", {
      count: Math.floor(diff / hour),
    });
  return t("header.notifications.daysAgo", { count: Math.floor(diff / day) });
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

  if (type === "ai-diagnosis") {
    return <FaRegCalendarCheck />;
  }

  return <FaRegCommentDots />;
};

function Header() {
  const { t, i18n } = useTranslation();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [, setTimeTick] = useState(0);

  // Force re-render every 30s so time-ago labels stay fresh
  useEffect(() => {
    const id = window.setInterval(() => setTimeTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notificationLastSyncedAt, setNotificationLastSyncedAt] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState(INITIAL_PASSWORD_ERRORS);
  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordVisible, setPasswordVisible] = useState(
    INITIAL_PASSWORD_VISIBILITY,
  );
  const accountMenuRef = useRef(null);
  const notificationRequestInFlightRef = useRef(false);
  const shownToastIdsRef = useRef(new Set());
  const navigate = useNavigate();
  const { login, logout, token, userProfile } = useAuth();
  const currentUserId = String(userProfile?.id || "");

  const notificationReadIdSet = useMemo(
    () =>
      new Set(
        notificationItems.filter((item) => item?.isRead).map((item) => item.id),
      ),
    [notificationItems],
  );

  const unreadNotificationCount = useMemo(
    () =>
      notificationItems.reduce(
        (count, item) => (item?.isRead ? count : count + 1),
        0,
      ),
    [notificationItems],
  );

  const filteredNotificationItems = useMemo(() => {
    if (notificationFilter === "unread") {
      return notificationItems.filter((item) => !item?.isRead);
    }

    return notificationItems;
  }, [notificationFilter, notificationItems]);

  const refreshNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!token || !currentUserId) return;
      if (notificationRequestInFlightRef.current) return;

      notificationRequestInFlightRef.current = true;
      setNotificationLoading(true);

      try {
        const payload = await loadClientNotifications({
          instance: getClientInstance(),
          limit: 120,
        });

        setNotificationItems(
          Array.isArray(payload?.items) ? payload.items : [],
        );
        setNotificationLastSyncedAt(new Date().toISOString());

        if (payload?.hasPartialFailure && !silent) {
          message.warning(t("header.notifications.partialLoadWarning"));
        }
      } catch (error) {
        if (!silent) {
          message.error(error?.message || t("header.notifications.loadError"));
        }
      } finally {
        setNotificationLoading(false);
        notificationRequestInFlightRef.current = false;
      }
    },
    [currentUserId, token],
  );

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      if (!notificationId) return;

      setNotificationItems((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item,
        ),
      );

      try {
        await markNotificationAsReadApi(getClientInstance(), notificationId);
      } catch (error) {
        if (!isNotFoundNotificationError(error)) {
          void refreshNotifications({ silent: true });
        }
      }
    },
    [refreshNotifications],
  );

  const markAllNotificationItemsAsRead = useCallback(async () => {
    if (unreadNotificationCount === 0) return;

    setNotificationItems((prev) =>
      prev.map((item) => ({ ...item, isRead: true })),
    );

    try {
      await markAllNotificationsAsReadApi(getClientInstance());
    } catch (error) {
      if (!isNotFoundNotificationError(error)) {
        void refreshNotifications({ silent: true });
      }
    }
  }, [refreshNotifications, unreadNotificationCount]);

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
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
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
      setNotificationLastSyncedAt("");
      return;
    }

    void refreshNotifications({ silent: true });
  }, [currentUserId, i18n.language, refreshNotifications, token]);

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

  // ── WebSocket: receive realtime notifications from BE (e.g. AI_DIAGNOSIS) ──
  useEffect(() => {
    if (!token || !currentUserId) return;

    notifySocket.connect();

    notifySocket.on("severSendNotification", (data) => {
      console.log("[Client Header]  Nhận notification từ BE:", data);
      const mapped = mapBeNotification(data);
      if (!mapped) return;

      if (!shownToastIdsRef.current.has(mapped.id)) {
        shownToastIdsRef.current.add(mapped.id);
        notificationApi.open({
          key: `client-live-notification-${mapped.id}`,
          message: mapped.title || t("header.notifications.title"),
          description: mapped.description || "",
          placement: "bottomRight",
          duration: 5,
          icon: <BsRobot  style={{ color: 'red' }}/>,
          onClick: () => handleClickNotificationItem(mapped),
        });
      }

      setNotificationItems((prev) => {
        if (prev.some((n) => n.id === mapped.id)) {
          return prev.map((item) =>
            item.id === mapped.id ? { ...item, ...mapped } : item,
          );
        }

        return [mapped, ...prev].slice(0, 120);
      });
    });

    return () => {
      notifySocket.removeAllListeners();
      notifySocket.disconnect();
    };
  }, [currentUserId, notificationApi, t, token]);

  const handleClickNotificationItem = useCallback(
    (item) => {
      if (!item?.id) return;

      void markNotificationAsRead(item.id);
      setIsNotificationOpen(false);

      const targetHref = resolveNotificationHref(item, "client");
      if (targetHref) {
        navigate(targetHref);
      }
    },
    [markNotificationAsRead, navigate],
  );

  const handleMarkAllNotificationsAsRead = () => {
    void markAllNotificationItemsAsRead();
  };

  const notificationPanel = (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <Typography.Title level={5} style={{ margin: 0 }}>
          {t("header.notifications.title")}
        </Typography.Title>

        <div className="notification-panel-actions">
          <Button size="small" onClick={() => void refreshNotifications()}>
            {t("header.notifications.refresh")}
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            disabled={unreadNotificationCount === 0}
            onClick={handleMarkAllNotificationsAsRead}
          >
            {t("header.notifications.markAsRead")}
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
            {t("header.notifications.all")}
          </Button>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            size="small"
            type={notificationFilter === "unread" ? "primary" : "default"}
            onClick={() => setNotificationFilter("unread")}
          >
            {t("header.notifications.unread")}
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
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("header.notifications.empty")}
            />
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
                      <span className="notification-item-title">
                        {item.title}
                      </span>
                      <span className="notification-item-description">
                        {item.description}
                      </span>
                      <span className="notification-item-time">
                        {formatNotificationTimeAgo(item.createdAt, t)}
                      </span>
                    </span>

                    {isUnread ? (
                      <span className="notification-unread-dot" />
                    ) : null}
                  </button>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      <Typography.Text className="notification-sync-text" type="secondary">
        {t("header.notifications.syncedAt")}:{" "}
        {formatSyncTime(notificationLastSyncedAt)}
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
      nextErrors.currentPassword = t(
        "header.passwordModal.validation.currentRequired",
      );
    }

    if (!values.newPassword) {
      nextErrors.newPassword = t("header.passwordModal.validation.newRequired");
    } else if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = t(
        "header.passwordModal.validation.newMinLength",
        { count: MIN_PASSWORD_LENGTH },
      );
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = t(
        "header.passwordModal.validation.confirmRequired",
      );
    } else if (values.confirmPassword !== values.newPassword) {
      nextErrors.confirmPassword = t(
        "header.passwordModal.validation.confirmMismatch",
      );
    }

    return nextErrors;
  };

  const handlePasswordFieldChange = (field, value) => {
    const nextForm = {
      ...passwordForm,
      [field]: value,
    };

    setPasswordForm(nextForm);

    if (
      passwordTouched[field] ||
      (field === "newPassword" && passwordTouched.confirmPassword)
    ) {
      const nextErrors = validatePasswordForm(nextForm);
      setPasswordErrors((prev) => ({
        ...prev,
        [field]: nextErrors[field],
        ...(field === "newPassword"
          ? { confirmPassword: nextErrors.confirmPassword }
          : {}),
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
      ...(field === "newPassword"
        ? { confirmPassword: nextErrors.confirmPassword }
        : {}),
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
      const response = await changePasswordApi(getClientInstance(), {
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      const newToken = response?.data?.accessToken;
      if (newToken) {
        login(newToken);
      }

      message.success(t("header.passwordModal.success"));
      closeChangePasswordPopup();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          t("header.passwordModal.error"),
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      {notificationContextHolder}
      <header className="petcare-header">
        <div className="header-container">
          <Link to="/" className="logo-section">
            <div className="logo-icon">
              {" "}
              <FaPaw size={28} color="var(--page-header-primary)" />
            </div>
            <span className="logo-text">{t("header.logo")}</span>
          </Link>

          <nav className="nav-menu">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              {t("header.nav.home")}
            </NavLink>
            <NavLink
              to="/appointments"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              {t("header.nav.appointments")}
            </NavLink>
            <NavLink
              to="/listPetMedicalRecords"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              {t("header.nav.myPets")}
            </NavLink>
            <NavLink
              to="/forum"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              {t("header.nav.forum")}
            </NavLink>
            <NavLink
              to="/chatbot"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              {t("header.nav.chatbot")}
            </NavLink>
          </nav>

          <div className="auth-section">
            <LanguageSwitcher />
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
                    aria-label={t("header.notifications.openAria")}
                  >
                    <Badge count={unreadNotificationCount} overflowCount={99}>
                      <IoMdNotificationsOutline size={23} />
                    </Badge>
                  </button>
                </Popover>

                <div className="user-profile" onClick={handleAccountClick}>
                  <div className="user-avatar">
                    <img
                      src={userProfile?.avatarUrl || "/bs1.png"}
                      alt={t("header.user.avatarAlt")}
                    />
                  </div>
                  <span className="user-name">
                    {userProfile?.fullName || t("header.user.defaultName")}
                  </span>
                  <span
                    className={`dropdown-arrow ${isAccountDropdownOpen ? "open" : ""}`}
                  >
                    ▼
                  </span>
                </div>

                {isAccountDropdownOpen && (
                  <div className="user-dropdown">
                    <Link to="/user/profile" className="dropdown-item">
                      <span className="icon">
                        <UserOutlined />
                      </span>
                      <span>{t("header.user.profile")}</span>
                    </Link>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={openChangePasswordPopup}
                    >
                      <span className="icon">
                        <LockOutlined />
                      </span>
                      <span>{t("header.user.changePassword")}</span>
                    </button>
                    <div
                      className="dropdown-item logout"
                      onClick={() => {
                        logout();
                        navigate("/login");
                      }}
                    >
                      <span className="icon">
                        <LogoutOutlined />
                      </span>
                      <span>{t("header.user.logout")}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/register" className="btns register-btn">
                  {t("header.auth.register")}
                </Link>
                <Link to="/login" className="btns login-btn">
                  {t("header.auth.login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {isChangePasswordOpen && (
        <div
          className="password-modal-overlay"
          onClick={closeChangePasswordPopup}
        >
          <div
            className="password-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="password-modal-close"
              onClick={closeChangePasswordPopup}
              aria-label={t("header.passwordModal.closeAria")}
            >
              ×
            </button>

            <h3 className="password-modal-title">
              {t("header.passwordModal.title")}
            </h3>

            <form
              className="password-form"
              onSubmit={handleSubmitChangePassword}
            >
              <div className="password-form-group">
                <label htmlFor="current-password">
                  {t("header.passwordModal.currentPassword")}
                </label>
                <div className="password-input-wrap">
                  <input
                    id="current-password"
                    type={passwordVisible.currentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      handlePasswordFieldChange(
                        "currentPassword",
                        event.target.value,
                      )
                    }
                    onBlur={() => handlePasswordFieldBlur("currentPassword")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-visibility-btn"
                    onClick={() => togglePasswordVisibility("currentPassword")}
                  >
                    {passwordVisible.currentPassword ? (
                      <EyeInvisibleOutlined />
                    ) : (
                      <EyeOutlined />
                    )}
                  </button>
                </div>
                {passwordTouched.currentPassword &&
                passwordErrors.currentPassword ? (
                  <p className="password-field-error">
                    {passwordErrors.currentPassword}
                  </p>
                ) : null}
              </div>

              <div className="password-form-group">
                <label htmlFor="new-password">
                  {t("header.passwordModal.newPassword")}
                </label>
                <div className="password-input-wrap">
                  <input
                    id="new-password"
                    type={passwordVisible.newPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      handlePasswordFieldChange(
                        "newPassword",
                        event.target.value,
                      )
                    }
                    onBlur={() => handlePasswordFieldBlur("newPassword")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-visibility-btn"
                    onClick={() => togglePasswordVisibility("newPassword")}
                  >
                    {passwordVisible.newPassword ? (
                      <EyeInvisibleOutlined />
                    ) : (
                      <EyeOutlined />
                    )}
                  </button>
                </div>
                {passwordTouched.newPassword && passwordErrors.newPassword ? (
                  <p className="password-field-error">
                    {passwordErrors.newPassword}
                  </p>
                ) : null}
              </div>

              <div className="password-form-group">
                <label htmlFor="confirm-password">
                  {t("header.passwordModal.confirmNewPassword")}
                </label>
                <div className="password-input-wrap">
                  <input
                    id="confirm-password"
                    type={passwordVisible.confirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      handlePasswordFieldChange(
                        "confirmPassword",
                        event.target.value,
                      )
                    }
                    onBlur={() => handlePasswordFieldBlur("confirmPassword")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-visibility-btn"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                  >
                    {passwordVisible.confirmPassword ? (
                      <EyeInvisibleOutlined />
                    ) : (
                      <EyeOutlined />
                    )}
                  </button>
                </div>
                {passwordTouched.confirmPassword &&
                passwordErrors.confirmPassword ? (
                  <p className="password-field-error">
                    {passwordErrors.confirmPassword}
                  </p>
                ) : null}
              </div>

              <div className="password-modal-actions">
                <button
                  type="button"
                  className="password-cancel-btn"
                  onClick={closeChangePasswordPopup}
                  disabled={changingPassword}
                >
                  {t("header.passwordModal.cancel")}
                </button>
                <button
                  type="submit"
                  className="password-submit-btn"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? t("header.passwordModal.submitting")
                    : t("header.passwordModal.submit")}
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
