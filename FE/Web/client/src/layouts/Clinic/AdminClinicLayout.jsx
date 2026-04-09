import {
  CalendarOutlined,
  EditOutlined,
  FileSearchOutlined,
  HomeOutlined,
  LineChartOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Empty,
  Form,
  List,
  Popover,
  Select,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
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
  },
  {
    key: "records",
    labelKey: "sidebar.menu.records",
    icon: MedicineBoxOutlined,
    path: "/clinic/medical-records",
  },
  {
    key: "revenue",
    labelKey: "sidebar.menu.revenue",
    icon: LineChartOutlined,
    path: "/clinic/revenue",
  },
  {
    key: "doctors",
    labelKey: "sidebar.menu.doctors",
    icon: TeamOutlined,
    path: "/clinic/veterinarians",
  },
  {
    key: "forms",
    labelKey: "sidebar.menu.forms",
    icon: FileSearchOutlined,
    path: "/clinic/exam-slips",
  },
];

const NOTIFICATION_TYPE_COLORS = {
  appointment: "blue",
  payment: "green",
  review: "purple",
  "ai-diagnosis": "purple",
  system: "gold",
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

const isMenuActive = (pathname, path) => {
  if (path === "/clinic/appointments") {
    return pathname === "/admin/home" || pathname === "/clinic/appointments";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
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
  } catch {}
};

export default function AdminClinicLayout() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userProfile, login, logout, refreshUserProfile, activeRole } = useAuth();
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationFilters, setNotificationFilters] = useState({
    viewMode: "all",
    eventType: "all",
  });
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
  const shouldHideNotificationBell =
    location.pathname.startsWith("/clinic/home-editor/") ||
    location.pathname.startsWith("/clinic/clinic-editor/");

  const {
    notifications: notificationItems,
    readIdSet: notificationReadIdSet,
    unreadCount: unreadNotificationCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
  } = useNotificationSocket({
    storageKey: `ws_notif_clinic:${notificationScopeKey}`,
    token,
    enabled: !!token,
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
      navigate("/admin/home", { replace: true });
    }
  }, [token, effectiveRole, hasClinicRole, navigate]);

  const openHomePageEditor = () => {
    if (!clinicId) {
      message.error(t("sidebar.errors.missingClinicId"));
      return;
    }

    handoffAdminAuthToNewTab();

    const editorUrl = `${window.location.origin}/clinic/home-editor/${clinicId}`;
    window.open(editorUrl, "_blank", "noopener,noreferrer");
  };

  const openClinicSelectionEditor = () => {
    if (!clinicId) {
      message.error(t("sidebar.errors.missingClinicId"));
      return;
    }

    handoffAdminAuthToNewTab();

    const editorUrl = `${window.location.origin}/clinic/clinic-editor/${clinicId}`;
    window.open(editorUrl, "_blank", "noopener,noreferrer");
  };

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
              onClick={() => markNotificationAsRead(item.id)}
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
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
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
                  className={`${styles.menuItem} ${isMenuActive(location.pathname, item.path) ? styles.menuItemActive : ""}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={openHomePageEditor}
              className={`${styles.menuItem} ${styles.menuButton} ${location.pathname.startsWith("/clinic/home-editor/") ? styles.menuItemActive : ""}`}
            >
              <HomeOutlined />
              <span>{t("sidebar.menu.homeEditor")}</span>
            </button>

            <button
              type="button"
              onClick={openClinicSelectionEditor}
              className={`${styles.menuItem} ${styles.menuButton} ${location.pathname.startsWith("/clinic/clinic-editor/") ? styles.menuItemActive : ""}`}
            >
              <EditOutlined />
              <span>{t("sidebar.menu.clinicEditor")}</span>
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

      <main className={styles.main}>
        <div className={styles.mainActionBar}>
          <div className={styles.mainActionGroup}>
            <LanguageSwitcher scope={LANGUAGE_SCOPE.clinic} />

            {!shouldHideNotificationBell ? (
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
                    overflowCount={99}
                    color="#1976ff"
                  >
                    <span className={styles.notificationBellIcon}>
                      <IoMdNotificationsOutline />
                    </span>
                  </Badge>
                }
              />
            </Popover>
            ) : null}
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
