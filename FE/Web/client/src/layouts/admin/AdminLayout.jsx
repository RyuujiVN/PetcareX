import {
  FileTextOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Badge } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/Clinic/AuthContext";
import { getPrimaryRole } from "../../constants/authRole";
import { CiHospital1 } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
import { RoleEnum } from "../../enum/role.enum";
import useNotificationSocket from "../../hooks/useNotificationSocket";
import "../../styles/admin/colorsToken.css";
import styles from "./AdminLayout.module.css";

const menuItems = [
  {
    key: "clinics",
    label: "Quản lý phòng khám",
    icon: MedicineBoxOutlined,
    path: "/admin/dashboard/clinics",
  },
  {
    key: "users",
    label: "Quản lý người dùng",
    icon: TeamOutlined,
    path: "/admin/dashboard/users",
  },
  {
    key: "posts",
    label: "Quản lý bài đăng",
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

const formatAdminTimeAgo = (dateValue) => {
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

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userProfile, logout, activeRole } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
              <h2>PetCareX</h2>
              <p>Hệ thống quản trị</p>
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
          </nav>
        </div>

        <div className={styles.profileBox}>
          <div className={styles.profileInfo}>
            <Avatar
              size={38}
              src={userProfile?.avatarUrl || undefined}
              icon={<UserOutlined />}
            />
            <div>
              <h4>{userProfile?.fullName || "Admin Name"}</h4>
              <p>{userProfile?.email || "admin@petcarex.vn"}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <LogoutOutlined />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Dashboard Admin</h1>
          <div className={styles.headerActions}>
            <div
              className={styles.notificationWrapper}
              ref={notificationPanelRef}
            >
              <Badge count={unreadCount} size="small" offset={[1, 2]}>
                <button
                  type="button"
                  className={styles.notificationBtn}
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  aria-label="Mở thông báo"
                >
                  <IoMdNotificationsOutline />
                </button>
              </Badge>

              {notificationOpen ? (
                <div className={styles.notificationPanel}>
                  <div className={styles.notificationHeader}>
                    <h3>Thông báo</h3>
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Đánh dấu đã đọc
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
                      Tất cả
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
                      Chưa đọc
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
                                {formatAdminTimeAgo(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className={styles.notificationEmpty}>
                        Không có thông báo nào.
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
