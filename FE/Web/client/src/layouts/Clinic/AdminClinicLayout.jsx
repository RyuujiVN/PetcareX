import { CalendarOutlined, FileSearchOutlined, KeyOutlined, LineChartOutlined, LogoutOutlined, MedicineBoxOutlined, TeamOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { changePasswordApi } from '../../data/Clinic/api/auth'
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { token, userProfile, logout, login, activeRole } = useAuth()
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
    navigate('/login')
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

  const openChangePasswordModal = () => {
    passwordForm.resetFields()
    setIsChangePasswordOpen(true)
  }

  const closeChangePasswordModal = () => {
    setIsChangePasswordOpen(false)
    passwordForm.resetFields()
  }

  const handleChangePassword = async (values) => {
    try {
      setChangingPassword(true)
      const response = await changePasswordApi({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })

      const newAccessToken = response?.data?.accessToken
      if (newAccessToken) {
        login(newAccessToken, userProfile || undefined)
      }

      message.success(response?.data?.message || 'Đổi mật khẩu thành công')
      closeChangePasswordModal()
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Không thể đổi mật khẩu')
    } finally {
      setChangingPassword(false)
    }
  }

  const profileMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin',
      onClick: () => navigate('/clinic/profile'),
    },
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: openChangePasswordModal,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ]

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
          </nav>
        </div>

        <Dropdown
          menu={{ items: profileMenuItems }}
          trigger={['click']}
          placement="topLeft"
          overlayClassName={styles.profileMenuOverlay}
        >
          <button
            type="button"
            className={`${styles.profileBox} ${isMenuActive(location.pathname, '/clinic/profile') ? styles.profileBoxActive : ''}`}
          >
            <div className={styles.profileInfo}>
              <Avatar size={42} src={userProfile?.avatarUrl || undefined} icon={<UserOutlined />} />
              <div>
                <h4>{userProfile?.fullName || 'Người dùng'}</h4>
                <p>{getRoleLabel(userProfile?.role || 'ADMIN_CLINIC', 'vi')}</p>
              </div>
            </div>
          </button>
        </Dropdown>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>

      <Modal
        title="Đổi mật khẩu"
        open={isChangePasswordOpen}
        onCancel={closeChangePasswordModal}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          autoComplete="off"
        >
          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu cũ" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: 'Mật khẩu phải có chữ hoa, chữ thường và số',
              },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <div className={styles.passwordActions}>
            <Button onClick={closeChangePasswordModal}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={changingPassword}>
              Lưu mật khẩu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
