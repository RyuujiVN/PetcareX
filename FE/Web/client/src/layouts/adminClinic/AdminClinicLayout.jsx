import { CalendarOutlined, FileSearchOutlined, LineChartOutlined, MedicineBoxOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/adminClinic/AuthContext'
import { getRoleLabel } from '../../constants/veterinaryLabels'
import styles from './AdminClinicLayout.module.css'

const menuItems = [
  { key: 'appointments', label: 'Lịch hẹn', icon: CalendarOutlined, path: '/admin/clinic/appointments' },
  { key: 'records', label: 'Sổ y tế điện tử', icon: MedicineBoxOutlined, path: '/admin/clinic/medical-records' },
  { key: 'revenue', label: 'Doanh thu', icon: LineChartOutlined, path: '/admin/clinic/revenue' },
  { key: 'doctors', label: 'Bác sĩ', icon: TeamOutlined, path: '/admin/clinic/veterinarians' },
  { key: 'forms', label: 'Xem phiếu khám', icon: FileSearchOutlined, path: '/admin/clinic/exam-slips' },
]

const isMenuActive = (pathname, path) => {
  if (path === '/admin/clinic/appointments') {
    return pathname === '/admin/home' || pathname === '/admin/clinic/appointments'
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function AdminClinicLayout() {
  const location = useLocation()
  const { userProfile } = useAuth()

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brandBox}>
            <div className={styles.brandIcon}>
              <MedicineBoxOutlined />
            </div>
            <div>
              <h2>Petcar</h2>
              <p>PetcareX</p>
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

        <NavLink
          to="/admin/clinic/profile"
          className={`${styles.profileBox} ${isMenuActive(location.pathname, '/admin/clinic/profile') ? styles.profileBoxActive : ''}`}
        >
          <div className={styles.profileInfo}>
            <Avatar size={42} src={userProfile?.avatarUrl || undefined} icon={<UserOutlined />} />
            <div>
              <h4>{userProfile?.fullName || 'Người dùng'}</h4>
              <p>{getRoleLabel(userProfile?.role || 'ADMIN_CLINIC', 'vi')}</p>
            </div>
          </div>
        </NavLink>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
