import {
    CalendarOutlined,
    FileSearchOutlined,
    HomeOutlined,
    LineChartOutlined,
    MedicineBoxOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MessageOutlined,
    RobotOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import {
    Badge,
    Button,
    message,
    notification,
    Popover,
} from "antd";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoMdNotificationsOutline } from "react-icons/io";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../../components/common/LanguageSwitcher/LanguageSwitcher";
import PortalAccountMenu from "../../components/common/PortalAccountMenu/PortalAccountMenu";
import UnifiedNotificationPanel from "../../components/common/UnifiedNotificationPanel/UnifiedNotificationPanel";
import { getNormalizedRoles, getPrimaryRole } from "../../constants/authRole";
import { ADMIN_AUTH_STORAGE } from "../../constants/authStorage";
import { LANGUAGE_SCOPE } from "../../constants/languageStorage";
import { getRoleLabel } from "../../constants/veterinaryLabels";
import { RoleEnum } from "../../enum/role.enum";
import { useAuth } from "../../hooks/Clinic/AuthContext";
import useNotificationSocket from "../../hooks/useNotificationSocket";
import { getAdminInstance } from "../../services/apiClient";
import { resolveNotificationHref } from "../../services/notificationService";
import { getCurrentAdminClinicId } from "../../utils/clinicIdentity";
import styles from "./AdminClinicLayout.module.css";

const menuItemConfigs = [
  {
    key: "appointments",
    labelKey: "sidebar.menu.appointments",
    icon: CalendarOutlined,
    path: "/clinic/appointments",
    activePaths: ["/clinic/appointments", "/admin/home"],
  },
  {
    key: "records",
    labelKey: "sidebar.menu.records",
    icon: MedicineBoxOutlined,
    path: "/clinic/medical-records",
    activePaths: ["/clinic/medical-records"],
  },
  {
    key: "revenue",
    labelKey: "sidebar.menu.revenue",
    icon: LineChartOutlined,
    path: "/clinic/revenue",
    activePaths: ["/clinic/revenue"],
  },
  {
    key: "doctors",
    labelKey: "sidebar.menu.doctors",
    icon: TeamOutlined,
    path: "/clinic/veterinarians",
    activePaths: ["/clinic/veterinarians"],
  },
  {
    key: "forms",
    labelKey: "sidebar.menu.forms",
    icon: FileSearchOutlined,
    path: "/clinic/exam-slips",
    activePaths: ["/clinic/exam-slips"],
  },
  {
    key: "forum",
    labelKey: "sidebar.menu.forum",
    icon: MessageOutlined,
    path: "/clinic/forum",
    activePaths: ["/clinic/forum"],
  },
  {
    key: "chatbot",
    labelKey: "sidebar.menu.chatbot",
    icon: RobotOutlined,
    path: "/clinic/chatbot",
    activePaths: ["/clinic/chatbot"],
  },
];

const clinicEditorPathPrefixes = [
  "/clinic/editor",
  "/clinic/home-editor",
  "/clinic/clinic-editor",
];


const formatNotificationTimeAgo = (dateValue, t) => {
  const createdAt = new Date(dateValue).getTime();
  if (Number.isNaN(createdAt)) return t("sidebar.notifications.time.justNow");

  const diff = Date.now() - createdAt;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return t("sidebar.notifications.time.justNow");
  if (diff < hour) {
    return t("sidebar.notifications.time.minutesAgo", {
      count: Math.floor(diff / minute),
    });
  }
  if (diff < day) {
    return t("sidebar.notifications.time.hoursAgo", {
      count: Math.floor(diff / hour),
    });
  }
  return t("sidebar.notifications.time.daysAgo", {
    count: Math.floor(diff / day),
  });
};

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

const getClinicDisplayName = (profile, t) => {
  return (
    profile?.clinicName ||
    profile?.clinicInfo?.name ||
    profile?.clinic?.name ||
    profile?.veterinarian?.clinic?.name ||
    profile?.adminClinic?.clinic?.name ||
    t("sidebar.defaultClinicName")
  );
};

const handoffAdminAuthToNewTab = () => {
  const authKeys = [
    ADMIN_AUTH_STORAGE.userInfoKey,
    ADMIN_AUTH_STORAGE.activeRoleKey,
  ];

  try {
    authKeys.forEach((key) => {
      const value = window.sessionStorage.getItem(key);
      if (value !== null) {
        window.localStorage.setItem(key, value);
      }
    });
  } catch (error) {
    void error;
  }
};

export default function AdminClinicLayout() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userProfile, login, logout, refreshUserProfile, activeRole } = useAuth();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [notificationLastSyncedAt, setNotificationLastSyncedAt] = useState("");
  const shownToastIdsRef = useRef(new Set());
  const [, setTimeTick] = useState(0);

  // Force re-render every 30s so time-ago labels stay fresh
  useEffect(() => {
    const id = window.setInterval(() => setTimeTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const effectiveRole =
    activeRole || (userProfile ? getPrimaryRole(userProfile) : null);
  const normalizedRoles = userProfile ? getNormalizedRoles(userProfile) : [];
  const hasClinicRole = normalizedRoles.includes(RoleEnum.ADMIN_CLINIC);
  const clinicDisplayName = getClinicDisplayName(userProfile, t);
  const clinicId = getCurrentAdminClinicId(userProfile);
  const notificationScopeKey = clinicId || userProfile?.id || "default";
  const isClinicEditorRoute =
    location.pathname.startsWith("/clinic/editor/") ||
    location.pathname.startsWith("/clinic/home-editor/") ||
    location.pathname.startsWith("/clinic/clinic-editor/");

  const isChatbotRoute =
    location.pathname === "/clinic/chatbot" ||
    location.pathname.startsWith("/clinic/chatbot/");
  const isForumRoute =
    location.pathname === "/clinic/forum" ||
    location.pathname.startsWith("/clinic/forum/");

  const isFullscreenRoute =
    location.pathname === "/clinic/forum" ||
    location.pathname.startsWith("/clinic/forum/") ||
    location.pathname === "/clinic/chatbot" ||
    location.pathname.startsWith("/clinic/chatbot/");

  const shouldEmbedActionBarInTopBar =
    location.pathname === "/clinic/appointments" ||
    location.pathname.startsWith("/clinic/appointments/") ||
    location.pathname === "/clinic/revenue" ||
    location.pathname.startsWith("/clinic/revenue/") ||
    location.pathname.startsWith("/clinic/veterinarians") ||
    location.pathname === "/clinic/exam-slips" ||
    location.pathname.startsWith("/clinic/exam-slips/") ||
    location.pathname === "/clinic/profile" ||
    location.pathname.startsWith("/clinic/profile/") ||
    location.pathname === "/clinic/medical-records" ||
    location.pathname.startsWith("/clinic/medical-records/view");

  const {
    notifications: notificationItems,
    readIdSet: notificationReadIdSet,
    unreadCount: unreadNotificationCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    loading: notificationLoading,
    refreshNotifications,
    latestIncomingNotification,
  } = useNotificationSocket({
    storageKey: `ws_notif_clinic:${notificationScopeKey}`,
    token,
    enabled: !!token,
    instance: getAdminInstance(),
  });

  const menuItems = useMemo(
    () => menuItemConfigs.map((item) => ({ ...item, label: t(item.labelKey) })),
    [t],
  );

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!effectiveRole) return;

    if (effectiveRole === RoleEnum.VETERINARIAN && !hasClinicRole) {
      navigate("/veterinarian/appointments", { replace: true });
      return;
    }

    if (effectiveRole === RoleEnum.ADMIN) {
      navigate("/admin/dashboard/clinics", { replace: true });
    }
  }, [token, effectiveRole, hasClinicRole, navigate]);

  const openUnifiedEditor = () => {
    if (!clinicId) {
      message.error(t("sidebar.errors.missingClinicId"));
      return;
    }

    handoffAdminAuthToNewTab();

    const editorUrl = `${window.location.origin}/clinic/editor/${clinicId}`;
    window.open(editorUrl, "_blank", "noopener,noreferrer");
  };

  const handleNotificationItemClick = useCallback((item) => {
    if (!item?.id) return;

    void markNotificationAsRead(item.id);
    setNotificationPopoverOpen(false);

    const targetHref = resolveNotificationHref(item, "clinic");
    if (targetHref) {
      navigate(targetHref);
    }
  }, [markNotificationAsRead, navigate]);

  useEffect(() => {
    const notificationId = latestIncomingNotification?.id;
    if (!notificationId) return;

    if (shownToastIdsRef.current.has(notificationId)) return;
    shownToastIdsRef.current.add(notificationId);

    notificationApi.open({
      key: `clinic-live-notification-${notificationId}`,
      message: latestIncomingNotification?.title || t("sidebar.notifications.panelTitle"),
      description: latestIncomingNotification?.description || "",
      placement: "bottomRight",
      duration: 5,
      onClick: () => handleNotificationItemClick(latestIncomingNotification),
    });
  }, [handleNotificationItemClick, latestIncomingNotification, notificationApi, t]);

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
        return t("sidebar.notifications.events.forumActionLike", {
          defaultValue: "liked your post",
        });
      }

      if (actionType === "reply") {
        return t("sidebar.notifications.events.forumActionReply", {
          defaultValue: "replied to your comment",
        });
      }

      return t("sidebar.notifications.events.forumActionComment", {
        defaultValue: "commented on your post",
      });
    },
    [t],
  );

  const notificationContent = (
    <UnifiedNotificationPanel
      title={t("sidebar.notifications.panelTitle")}
      refreshLabel={t("sidebar.notifications.refresh", {
        defaultValue: "Làm mới",
      })}
      markReadLabel={t("sidebar.notifications.markRead")}
      allLabel={t("sidebar.notifications.filters.all")}
      unreadLabel={t("sidebar.notifications.filters.unread")}
      emptyLabel={t("sidebar.notifications.empty")}
      syncedAtLabel={t("sidebar.notifications.syncedAt", {
        defaultValue: "Cập nhật lúc",
      })}
      forumActorFallbackLabel={t("sidebar.notifications.forumActorFallback", {
        defaultValue: "Người dùng",
      })}
      notifications={notificationItems}
      readIdSet={notificationReadIdSet}
      unreadCount={unreadNotificationCount}
      loading={notificationLoading}
      filterMode={notificationFilter}
      onFilterModeChange={setNotificationFilter}
      onRefresh={handleRefreshNotifications}
      onMarkAllRead={markAllNotificationsAsRead}
      onItemClick={handleNotificationItemClick}
      formatTimeAgo={(value) => formatNotificationTimeAgo(value, t)}
      buildForumActionText={buildForumActionText}
      lastSyncedAt={notificationLastSyncedAt}
    />
  );

  return (
    <div
      className={`${styles.layout} ${!isSidebarVisible || isClinicEditorRoute ? styles.layoutSingleColumn : ""} ${isChatbotRoute ? styles.chatbotRouteActive : ""}`}
    >
      {!isClinicEditorRoute && isSidebarVisible ? (
      <aside className={styles.sidebar}>
        <Button
          type="text"
          aria-label={t("sidebar.toggleAriaLabel", { defaultValue: "Ẩn/hiện sidebar" })}
          className={styles.sidebarInlineToggleButton}
          icon={<MenuFoldOutlined />}
          onClick={() => setIsSidebarVisible(false)}
        />

        <div>
          <div className={styles.brandBox}>
            <div className={styles.brandIcon}>
              <img
                src="/avatarProject.png"
                alt={clinicDisplayName}
                className={styles.brandImage}
              />
            </div>
            <div>
              <h2>{clinicDisplayName}</h2>
              <p>{t("sidebar.brandSubtitle")}</p>
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
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={openUnifiedEditor}
              className={`${styles.menuItem} ${styles.menuButton} ${clinicEditorPathPrefixes.some((pathPrefix) => isPathMatch(location.pathname, pathPrefix)) ? styles.menuItemActive : ""}`}
            >
              <HomeOutlined />
              <span>{t("sidebar.menu.editor", { defaultValue: "Chỉnh sửa trang" })}</span>
            </button>
          </nav>
        </div>

        <div className={styles.profileBox}>
          <PortalAccountMenu
            namespace="clinic"
            userProfile={userProfile}
            login={login}
            logout={logout}
            refreshUserProfile={refreshUserProfile}
            onAfterLogout={() => navigate("/login", { replace: true })}
            defaultName={t("sidebar.defaultUser")}
            metaText={getRoleLabel(userProfile?.role || "ADMIN_CLINIC")}
          />
        </div>
      </aside>
      ) : null}

      <main className={`${styles.main} ${isFullscreenRoute ? styles.mainFullscreen : ""}`}>
        {notificationContextHolder}
        {!isClinicEditorRoute && !isSidebarVisible ? (
          <Button
            type="text"
            aria-label={t("sidebar.toggleAriaLabel", { defaultValue: "Ẩn/hiện sidebar" })}
            className={styles.sidebarToggleButton}
            icon={<MenuUnfoldOutlined />}
            onClick={() => setIsSidebarVisible(true)}
          />
        ) : null}

        {isFullscreenRoute ? (
          <div className={`${styles.inlineTopBar} ${isChatbotRoute ? styles.inlineTopBarChatbot : ""}`}>
            <div className={styles.inlineTopBarLeft}>
              {isForumRoute ? (
                <div
                  id="forum-search-slot-clinic"
                  className={styles.forumHeaderSearchSlot}
                />
              ) : null}
              {isChatbotRoute ? (
                <div className={styles.chatbotHeaderTitle}>
                  <MessageCircle style={{color: '#4672b4'}} />
                  <span>{t('pages.chatbot.assistantTitle')}</span>
                </div>
              ) : null}
            </div>
            <div className={styles.inlineTopBarActions}>
              <LanguageSwitcher scope={LANGUAGE_SCOPE.clinic} />
              <Popover
                trigger="click"
                placement="bottomRight"
                overlayClassName={styles.notificationPopoverOverlay}
                content={notificationContent}
                open={notificationPopoverOpen}
                onOpenChange={setNotificationPopoverOpen}
              >
                <Button
                  type="text"
                  aria-label={t("sidebar.notificationBellAriaLabel")}
                  className={styles.notificationBellButton}
                  icon={
                    <Badge
                      count={unreadNotificationCount}
                      size="small"
                      overflowCount={9}
                    >
                      <span className={styles.notificationBellIcon}>
                        <IoMdNotificationsOutline />
                      </span>
                    </Badge>
                  }
                />
              </Popover>
            </div>
          </div>
        ) : !isClinicEditorRoute ? (
        <div
          className={`${styles.mainActionBar} ${shouldEmbedActionBarInTopBar ? styles.mainActionBarEmbedded : ""}`}
        >
          <div className={styles.mainActionGroup}>
            <LanguageSwitcher scope={LANGUAGE_SCOPE.clinic} />

            <Popover
              trigger="click"
              placement="bottomRight"
              overlayClassName={styles.notificationPopoverOverlay}
              content={notificationContent}
              open={notificationPopoverOpen}
              onOpenChange={setNotificationPopoverOpen}
            >
              <Button
                type="text"
                aria-label={t("sidebar.notificationBellAriaLabel")}
                className={styles.notificationBellButton}
                icon={
                  <Badge
                    count={unreadNotificationCount}
                    size="small"
                    overflowCount={9}
                  >
                    <span className={styles.notificationBellIcon}>
                      <IoMdNotificationsOutline />
                    </span>
                  </Badge>
                }
              />
            </Popover>
          </div>
        </div>
        ) : null}

        {isFullscreenRoute ? (
          <div className={styles.contentFullscreen}>
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
