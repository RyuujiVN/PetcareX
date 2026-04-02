import { CalendarOutlined, EditOutlined, FileSearchOutlined, HomeOutlined, LineChartOutlined, LogoutOutlined, MedicineBoxOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, message } from 'antd'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/Clinic/AuthContext'
import { getNormalizedRoles, getPrimaryRole } from '../../constants/authRole'
import { ADMIN_AUTH_STORAGE } from '../../constants/authStorage'
import { RoleEnum } from '../../enum/role.enum'
import { getRoleLabel } from '../../constants/veterinaryLabels'
import { getCurrentAdminClinicId } from '../../utils/clinicIdentity'
import styles from './AdminClinicLayout.module.css'

const menuItems = [
  { key: 'appointments', label: 'Lịch hẹn', icon: CalendarOutlined, path: '/clinic/appointments' },
  { key: 'records', label: 'Sổ y tế điện tử', icon: MedicineBoxOutlined, path: '/clinic/medical-records' },
  { key: 'revenue', label: 'Doanh thu', icon: LineChartOutlined, path: '/clinic/revenue' },
  { key: 'doctors', label: 'Bác sĩ', icon: TeamOutlined, path: '/clinic/veterinarians' },
  { key: 'forms', label: 'Xem phiếu khám', icon: FileSearchOutlined, path: '/clinic/exam-slips' },
]

const isMenuActive = (pathname, path) => {
  if (path === '/clinic/appointments') {
    return pathname === '/admin/home' || pathname === '/clinic/appointments'
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

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

const handoffAdminAuthToNewTab = () => {
  const authKeys = [
    ADMIN_AUTH_STORAGE.tokenKey,
    ADMIN_AUTH_STORAGE.userInfoKey,
    ADMIN_AUTH_STORAGE.activeRoleKey,
  ]

  try {
    authKeys.forEach((key) => {
      const value = window.sessionStorage.getItem(key)
      if (value !== null) {
        window.localStorage.setItem(key, value)
      }
    })
  } catch {
    // Ignore storage access failures and let existing auth flow handle fallback.
  }
}

export default function AdminClinicLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, userProfile, logout, activeRole } = useAuth()
  const effectiveRole = activeRole || (userProfile ? getPrimaryRole(userProfile) : null)
  const normalizedRoles = userProfile ? getNormalizedRoles(userProfile) : []
  const hasClinicRole = normalizedRoles.includes(RoleEnum.ADMIN_CLINIC)
  const clinicDisplayName = getClinicDisplayName(userProfile)
  const clinicId = getCurrentAdminClinicId(userProfile)

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (!effectiveRole) return

    // If user has both roles, keep current clinic portal instead of forcing veterinarian portal.
    if (effectiveRole === RoleEnum.VETERINARIAN && !hasClinicRole) {
      navigate('/veterinarian/appointments', { replace: true })
      return
    }

    if (effectiveRole === RoleEnum.ADMIN) {
      navigate('/admin/home', { replace: true })
    }
  }, [token, effectiveRole, hasClinicRole, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const openHomePageEditor = () => {
    if (!clinicId) {
      message.error('Không xác định được clinicId của phòng khám hiện tại')
      return
    }

    handoffAdminAuthToNewTab()

    const editorUrl = `${window.location.origin}/clinic/home-editor/${clinicId}`
    window.open(editorUrl, '_blank', 'noopener,noreferrer')
  }

  const openClinicSelectionEditor = () => {
    if (!clinicId) {
      message.error('Không xác định được clinicId của phòng khám hiện tại')
      return
    }

    handoffAdminAuthToNewTab()

    const editorUrl = `${window.location.origin}/clinic/clinic-editor/${clinicId}`
    window.open(editorUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brandBox}>
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

            <button
              type="button"
              onClick={openHomePageEditor}
              className={`${styles.menuItem} ${styles.menuButton} ${location.pathname.startsWith('/clinic/home-editor/') ? styles.menuItemActive : ''}`}
            >
              <HomeOutlined />
              <span>Chỉnh Sửa Trang Chủ</span>
            </button>

            <button
              type="button"
              onClick={openClinicSelectionEditor}
              className={`${styles.menuItem} ${styles.menuButton} ${location.pathname.startsWith('/clinic/clinic-editor/') ? styles.menuItemActive : ''}`}
            >
              <EditOutlined />
              <span>Chỉnh Sửa Phòng Khám</span>
            </button>
          </nav>
        </div>

        <div className={styles.profileBox}>
          <div className={styles.profileInfo}>
            <Avatar size={42} src={userProfile?.avatarUrl || undefined} icon={<UserOutlined />} />
            <div>
              <h4>{userProfile?.fullName || 'Người dùng'}</h4>
              <p>{getRoleLabel(userProfile?.role || 'ADMIN_CLINIC', 'vi')}</p>
            </div>
          </div>

          <Button
            type="text"
            icon={<LogoutOutlined />}
            className={styles.logoutBtn}
            onClick={handleLogout}
            aria-label="Đăng xuất"
          >
            {/* <span className={styles.logoutText}>Đăng xuất</span> */}
          </Button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
