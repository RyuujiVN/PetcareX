import {
  CalendarOutlined,
  FileTextOutlined,
  FormOutlined,
  LogoutOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Avatar, Button, Input } from 'antd'
import { useEffect } from 'react'
import { CiHospital1 } from "react-icons/ci"
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getNormalizedRoles, getPrimaryRole } from '../../constants/authRole'
import { getRoleLabel } from '../../constants/veterinaryLabels'
import { RoleEnum } from '../../enum/role.enum'
import { useAuth } from '../../hooks/Clinic/AuthContext'
import '../../styles/vererianrian/colorsToken.css'
import styles from './AdminVererianrianLayout.module.css'

const menuItems = [
  { key: 'appointments', label: 'Lịch hẹn', icon: CalendarOutlined, path: '/veterinarian/appointments' },
  { key: 'records', label: 'Hồ sơ bệnh án', icon: FileTextOutlined, path: '/veterinarian/listRecords' },
  { key: 'exam-slips', label: 'Phiếu khám', icon: FormOutlined, path: '/veterinarian/exam-forms' },
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
  const { token, userProfile, logout, activeRole } = useAuth()
  const effectiveRole = activeRole || (userProfile ? getPrimaryRole(userProfile) : null)
  const normalizedRoles = userProfile ? getNormalizedRoles(userProfile) : []
  const hasVeterinarianRole = normalizedRoles.includes(RoleEnum.VETERINARIAN)
  const clinicDisplayName = getClinicDisplayName(userProfile)
  const hideSearchRoutes = [
    '/veterinarian/exam-forms/create',
    '/veterinarian/viewRecords',
  ]
  const isExamFormFocusMode = location.pathname === '/veterinarian/exam-forms/create'

  const shouldHideSearch = hideSearchRoutes.includes(location.pathname)
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (!effectiveRole) return

    // If user has both roles, keep current veterinarian portal instead of forcing clinic portal.
    if (effectiveRole === RoleEnum.ADMIN_CLINIC && !hasVeterinarianRole) {
      navigate('/clinic/appointments', { replace: true })
      return
    }

    if (effectiveRole === RoleEnum.ADMIN) {
      navigate('/admin/home', { replace: true })
    }
  }, [token, effectiveRole, hasVeterinarianRole, navigate])

  return (
    <div className={`${styles.layout} ${isExamFormFocusMode ? styles.layoutFocus : ''}`}>
      {!isExamFormFocusMode ? (
        <aside className={styles.sidebar}>
          <div>
            <div className={styles.brandWrap}>
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
      ) : null}

      <main className={`${styles.main} ${isExamFormFocusMode ? styles.mainFocus : ''}`}>
        {!isExamFormFocusMode ? (
          <header className={styles.header}>
            {!shouldHideSearch && (
              <Input
                className={styles.searchInput}
                prefix={<SearchOutlined />}
                placeholder="Tìm kiếm thú cưng, chủ nuôi..."
              />
            )}
          </header>
        ) : null}

        <section className={`${styles.content} ${isExamFormFocusMode ? styles.contentFocus : ''}`}>
          <Outlet />
        </section>
      </main>
    </div>
  )
}
