import {
  CalendarOutlined,
  EditOutlined,
  FileSearchOutlined,
  HomeOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
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
  Select,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/Clinic/AuthContext";
import { getNormalizedRoles, getPrimaryRole } from "../../constants/authRole";
import { ADMIN_AUTH_STORAGE } from "../../constants/authStorage";
import { CiHospital1 } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
import { RoleEnum } from "../../enum/role.enum";
import { getRoleLabel } from "../../constants/veterinaryLabels";
import { getCurrentAdminClinicId } from "../../utils/clinicIdentity";
import styles from "./AdminClinicLayout.module.css";
import notifySocket from "../../socket/notifySocket";

const { Text } = Typography;

const menuItems = [
  {
    key: "appointments",
    label: "Lịch hẹn",
    icon: CalendarOutlined,
    path: "/clinic/appointments",
  },
  {
    key: "records",
    label: "Sổ y tế điện tử",
    icon: MedicineBoxOutlined,
    path: "/clinic/medical-records",
  },
  {
    key: "revenue",
    label: "Doanh thu",
    icon: LineChartOutlined,
    path: "/clinic/revenue",
  },
  {
    key: "doctors",
    label: "Bác sĩ",
    icon: TeamOutlined,
    path: "/clinic/veterinarians",
  },
  {
    key: "forms",
    label: "Xem phiếu khám",
    icon: FileSearchOutlined,
    path: "/clinic/exam-slips",
  },
];

const CLINIC_NOTIFICATION_READ_STORAGE_KEY =
  "clinic_layout_notification_read_ids";
const NOTIFICATION_TYPE_COLORS = {
  appointment: "blue",
  system: "gold",
  review: "purple",
  payment: "green",
};

const getNotificationTypeLabel = (type) => {
  if (type === "appointment") return "Lịch hẹn";
  if (type === "system") return "Hệ thống";
  if (type === "review") return "Đánh giá";
  if (type === "payment") return "Thanh toán";
  return "Khác";
};

const buildMockClinicNotifications = (clinicName) => {
  const now = Date.now();
  const createTime = (minutesAgo) =>
    new Date(now - minutesAgo * 60 * 1000).toISOString();

  return [
    {
      id: "clinic-notify-01",
      type: "appointment",
      createdAt: createTime(3),
      title: "Có lịch khám mới từ khách hàng",
      description: `Nguyễn Minh An vừa đặt lịch tại ${clinicName} cho bé Mít với dịch vụ Khám tổng quát lúc 09:30 hôm nay.`,
    },
    {
      id: "clinic-notify-02",
      type: "appointment",
      createdAt: createTime(26),
      title: "Khách hàng đã đổi khung giờ khám",
      description:
        "Lê Thu Hằng đã đổi lịch cho bé Bông từ 14:00 sang 15:30, dịch vụ Tiêm phòng nhắc lại.",
    },
    {
      id: "clinic-notify-03",
      type: "payment",
      createdAt: createTime(95),
      title: "Thanh toán hóa đơn thành công",
      description:
        "Hóa đơn MR-2308 cho lịch khám của bé Cún đã được thanh toán online đầy đủ.",
    },
    {
      id: "clinic-notify-04",
      type: "review",
      createdAt: createTime(300),
      title: "Bạn nhận được đánh giá mới 5 sao",
      description:
        "Khách hàng Phạm Hải Đăng để lại phản hồi tốt về dịch vụ Khám da liễu cho thú cưng.",
    },
    {
      id: "clinic-notify-05",
      type: "system",
      createdAt: createTime(1380),
      title: "Nhắc nhở lịch hẹn ngày mai",
      description:
        "Bạn có 7 lịch hẹn vào ngày mai. Hãy xác nhận đủ bác sĩ trực để tránh quá tải.",
    },
  ];
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

const isMenuActive = (pathname, path) => {
  if (path === "/clinic/appointments") {
    return pathname === "/admin/home" || pathname === "/clinic/appointments";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
};

const getClinicDisplayName = (profile) => {
  return (
    profile?.clinicName ||
    profile?.clinicInfo?.name ||
    profile?.clinic?.name ||
    profile?.veterinarian?.clinic?.name ||
    profile?.adminClinic?.clinic?.name ||
    "PetCareX"
  );
};

const handoffAdminAuthToNewTab = () => {
  const authKeys = [
    ADMIN_AUTH_STORAGE.tokenKey,
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
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userProfile, logout, activeRole } = useAuth();
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationReadIds, setNotificationReadIds] = useState([]);
  const [notificationFilters, setNotificationFilters] = useState({
    viewMode: "all",
    eventType: "all",
  });
  const effectiveRole =
    activeRole || (userProfile ? getPrimaryRole(userProfile) : null);
  const normalizedRoles = userProfile ? getNormalizedRoles(userProfile) : [];
  const hasClinicRole = normalizedRoles.includes(RoleEnum.ADMIN_CLINIC);
  const clinicDisplayName = getClinicDisplayName(userProfile);
  const clinicId = getCurrentAdminClinicId(userProfile);
  const notificationScopeKey = clinicId || userProfile?.id || "default";
  const shouldHideNotificationBell =
    location.pathname.startsWith("/clinic/home-editor/") ||
    location.pathname.startsWith("/clinic/clinic-editor/");

  const notificationItems = useMemo(
    () => buildMockClinicNotifications(clinicDisplayName),
    [clinicDisplayName],
  );

  const notificationReadIdSet = useMemo(
    () => new Set(notificationReadIds),
    [notificationReadIds],
  );

  const unreadNotificationCount = useMemo(
    () =>
      notificationItems.reduce(
        (count, item) =>
          notificationReadIdSet.has(item.id) ? count : count + 1,
        0,
      ),
    [notificationItems, notificationReadIdSet],
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
    const storageKey = `${CLINIC_NOTIFICATION_READ_STORAGE_KEY}:${notificationScopeKey}`;

    try {
      const storedIds = JSON.parse(
        window.localStorage.getItem(storageKey) || "[]",
      );
      if (Array.isArray(storedIds)) {
        setNotificationReadIds(storedIds);
        return;
      }
    } catch {}

    setNotificationReadIds([]);
  }, [notificationScopeKey]);

  useEffect(() => {
    const storageKey = `${CLINIC_NOTIFICATION_READ_STORAGE_KEY}:${notificationScopeKey}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(notificationReadIds.slice(-300)),
    );
  }, [notificationReadIds, notificationScopeKey]);

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

  useEffect(() => {
    if (!notifySocket.connected) notifySocket.connect();

    notifySocket.on("severSendNotification", (data) => {
      console.log(data);
    });

    return () => {
      notifySocket.off("severSendNotification", (data) => {
        console.log(data);
      });
      notifySocket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const markNotificationAsRead = (notificationId) => {
    if (!notificationId) return;

    setNotificationReadIds((prev) => {
      if (prev.includes(notificationId)) return prev;
      return [...prev, notificationId];
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotificationReadIds(notificationItems.map((item) => item.id));
  };

  const openHomePageEditor = () => {
    if (!clinicId) {
      message.error("Không xác định được clinicId của phòng khám hiện tại");
      return;
    }

    handoffAdminAuthToNewTab();

    const editorUrl = `${window.location.origin}/clinic/home-editor/${clinicId}`;
    window.open(editorUrl, "_blank", "noopener,noreferrer");
  };

  const openClinicSelectionEditor = () => {
    if (!clinicId) {
      message.error("Không xác định được clinicId của phòng khám hiện tại");
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
          <h3>Thông báo phòng khám</h3>
          <p>{`${unreadNotificationCount} chưa đọc / ${notificationItems.length} thông báo`}</p>
        </div>
        <Button
          type="link"
          size="small"
          onClick={markAllNotificationsAsRead}
          disabled={unreadNotificationCount === 0}
          className={styles.markAllReadBtn}
        >
          Đánh dấu đã đọc
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
              { value: "all", label: "Tất cả" },
              { value: "unread", label: "Chưa đọc" },
            ]}
          />
        </Form.Item>

        <Form.Item name="eventType" className={styles.notificationFilterItem}>
          <Select
            size="middle"
            options={[
              { value: "all", label: "Mọi loại" },
              { value: "appointment", label: "Lịch hẹn" },
              { value: "payment", label: "Thanh toán" },
              { value: "review", label: "Đánh giá" },
              { value: "system", label: "Hệ thống" },
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
              description="Không có thông báo phù hợp"
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
                  {getNotificationTypeLabel(item.type)}
                </Tag>
                <Text className={styles.notificationTimeText}>
                  {formatNotificationTimeAgo(item.createdAt)}
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
              <p>PetcareX</p>
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
              <span>Chỉnh Sửa Trang Chủ</span>
            </button>

            <button
              type="button"
              onClick={openClinicSelectionEditor}
              className={`${styles.menuItem} ${styles.menuButton} ${location.pathname.startsWith("/clinic/clinic-editor/") ? styles.menuItemActive : ""}`}
            >
              <EditOutlined />
              <span>Chỉnh Sửa Phòng Khám</span>
            </button>
          </nav>
        </div>

        <div className={styles.profileBox}>
          <div className={styles.profileInfo}>
            <Avatar
              size={42}
              src={userProfile?.avatarUrl || undefined}
              icon={<UserOutlined />}
            />
            <div>
              <h4>{userProfile?.fullName || "Người dùng"}</h4>
              <p>{getRoleLabel(userProfile?.role || "ADMIN_CLINIC", "vi")}</p>
            </div>
          </div>

          <Button
            type="text"
            icon={<LogoutOutlined />}
            className={styles.logoutBtn}
            onClick={handleLogout}
            aria-label="Đăng xuất"
          ></Button>
        </div>
      </aside>

      <main className={styles.main}>
        {!shouldHideNotificationBell ? (
          <div className={styles.mainActionBar}>
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
                aria-label="Xem thông báo phòng khám"
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
          </div>
        ) : null}

        <Outlet />
      </main>
    </div>
  );
}
