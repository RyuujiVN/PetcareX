import {
  FileTextOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Badge } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
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
import "../../styles/admin/colorsToken.css";
import styles from "./AdminLayout.module.css";

const menuItems = [
  {
    key: "clinics",
    labelKey: "layout.menu.clinics",
    icon: MedicineBoxOutlined,
    path: "/admin/dashboard/clinics",
  },
  {
    key: "users",
    labelKey: "layout.menu.users",
    icon: TeamOutlined,
    path: "/admin/dashboard/users",
  },
  {
    key: "posts",
    labelKey: "layout.menu.posts",
    icon: FileTextOutlined,
    path: "/admin/dashboard/posts",
  },
];

const isMenuActive = (pathname, path) => {
  return pathname === path || pathname.startsWith(`${path}/`);
};

const NOTIFICATION_CATEGORY_ICONS = {
  appointment: <MedicineBoxOutlined />,
  "ai-diagnosis": <FileTextOutlined />,
  system: <TeamOutlined />,
  "forum-comment": <FileTextOutlined />,
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
                  className={`${styles.menuItem} ${isMenuActive(location.pathname, item.path) ? styles.menuItemActive : ""}`}
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
              <Badge count={unreadCount} size="small" offset={[1, 2]}>
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
                            onClick={() => markAsRead(item.id)}
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
