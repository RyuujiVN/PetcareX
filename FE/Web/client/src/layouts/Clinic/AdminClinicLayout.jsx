import {
  CalendarOutlined,
  FileSearchOutlined,
  HomeOutlined,
  LineChartOutlined,
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MedicineBoxOutlined,
  RobotOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Empty,
  Form,
  List,
  notification,
  Popover,
  Select,
  Tag,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiHospital1 } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getNormalizedRoles, getPrimaryRole } from "../../constants/authRole";
import { ADMIN_AUTH_STORAGE } from "../../constants/authStorage";
import LanguageSwitcher from "../../components/common/LanguageSwitcher/LanguageSwitcher";
import { LANGUAGE_SCOPE } from "../../constants/languageStorage";
import { getRoleLabel } from "../../constants/veterinaryLabels";
import { RoleEnum } from "../../enum/role.enum";
import { useAuth } from "../../hooks/Clinic/AuthContext";
import useNotificationSocket from "../../hooks/useNotificationSocket";
import { getAdminInstance } from "../../services/apiClient";
import { resolveNotificationHref } from "../../services/notificationService";
import { getCurrentAdminClinicId } from "../../utils/clinicIdentity";
import PortalAccountMenu from "../../components/common/PortalAccountMenu/PortalAccountMenu";
import styles from "./AdminClinicLayout.module.css";

const { Text } = Typography;

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

const NOTIFICATION_TYPE_COLORS = {
  appointment: "blue",
  payment: "green",
  review: "purple",
  "ai-diagnosis": "purple",
  system: "gold",
  "forum-like": "geekblue",
  "forum-reply": "cyan",
  "forum-comment": "cyan",
};

const getNotificationTypeLabel = (type, t) => {
  if (type === "appointment") {
    return t("sidebar.notifications.types.appointment", {
      defaultValue: "Lịch hẹn",
    });
  }
  if (type === "payment") {
    return t("sidebar.notifications.types.payment", {
      defaultValue: "Thanh toán",
    });
  }
  if (type === "review") {
    return t("sidebar.notifications.types.review", {
      defaultValue: "Đánh giá",
    });
  }
  if (type === "ai-diagnosis") {
    return t("sidebar.notifications.types.aiDiagnosis", {
      defaultValue: "Chẩn đoán AI",
    });
  }
  if (type === "forum-comment") {
    return t("sidebar.notifications.types.forumComment", {
      defaultValue: "Bình luận",
    });
  }
  if (type === "forum-like") {
    return t("sidebar.notifications.types.forumLike", {
      defaultValue: "Lượt thích",
    });
  }
  if (type === "forum-reply") {
    return t("sidebar.notifications.types.forumReply", {
      defaultValue: "Phản hồi",
    });
  }
  if (type === "system") {
    return t("sidebar.notifications.types.system", {
      defaultValue: "Hệ thống",
    });
  }

  return t("sidebar.notifications.types.other", {
    defaultValue: "Khác",
  });
};

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
  const [notificationFilters, setNotificationFilters] = useState({
    viewMode: "all",
    eventType: "all",
  });
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

  const filteredNotificationItems = useMemo(() => {
    return notificationItems.filter((item) => {
      if (
        notificationFilters.viewMode === "unread" &&
        notificationReadIdSet.has(item.id)
      ) {
        return false;
      }

      if (
        notificationFilters.eventType !== "all" &&
        item.type !== notificationFilters.eventType
      ) {
        return false;
      }

      return true;
    });
  }, [notificationFilters, notificationItems, notificationReadIdSet]);

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

  const notificationContent = (
    <div className={styles.notificationPanel}>
      <div className={styles.notificationPanelHeader}>
        <div>
          <h3>{t("sidebar.notifications.panelTitle")}</h3>
          <p>
            {t("sidebar.notifications.summary", {
              unread: unreadNotificationCount,
              total: notificationItems.length,
            })}
          </p>
        </div>
        <Button
          type="link"
          size="small"
          onClick={markAllNotificationsAsRead}
          disabled={unreadNotificationCount === 0}
          className={styles.markAllReadBtn}
        >
          {t("sidebar.notifications.markRead")}
        </Button>
      </div>

      <Form
        layout="inline"
        className={styles.notificationFilterForm}
        initialValues={notificationFilters}
        onValuesChange={(_, values) => {
          setNotificationFilters({
            viewMode: values.viewMode || "all",
            eventType: values.eventType || "all",
          });
        }}
      >
        <Form.Item name="viewMode" className={styles.notificationFilterItem}>
          <Select
            size="middle"
            options={[
              { value: "all", label: t("sidebar.notifications.filters.all") },
              {
                value: "unread",
                label: t("sidebar.notifications.filters.unread"),
              },
            ]}
          />
        </Form.Item>

        <Form.Item name="eventType" className={styles.notificationFilterItem}>
          <Select
            size="middle"
            options={[
              {
                value: "all",
                label: t("sidebar.notifications.filters.allTypes", {
                  defaultValue: "Mọi loại",
                }),
              },
              {
                value: "appointment",
                label: t("sidebar.notifications.filters.appointment", {
                  defaultValue: "Lịch hẹn",
                }),
              },
              {
                value: "payment",
                label: t("sidebar.notifications.filters.payment", {
                  defaultValue: "Thanh toán",
                }),
              },
              {
                value: "review",
                label: t("sidebar.notifications.filters.review", {
                  defaultValue: "Đánh giá",
                }),
              },
              {
                value: "ai-diagnosis",
                label: t("sidebar.notifications.filters.aiDiagnosis", {
                  defaultValue: "Chẩn đoán AI",
                }),
              },
              {
                value: "forum-comment",
                label: t("sidebar.notifications.filters.forumComment", {
                  defaultValue: "Bình luận",
                }),
              },
              {
                value: "forum-like",
                label: t("sidebar.notifications.filters.forumLike", {
                  defaultValue: "Lượt thích",
                }),
              },
              {
                value: "forum-reply",
                label: t("sidebar.notifications.filters.forumReply", {
                  defaultValue: "Phản hồi",
                }),
              },
              {
                value: "system",
                label: t("sidebar.notifications.filters.system", {
                  defaultValue: "Hệ thống",
                }),
              },
            ]}
          />
        </Form.Item>
      </Form>

      <List
        className={styles.notificationList}
        dataSource={filteredNotificationItems}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("sidebar.notifications.empty")}
            />
          ),
        }}
        renderItem={(item) => {
          const isRead = notificationReadIdSet.has(item.id);

          return (
            <List.Item
              key={item.id}
              className={`${styles.notificationItem} ${isRead ? "" : styles.notificationItemUnread}`}
              onClick={() => handleNotificationItemClick(item)}
            >
              <div className={styles.notificationItemTop}>
                <Tag color={NOTIFICATION_TYPE_COLORS[item.type] || "default"}>
                  {getNotificationTypeLabel(item.type, t)}
                </Tag>
                <Text className={styles.notificationTimeText}>
                  {formatNotificationTimeAgo(item.createdAt, t)}
                </Text>
              </div>

              <Text strong className={styles.notificationTitleText}>
                {item.title}
              </Text>
              <Text className={styles.notificationDescText}>
                {item.description}
              </Text>
            </List.Item>
          );
        }}
      />
    </div>
  );

  return (
    <div
      className={`${styles.layout} ${!isSidebarVisible || isClinicEditorRoute ? styles.layoutSingleColumn : ""}`}
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
              <CiHospital1 />
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
        {!isClinicEditorRoute && !isFullscreenRoute && !isSidebarVisible ? (
          <Button
            type="text"
            aria-label={t("sidebar.toggleAriaLabel", { defaultValue: "Ẩn/hiện sidebar" })}
            className={styles.sidebarToggleButton}
            icon={<MenuUnfoldOutlined />}
            onClick={() => setIsSidebarVisible(true)}
          />
        ) : null}

        {isFullscreenRoute ? (
          <div className={styles.inlineTopBar}>
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
