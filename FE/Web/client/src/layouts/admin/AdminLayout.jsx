import {
  AppstoreOutlined,
  BellOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Input } from 'antd'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/Clinic/AuthContext'
import { getPrimaryRole } from '../../constants/authRole'
import { CiHospital1 } from "react-icons/ci";
import { RoleEnum } from '../../enum/role.enum'
import '../../styles/admin/colorsToken.css'
import styles from './AdminLayout.module.css'

const menuItems = [
  { key: 'overview', label: 'Tổng quan', icon: AppstoreOutlined, path: '/admin/home' },
  { key: 'clinics', label: 'Quản lý phòng khám', icon: MedicineBoxOutlined, path: '/admin/dashboard/clinics' },
  { key: 'users', label: 'Quản lý người dùng', icon: TeamOutlined, path: '/admin/dashboard/users' },
  { key: 'posts', label: 'Quản lý bài đăng', icon: FileTextOutlined, path: '/admin/dashboard/posts' },
]

const isMenuActive = (pathname, path) => {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, userProfile, logout, activeRole } = useAuth()
  const effectiveRole = activeRole || (userProfile ? getPrimaryRole(userProfile) : null)

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
            <Input
              className={styles.searchInput}
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              allowClear
            />
            <Badge count={0} showZero={false}>
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
            </Badge>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
