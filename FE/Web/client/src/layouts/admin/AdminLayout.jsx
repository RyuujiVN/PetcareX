import {
    BarChartOutlined,
    FileTextOutlined,
    MedicineBoxOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MessageOutlined,
    RobotOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { Badge, Button } from "antd";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoMdNotificationsOutline } from "react-icons/io";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../../components/common/LanguageSwitcher/LanguageSwitcher";
import PortalAccountMenu from "../../components/common/PortalAccountMenu/PortalAccountMenu";
import UnifiedNotificationPanel from "../../components/common/UnifiedNotificationPanel/UnifiedNotificationPanel";
import { getPrimaryRole } from "../../constants/authRole";
import { LANGUAGE_SCOPE } from "../../constants/languageStorage";
import { RoleEnum } from "../../enum/role.enum";
import { useAuth } from "../../hooks/Clinic/AuthContext";
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
  const [notificationLastSyncedAt, setNotificationLastSyncedAt] = useState("");
  const [, setTimeTick] = useState(0);
  const notificationPanelRef = useRef(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const effectiveRole =
    activeRole || (userProfile ? getPrimaryRole(userProfile) : null);
  const isChatbotRoute =
    location.pathname === "/admin/chatbot" ||
    location.pathname.startsWith("/admin/chatbot/");
  const isForumRoute =
    location.pathname === "/admin/forum" ||
    location.pathname.startsWith("/admin/forum/");

  const {
    notifications: notificationItems,
    readIdSet: notificationReadIdSet,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading: notificationLoading,
    refreshNotifications,
  } = useNotificationSocket({
    storageKey: `ws_notif_admin:${userProfile?.id || "default"}`,
    token,
    enabled: !!token,
    instance: getAdminInstance(),
  });

  // Force re-render every 30s so time-ago labels stay fresh.
  useEffect(() => {
    const id = window.setInterval(() => setTimeTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

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

  useEffect(() => {
    if (!token) {
      setNotificationLastSyncedAt("");
      return;
    }

    setNotificationLastSyncedAt(new Date().toISOString());
  }, [notificationItems, token]);

  const handleRefreshNotifications = useCallback(async () => {
    await refreshNotifications();
    setNotificationLastSyncedAt(new Date().toISOString());
  }, [refreshNotifications]);

  const buildForumActionText = useCallback(
    (notificationItem, actionType) => {
      if (actionType === "like") {
        return t("layout.notification.events.forumActionLike", {
          defaultValue: "liked your post",
        });
      }

      if (actionType === "reply") {
        return t("layout.notification.events.forumActionReply", {
          defaultValue: "replied to your comment",
        });
      }

      return t("layout.notification.events.forumActionComment", {
        defaultValue: "commented on your post",
      });
    },
    [t],
  );

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
    <div className={`${styles.layout} ${!isSidebarVisible ? styles.layoutCollapsed : ""} ${isChatbotRoute ? styles.chatbotRouteActive : ""}`}>
      {!isSidebarVisible ? (
        <Button
          type="text"
          aria-label={t("layout.aria.toggleSidebar", { defaultValue: "Show or hide sidebar" })}
          className={styles.sidebarToggleButton}
          icon={<MenuUnfoldOutlined />}
          onClick={() => setIsSidebarVisible(true)}
        />
      ) : null}
      {/* ── Sidebar ── */}
      {isSidebarVisible ? (
      <aside className={styles.sidebar}>
        <Button
          type="text"
          aria-label={t("layout.aria.toggleSidebar", { defaultValue: "Show or hide sidebar" })}
          className={styles.sidebarInlineToggleButton}
          icon={<MenuFoldOutlined />}
          onClick={() => setIsSidebarVisible(false)}
        />
        <div>
          <div className={styles.brandBox}>
            <div className={styles.brandIcon}>
              <img
                src="/avatarProject.png"
                alt={t("layout.brand.name")}
                className={styles.brandImage}
              />
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
      ) : null}

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {!isForumRoute ? (
              <h1 className={styles.headerTitle}>
                {isChatbotRoute ? (
                  <span className={styles.chatbotHeaderTitle}>
                    <MessageCircle size={18} />
                    <span>{t("pages.chatbot.assistantTitle")}</span>
                  </span>
                ) : (
                  t("layout.header.title")
                )}
              </h1>
            ) : null}
            {isForumRoute ? (
              <div
                id="forum-search-slot-admin"
                className={styles.forumHeaderSearchSlot}
              />
            ) : null}
          </div>
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
                  <UnifiedNotificationPanel
                    title={t("layout.notification.title")}
                    refreshLabel={t("layout.notification.refresh", {
                      defaultValue: "Làm mới",
                    })}
                    markReadLabel={t("layout.notification.markAllRead")}
                    allLabel={t("layout.notification.tabs.all")}
                    unreadLabel={t("layout.notification.tabs.unread")}
                    emptyLabel={t("layout.notification.empty")}
                    syncedAtLabel={t("layout.notification.syncedAt", {
                      defaultValue: "Cập nhật lúc",
                    })}
                    forumActorFallbackLabel={t(
                      "layout.notification.forumActorFallback",
                      {
                        defaultValue: "Người dùng",
                      },
                    )}
                    notifications={notificationItems}
                    readIdSet={notificationReadIdSet}
                    unreadCount={unreadCount}
                    loading={notificationLoading}
                    filterMode={notificationTab}
                    onFilterModeChange={setNotificationTab}
                    onRefresh={handleRefreshNotifications}
                    onMarkAllRead={markAllAsRead}
                    onItemClick={handleNotificationItemClick}
                    formatTimeAgo={(value) => formatAdminTimeAgo(value, t)}
                    buildForumActionText={buildForumActionText}
                    lastSyncedAt={notificationLastSyncedAt}
                  />
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
