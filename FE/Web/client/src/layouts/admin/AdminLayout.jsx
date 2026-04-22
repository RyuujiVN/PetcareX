import {
  BarChartOutlined,
  FileTextOutlined,
  FlagOutlined,
  MessageOutlined,
  MedicineBoxOutlined,
  RobotOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Badge } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/Clinic/AuthContext";
import { getPrimaryRole } from "../../constants/authRole";
import { LANGUAGE_SCOPE } from "../../constants/languageStorage";
import { CiHospital1 } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
import { RoleEnum } from "../../enum/role.enum";
import LanguageSwitcher from "../../components/common/LanguageSwitcher/LanguageSwitcher";
import PortalAccountMenu from "../../components/common/PortalAccountMenu/PortalAccountMenu";
import useNotificationSocket from "../../hooks/useNotificationSocket";
import { getAdminInstance } from "../../services/apiClient";
import { resolveNotificationHref } from "../../services/notificationService";
import "../../styles/admin/colorsToken.css";
import styles from "./AdminLayout.module.css";

const menuItems = [
  {
    key: "clinics",
    labelKey: "layout.menu.clinics",
    icon: MedicineBoxOutlined,
    path: "/admin/dashboard/clinics",
    activePaths: ["/admin/dashboard/clinics"],
  },
  {
    key: "users",
    labelKey: "layout.menu.users",
    icon: TeamOutlined,
    path: "/admin/dashboard/users",
    activePaths: ["/admin/dashboard/users"],
  },
  {
    key: "posts",
    labelKey: "layout.menu.posts",
    icon: FileTextOutlined,
    path: "/admin/dashboard/posts",
    activePaths: ["/admin/dashboard/posts"],
  },
  {
    key: "activity",
    labelKey: "layout.menu.activity",
    icon: BarChartOutlined,
    path: "/admin/dashboard/activity",
    activePaths: ["/admin/dashboard/activity"],
  },
  {
    key: "forum",
    labelKey: "layout.menu.forum",
    icon: MessageOutlined,
    path: "/admin/forum",
    activePaths: ["/admin/forum"],
  },
  {
    key: "chatbot",
    labelKey: "layout.menu.chatbot",
    icon: RobotOutlined,
    path: "/admin/chatbot",
    activePaths: ["/admin/chatbot"],
  },
];

const normalizePath = (path) => {
  if (!path) return "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
};

const isPathMatch = (pathname, pathPrefix) => {
  const currentPath = normalizePath(pathname);
  const normalizedPrefix = normalizePath(pathPrefix);
  return (
    currentPath === normalizedPrefix ||
    currentPath.startsWith(`${normalizedPrefix}/`)
  );
};

const isMenuActive = (pathname, item) => {
  const activePaths = item.activePaths?.length ? item.activePaths : [item.path];
  return activePaths.some((pathPrefix) => isPathMatch(pathname, pathPrefix));
};

const NOTIFICATION_CATEGORY_ICONS = {
  appointment: <MedicineBoxOutlined />,
  "ai-diagnosis": <FileTextOutlined />,
  system: <TeamOutlined />,
  "forum-like": <MessageOutlined />,
  "forum-reply": <MessageOutlined />,
  "forum-comment": <FileTextOutlined />,
  report: <FlagOutlined />,
};

const formatAdminTimeAgo = (dateValue, t) => {
  const createdAt = new Date(dateValue).getTime();
  if (Number.isNaN(createdAt)) return t("layout.notification.timeAgo.justNow");

  const diff = Date.now() - createdAt;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return t("layout.notification.timeAgo.justNow");
  if (diff < hour) {
    return t("layout.notification.timeAgo.minutesAgo", {
      count: Math.floor(diff / minute),
    });
  }
  if (diff < day) {
    return t("layout.notification.timeAgo.hoursAgo", {
      count: Math.floor(diff / hour),
    });
  }
  return t("layout.notification.timeAgo.daysAgo", {
    count: Math.floor(diff / day),
  });
};

export default function AdminLayout() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userProfile, logout, login, refreshUserProfile, activeRole } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState("all");
  const notificationPanelRef = useRef(null);
  const effectiveRole =
    activeRole || (userProfile ? getPrimaryRole(userProfile) : null);

  const {
    notifications: notificationItems,
    readIdSet: notificationReadIdSet,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationSocket({
    storageKey: `ws_notif_admin:${userProfile?.id || "default"}`,
    token,
    enabled: !!token,
    instance: getAdminInstance(),
  });

  const displayNotifications = useMemo(() => {
    if (notificationTab === "unread") {
      return notificationItems.filter(
        (item) => !notificationReadIdSet.has(item.id),
      );
    }
    return notificationItems;
  }, [notificationTab, notificationItems, notificationReadIdSet]);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!effectiveRole || effectiveRole === RoleEnum.ADMIN) return;

    if (effectiveRole === RoleEnum.ADMIN_CLINIC) {
      navigate("/clinic/appointments", { replace: true });
      return;
    }

    navigate("/veterinarian/appointments", { replace: true });
  }, [token, effectiveRole, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationItemClick = useCallback(
    (item) => {
      if (!item?.id) return;

      void markAsRead(item.id);
      setNotificationOpen(false);

      const isReportType =
        String(item?.beType || "").toUpperCase() === "REPORT" ||
        String(item?.beType || "").toUpperCase() === "POST_REPORTED" ||
        String(item?.beType || "").toUpperCase() === "COMMENT_REPORTED" ||
        String(item?.type || "").toLowerCase() === "report";

      if (isReportType) {
        const postId = String(item?.postId || item?.target?.postId || "").trim();
        const commentId = String(item?.commentId || item?.target?.commentId || "").trim();
        const params = new URLSearchParams();
        if (postId) params.set("postId", postId);
        if (commentId) params.set("commentId", commentId);
        params.set("adminAction", "delete");
        const queryString = params.toString();
        navigate(queryString ? `/admin/forum?${queryString}` : "/admin/forum");
        return;
      }

      const targetHref = resolveNotificationHref(item, "admin");
      if (targetHref) {
        navigate(targetHref);
      }
    },
    [markAsRead, navigate],
  );

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brandBox}>
            <div className={styles.brandIcon}>
              <CiHospital1 />
            </div>
            <div>
              <h2>{t("layout.brand.name")}</h2>
              <p>{t("layout.brand.subtitle")}</p>
            </div>
          </div>

          <nav className={styles.menu}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={`${styles.menuItem} ${isMenuActive(location.pathname, item) ? styles.menuItemActive : ""}`}
                >
                  <Icon />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className={styles.profileBox}>
          <PortalAccountMenu
            namespace="admin"
            userProfile={userProfile}
            login={login}
            logout={logout}
            refreshUserProfile={refreshUserProfile}
            onAfterLogout={() => navigate("/login", { replace: true })}
            defaultName={t("layout.profile.defaultName")}
            defaultMeta={t("layout.profile.defaultEmail")}
          />
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>{t("layout.header.title")}</h1>
          <div className={styles.headerActions}>
            <LanguageSwitcher scope={LANGUAGE_SCOPE.client} />

            <div
              className={styles.notificationWrapper}
              ref={notificationPanelRef}
            >
              <Badge
                count={unreadCount}
                size="small"
                offset={[1, 2]}
                overflowCount={9}
              >
                <button
                  type="button"
                  className={styles.notificationBtn}
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  aria-label={t("layout.notification.openAriaLabel")}
                >
                  <IoMdNotificationsOutline />
                </button>
              </Badge>

              {notificationOpen ? (
                <div className={styles.notificationPanel}>
                  <div className={styles.notificationHeader}>
                    <h3>{t("layout.notification.title")}</h3>
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      {t("layout.notification.markAllRead")}
                    </button>
                  </div>

                  <div className={styles.notificationTabs}>
                    <button
                      type="button"
                      className={
                        notificationTab === "all"
                          ? styles.notificationTabActive
                          : ""
                      }
                      onClick={() => setNotificationTab("all")}
                    >
                      {t("layout.notification.tabs.all")}
                    </button>
                    <button
                      type="button"
                      className={
                        notificationTab === "unread"
                          ? styles.notificationTabActive
                          : ""
                      }
                      onClick={() => setNotificationTab("unread")}
                    >
                      {t("layout.notification.tabs.unread")}
                    </button>
                  </div>

                  <div className={styles.notificationList}>
                    {displayNotifications.length ? (
                      displayNotifications.map((item) => {
                        const isUnread = !notificationReadIdSet.has(item.id);

                        return (
                          <div
                            key={item.id}
                            className={styles.notificationItem}
                            onClick={() => handleNotificationItemClick(item)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className={styles.notificationDotWrap}>
                              <span className={styles.notificationAvatar}>
                                {NOTIFICATION_CATEGORY_ICONS[item.type] || (
                                  <TeamOutlined />
                                )}
                              </span>
                              {isUnread ? (
                                <span className={styles.notificationDot} />
                              ) : null}
                            </div>
                            <div>
                              <p className={styles.notificationTitle}>
                                {item.title}
                              </p>
                              <p className={styles.notificationContent}>
                                {item.description}
                              </p>
                              <span className={styles.notificationTime}>
                                {formatAdminTimeAgo(item.createdAt, t)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className={styles.notificationEmpty}>
                        {t("layout.notification.empty")}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
