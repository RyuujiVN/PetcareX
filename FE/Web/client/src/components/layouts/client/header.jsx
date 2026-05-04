import {
    EyeInvisibleOutlined,
    EyeOutlined,
    LockOutlined,
    LogoutOutlined,
    ScheduleOutlined,
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
import { BsRobot } from "react-icons/bs";
import {
    FaRegCommentDots,
    FaRegThumbsUp,
    FaReply,
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
import notifySocket from "../../../socket/notifySocket";
import LanguageSwitcher from "../../common/LanguageSwitcher/LanguageSwitcher";
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

const isNotFoundNotificationError = (error) => {
  if (error?.response?.status === 404) return true;
  const normalizedMessage = String(error?.message || "").toLowerCase();
  return (
    normalizedMessage.includes("không tìm thấy thông báo") ||
    normalizedMessage.includes("khong tim thay thong bao")
  );
};

const emitPostLikedRealtime = (notificationItem) => {
  const postId = String(
    notificationItem?.postId || notificationItem?.target?.postId || "",
  ).trim();

  if (!postId || typeof window === "undefined") return;

  const detail = {
    postId,
    notificationId: notificationItem?.id || null,
  };

  window.dispatchEvent(new CustomEvent("notif:postLiked", { detail }));
  window.dispatchEvent(new CustomEvent("refreshPost", { detail }));
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

const resolveForumActionType = (notificationItem) => {
  const type = String(notificationItem?.type || "").toLowerCase();
  const beType = String(notificationItem?.beType || "").toUpperCase();

  if (type.includes("like") || beType.includes("LIKE")) return "like";
  if (type.includes("reply") || beType.includes("REPLY")) return "reply";
  if (type.includes("comment") || beType.includes("COMMENT")) return "comment";

  return null;
};

const getForumActionIcon = (actionType) => {
  if (actionType === "like") {
    return <FaRegThumbsUp size={11} color="#ffffff" />;
  }

  if (actionType === "reply") {
    return <FaReply size={10} color="#ffffff" />;
  }

  return <FaRegCommentDots size={11} color="#ffffff" />;
};

const getForumActionBadgeColor = (actionType) => {
  if (actionType === "like") return "#1877f2";
  return "#42b883";
};

const getNotificationIcon = (notificationItem) => {
  const type = String(notificationItem?.type || "").toLowerCase();
  const beType = String(notificationItem?.beType || "").toUpperCase();
  const forumActionType = resolveForumActionType(notificationItem);

  if (type === "ai-diagnosis" || beType === "AI_DIAGNOSIS") {
    return (
      <span
        className="notification-type-icon ai-diagnosis"
        style={{ background: "rgba(94, 92, 230, 0.15)", color: "#4f46e5" }}
      >
        <BsRobot />
      </span>
    );
  }

  if (
    beType === "APPOINTMENT_BOOKED" ||
    beType === "APPOINTMENT_REMINDER" ||
    beType === "FOLLOW_UP_REMINDER"
  ) {
    return (
      <span
        className="notification-type-icon appointment"
        style={{ background: "rgba(34, 197, 94, 0.16)", color: "#16a34a" }}
      >
        <ScheduleOutlined />
      </span>
    );
  }

  if (forumActionType) {
    const senderName = String(notificationItem?.senderName || "").trim();
    const avatarUrl =
      notificationItem?.senderAvatar || notificationItem?.avatarUrl || undefined;

    return (
      <div style={{ position: "relative", width: 40, height: 40, flex: "0 0 40px" }}>
        <Avatar src={avatarUrl} size={40}>
          {senderName?.[0]?.toUpperCase()}
        </Avatar>
        <span
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            background: getForumActionBadgeColor(forumActionType),
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white",
          }}
        >
          {getForumActionIcon(forumActionType)}
        </span>
      </div>
    );
  }

  return (
    <span className="notification-type-icon">
      <IoMdNotificationsOutline />
    </span>
  );
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

  const handleClickNotificationItem = useCallback(
    (item, options = {}) => {
      if (!item?.id) return;

      void markNotificationAsRead(item.id);
      setIsNotificationOpen(false);

      if (options?.toastKey) {
        notificationApi.destroy(options.toastKey);
      }

      const targetHref = resolveNotificationHref(item, "client");
      if (targetHref) {
        navigate(targetHref);
      }
    },
    [markNotificationAsRead, navigate, notificationApi],
  );

  const buildForumActionText = useCallback(
    (notificationItem) => {
      const actionType = resolveForumActionType(notificationItem);
      if (actionType === "like") {
        return t("header.notifications.events.forumActionLike", "liked your post");
      }

      if (actionType === "reply") {
        return t(
          "header.notifications.events.forumActionReply",
          "replied to your comment",
        );
      }

      return t(
        "header.notifications.events.forumActionComment",
        "commented on your post",
      );
    },
    [t],
  );

  const renderToastMessage = useCallback(
    (notificationItem) => {
      const actorName =
        String(notificationItem?.senderName || "").trim() ||
        t("header.notifications.forumActorFallback");
      const forumActionType = resolveForumActionType(notificationItem);
      const isForumNotification = Boolean(forumActionType);

      return (
        <div className="client-live-notification-toast-content">
          <div className="client-live-notification-toast-icon-wrap">
            {getNotificationIcon(notificationItem)}
          </div>
          <div className="client-live-notification-toast-text">
            {isForumNotification ? (
              <div className="client-live-notification-toast-title">
                <strong>{actorName}</strong> {buildForumActionText(notificationItem)}
              </div>
            ) : (
              <div className="client-live-notification-toast-title">
                {notificationItem?.title || t("header.notifications.title")}
              </div>
            )}

            {notificationItem?.description ? (
              <div className="client-live-notification-toast-desc">
                "{notificationItem.description}"
              </div>
            ) : null}
          </div>
        </div>
      );
    },
    [buildForumActionText, t],
  );

  // ── WebSocket: receive realtime notifications from BE (e.g. AI_DIAGNOSIS) ──
  useEffect(() => {
    if (!token || !currentUserId) return;

    notifySocket.connect();

    notifySocket.on("severSendNotification", (data) => {
      console.log("[Client Header]  Nhận notification từ BE:", data);
      const mapped = mapBeNotification(data);
      if (!mapped) return;

      if (mapped?.type === "forum-like") {
        emitPostLikedRealtime(mapped);
      }

      if (!shownToastIdsRef.current.has(mapped.id)) {
        shownToastIdsRef.current.add(mapped.id);
        const toastKey = `client-live-notification-${mapped.id}`;
        notificationApi.open({
          key: toastKey,
          className: "client-live-notification-toast",
          message: renderToastMessage(mapped),
          description: null,
          placement: "bottomRight",
          duration: 5,
          icon: null,
          onClick: () => handleClickNotificationItem(mapped, { toastKey }),
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
  }, [
    currentUserId,
    handleClickNotificationItem,
    notificationApi,
    renderToastMessage,
    token,
  ]);

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
              const forumActionType = resolveForumActionType(item);
              const isForumNotification = Boolean(forumActionType);
              const actorName =
                String(item?.senderName || "").trim() ||
                t("header.notifications.forumActorFallback");

              return (
                <List.Item className="notification-list-item">
                  <button
                    type="button"
                    className={`notification-item ${isUnread ? "unread" : ""}`}
                    onClick={() => handleClickNotificationItem(item)}
                  >
                    {getNotificationIcon(item)}

                    <span className="notification-item-text">
                      {isForumNotification ? (
                        <span className="notification-item-title notification-item-title-inline">
                          <strong>{actorName}</strong> {buildForumActionText(item)}
                        </span>
                      ) : (
                        <span className="notification-item-title">{item.title}</span>
                      )}

                      {item.description ? (
                        <span
                          className={`notification-item-description ${isForumNotification ? "notification-item-description-quote" : ""}`}
                        >
                          {isForumNotification ? `"${item.description}"` : item.description}
                        </span>
                      ) : null}

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
              <img
                src="/avatarProject.png"
                alt={t("header.logo")}
                className="logo-image"
              />
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
                    <Badge
                      count={unreadNotificationCount}
                      overflowCount={9}
                      size="small"
                    >
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
