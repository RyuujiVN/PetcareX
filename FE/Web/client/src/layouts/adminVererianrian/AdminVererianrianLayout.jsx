import {
  CalendarOutlined,
  FileTextOutlined,
  FormOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Input } from 'antd'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/adminClinic/AuthContext'
import { getRoleLabel } from '../../constants/veterinaryLabels'
import styles from './AdminVererianrianLayout.module.css'

const menuItems = [
  { key: 'appointments', label: 'Lịch hẹn', icon: CalendarOutlined, path: '/admin/veterinarian/appointments' },
  { key: 'records', label: 'Hồ sơ bệnh án', icon: FileTextOutlined, path: '/admin/veterinarian/listRecords' },
  { key: 'exam-slips', label: 'Phiếu khám', icon: FormOutlined, path: '/admin/veterinarian/exam-forms' },
]

const isMenuActive = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`)

const getClinicDisplayName = (profile) => {
  return (
    profile?.clinicName ||
    profile?.clinicInfo?.name ||
    profile?.clinic?.name ||
    profile?.veterinarian?.clinic?.name ||
    profile?.adminClinic?.clinic?.name ||
    'PetCareX'
  )
}

export default function AdminVererianrianLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userProfile, logout } = useAuth()
  const clinicDisplayName = getClinicDisplayName(userProfile)
  const hideSearchRoutes = [
    '/admin/veterinarian/exam-forms/create',
  ]

  const shouldHideSearch = hideSearchRoutes.includes(location.pathname)
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brandWrap}>
            <div className={styles.brandIcon}>
              <MedicineBoxOutlined />
            </div>
            <div>
              <h2>{clinicDisplayName}</h2>
              <p>PetcareX</p>
            </div>
          </div>

          <nav className={styles.menu}>
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isMenuActive(location.pathname, item.path)

              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className={styles.profileCard}>
          <Avatar size={44} src={userProfile?.avatarUrl || undefined} icon={<UserOutlined />} />
          <div className={styles.profileMeta}>
            <h4>{userProfile?.fullName || 'Bác sĩ'}</h4>
            <p>{getRoleLabel(userProfile?.role || 'VETERINARIAN', 'vi')}</p>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            className={styles.logoutBtn}
            onClick={handleLogout}
            aria-label="Đăng xuất"
          />
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          {!shouldHideSearch && (
            <Input
              className={styles.searchInput}
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm thú cưng, chủ nuôi..."
            />
          )}
        </header>

        <section className={styles.content}>
          <Outlet />
        </section>
      </main>
    </div>
  )
}
