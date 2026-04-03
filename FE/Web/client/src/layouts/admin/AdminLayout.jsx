import {
  FileTextOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Badge } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/Clinic/AuthContext'
import { getPrimaryRole } from '../../constants/authRole'
import { CiHospital1 } from "react-icons/ci";
import { IoMdNotificationsOutline } from 'react-icons/io'
import { RoleEnum } from '../../enum/role.enum'
import '../../styles/admin/colorsToken.css'
import styles from './AdminLayout.module.css'

const menuItems = [
  { key: 'clinics', label: 'Quản lý phòng khám', icon: MedicineBoxOutlined, path: '/admin/dashboard/clinics' },
  { key: 'users', label: 'Quản lý người dùng', icon: TeamOutlined, path: '/admin/dashboard/users' },
  { key: 'posts', label: 'Quản lý bài đăng', icon: FileTextOutlined, path: '/admin/dashboard/posts' },
]

const isMenuActive = (pathname, path) => {
  return pathname === path || pathname.startsWith(`${path}/`)
}

const MOCK_ADMIN_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Người dùng mới đăng ký',
    content: 'Tài khoản Nguyễn Minh Anh vừa đăng ký vào hệ thống.',
    category: 'users',
    time: '5 phút trước',
    isRead: false,
  },
  {
    id: 'n2',
    title: 'Phòng khám yêu cầu duyệt',
    content: 'Phòng khám PetCare Đà Nẵng vừa gửi yêu cầu xác minh thông tin.',
    category: 'clinics',
    time: '30 phút trước',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'Bài đăng bị báo cáo',
    content: 'Bài viết trong chủ đề Chăm sóc mèo có 3 lượt báo cáo mới.',
    category: 'posts',
    time: '2 giờ trước',
    isRead: false,
  },
  {
    id: 'n4',
    title: 'Bác sĩ mới được tạo',
    content: 'Admin phòng khám đã tạo tài khoản bác sĩ Trần Quốc Bảo.',
    category: 'users',
    time: 'Hôm qua',
    isRead: true,
  },
  {
    id: 'n5',
    title: 'Cập nhật hồ sơ phòng khám',
    content: 'Phòng khám VetPro đã cập nhật địa chỉ và số điện thoại.',
    category: 'clinics',
    time: '2 ngày trước',
    isRead: true,
  },
  {
    id: 'n6',
    title: 'Bài đăng mới nổi bật',
    content: 'Bài viết về tiêm phòng cho chó đạt hơn 150 lượt thích.',
    category: 'posts',
    time: '3 ngày trước',
    isRead: true,
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, userProfile, logout, activeRole } = useAuth()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationTab, setNotificationTab] = useState('all')
  const notificationPanelRef = useRef(null)
  const effectiveRole = activeRole || (userProfile ? getPrimaryRole(userProfile) : null)

  const unreadCount = useMemo(
    () => MOCK_ADMIN_NOTIFICATIONS.filter((item) => !item.isRead).length,
    [],
  )

  const displayNotifications = useMemo(() => {
    if (notificationTab === 'unread') {
      return MOCK_ADMIN_NOTIFICATIONS.filter((item) => !item.isRead)
    }
    return MOCK_ADMIN_NOTIFICATIONS
  }, [notificationTab])

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (!effectiveRole || effectiveRole === RoleEnum.ADMIN) return

    if (effectiveRole === RoleEnum.ADMIN_CLINIC) {
      navigate('/clinic/appointments', { replace: true })
      return
    }

    navigate('/veterinarian/appointments', { replace: true })
  }, [token, effectiveRole, navigate])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
              const Icon = item.icon
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={`${styles.menuItem} ${isMenuActive(location.pathname, item.path) ? styles.menuItemActive : ''}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              )
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
              <h4>{userProfile?.fullName || 'Admin Name'}</h4>
              <p>{userProfile?.email || 'admin@petcarex.vn'}</p>
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
            <div className={styles.notificationWrapper} ref={notificationPanelRef}>
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
                    <h3>Notifications</h3>
                    <button type="button">See all</button>
                  </div>

                  <div className={styles.notificationTabs}>
                    <button
                      type="button"
                      className={notificationTab === 'all' ? styles.notificationTabActive : ''}
                      onClick={() => setNotificationTab('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={notificationTab === 'unread' ? styles.notificationTabActive : ''}
                      onClick={() => setNotificationTab('unread')}
                    >
                      Unread
                    </button>
                  </div>

                  <div className={styles.notificationList}>
                    {displayNotifications.length ? (
                      displayNotifications.map((item) => (
                        <div key={item.id} className={styles.notificationItem}>
                          <div className={styles.notificationDotWrap}>
                            <span className={styles.notificationAvatar}>
                              {item.category === 'clinics' ? <MedicineBoxOutlined /> : null}
                              {item.category === 'users' ? <TeamOutlined /> : null}
                              {item.category === 'posts' ? <FileTextOutlined /> : null}
                            </span>
                            {!item.isRead ? <span className={styles.notificationDot} /> : null}
                          </div>
                          <div>
                            <p className={styles.notificationTitle}>{item.title}</p>
                            <p className={styles.notificationContent}>{item.content}</p>
                            <span className={styles.notificationTime}>{item.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={styles.notificationEmpty}>Không có thông báo chưa đọc.</p>
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
  )
}
