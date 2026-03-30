import { CalendarOutlined, FileSearchOutlined, KeyOutlined, LineChartOutlined, LogoutOutlined, MedicineBoxOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Form, Input, Modal, message } from 'antd'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { changePasswordApi } from '../../data/adminClinic/api/auth'
import { useAuth } from '../../hooks/adminClinic/AuthContext'
import { getPrimaryRole } from '../../constants/authRole'
import { RoleEnum } from '../../enum/role.enum'
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

export default function AdminClinicLayout() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const { token, userProfile, logout, login, activeRole } = useAuth()
  const effectiveRole = activeRole || (userProfile ? getPrimaryRole(userProfile) : null)
  const clinicDisplayName = getClinicDisplayName(userProfile)

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (!effectiveRole) return

    if (effectiveRole === RoleEnum.VETERINARIAN) {
      navigate('/admin/veterinarian/appointments', { replace: true })
      return
    }

    if (effectiveRole === RoleEnum.ADMIN) {
      navigate('/admin/home', { replace: true })
    }
  }, [token, effectiveRole, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
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
      onClick: () => navigate('/admin/clinic/profile'),
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
            className={`${styles.profileBox} ${isMenuActive(location.pathname, '/admin/clinic/profile') ? styles.profileBoxActive : ''}`}
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
