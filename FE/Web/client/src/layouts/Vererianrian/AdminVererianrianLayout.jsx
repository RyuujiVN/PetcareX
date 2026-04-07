import {
  CalendarOutlined,
  FileTextOutlined,
  FormOutlined,
  LogoutOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Avatar, Badge, Button, Empty, Form, Input, List, Popover, Select, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { CiHospital1 } from "react-icons/ci"
import { IoMdNotificationsOutline } from 'react-icons/io'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getNormalizedRoles, getPrimaryRole } from '../../constants/authRole'
import { getRoleLabel } from '../../constants/veterinaryLabels'
import { RoleEnum } from '../../enum/role.enum'
import { useAuth } from '../../hooks/Clinic/AuthContext'
import LanguageSwitcher from '../../components/common/LanguageSwitcher/LanguageSwitcher'
import { LANGUAGE_SCOPE } from '../../constants/languageStorage'
import '../../styles/vererianrian/colorsToken.css'
import styles from './AdminVererianrianLayout.module.css'

const { Text } = Typography

const menuItems = [
  { key: 'appointments', label: 'Lịch hẹn', icon: CalendarOutlined, path: '/veterinarian/appointments' },
  { key: 'records', label: 'Hồ sơ bệnh án', icon: FileTextOutlined, path: '/veterinarian/listRecords' },
  { key: 'exam-slips', label: 'Phiếu khám', icon: FormOutlined, path: '/veterinarian/exam-forms' },
]

const NOTIFICATION_TYPE_COLORS = {
  appointment: 'blue',
  record: 'geekblue',
  examSlip: 'orange',
  system: 'gold',
}

const getNotificationTypeLabel = (type) => {
  if (type === 'appointment') return 'Lịch hẹn'
  if (type === 'record') return 'Hồ sơ bệnh án'
  if (type === 'examSlip') return 'Phiếu khám'
  if (type === 'system') return 'Hệ thống'
  return 'Khác'
}

const buildMockVeterinarianNotifications = (clinicName) => {
  const now = Date.now()
  const createTime = (minutesAgo) => new Date(now - minutesAgo * 60 * 1000).toISOString()

  return [
    {
      id: 'vet-notify-01',
      type: 'appointment',
      createdAt: createTime(6),
      title: 'Có lịch hẹn khám mới trong hôm nay',
      description: `Lịch hẹn mới cho bé Misa tại ${clinicName} lúc 10:15 đã được xác nhận.`,
    },
    {
      id: 'vet-notify-02',
      type: 'appointment',
      createdAt: createTime(42),
      title: 'Lịch hẹn đã được khách cập nhật',
      description: 'Khách hàng Trần Bảo An dời lịch tái khám của bé Gấu từ 14:30 sang 16:00.',
    },
    {
      id: 'vet-notify-03',
      type: 'record',
      createdAt: createTime(130),
      title: 'Có hồ sơ bệnh án cần hoàn thiện',
      description: 'Hồ sơ MR-5412 của bé Mèo Mun còn thiếu mục chẩn đoán sau điều trị.',
    },
    {
      id: 'vet-notify-04',
      type: 'examSlip',
      createdAt: createTime(255),
      title: 'Phiếu khám đang chờ ký xác nhận',
      description: 'Phiếu khám EX-884 cho ca nội soi tai của bé Corgi cần bạn xác nhận trước 18:00.',
    },
    {
      id: 'vet-notify-05',
      type: 'system',
      createdAt: createTime(980),
      title: 'Nhắc nhở lịch trực ngày mai',
      description: 'Bạn có 8 lịch hẹn ngày mai. Vui lòng kiểm tra lại khung giờ và trạng thái chuẩn bị.',
    },
  ]
}

const formatNotificationTimeAgo = (dateValue) => {
  const createdAt = new Date(dateValue).getTime()
  if (Number.isNaN(createdAt)) return 'Vừa xong'

  const diff = Date.now() - createdAt
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return 'Vừa xong'
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`
  return `${Math.floor(diff / day)} ngày trước`
}

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
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false)
  const [notificationReadIds, setNotificationReadIds] = useState([])
  const [notificationFilters, setNotificationFilters] = useState({
    viewMode: 'all',
    eventType: 'all',
  })
  const effectiveRole = activeRole || (userProfile ? getPrimaryRole(userProfile) : null)
  const normalizedRoles = userProfile ? getNormalizedRoles(userProfile) : []
  const hasVeterinarianRole = normalizedRoles.includes(RoleEnum.VETERINARIAN)
  const clinicDisplayName = getClinicDisplayName(userProfile)
  const hideSearchRoutes = [
    '/veterinarian/exam-forms/create',
    '/veterinarian/viewRecords',
  ]
  const isExamFormFocusMode = location.pathname === '/veterinarian/exam-forms/create'
  const isViewPetMedicalRecordsRoute =
    location.pathname === '/veterinarian/viewRecords' ||
    location.pathname.startsWith('/veterinarian/viewRecords/')
  const shouldUseMedicalRecordHeader = isViewPetMedicalRecordsRoute && !isExamFormFocusMode
  const notificationItems = useMemo(
    () => buildMockVeterinarianNotifications(clinicDisplayName),
    [clinicDisplayName],
  )
  const notificationReadIdSet = useMemo(() => new Set(notificationReadIds), [notificationReadIds])
  const unreadNotificationCount = useMemo(
    () =>
      notificationItems.reduce(
        (count, item) => (notificationReadIdSet.has(item.id) ? count : count + 1),
        0,
      ),
    [notificationItems, notificationReadIdSet],
  )
  const filteredNotificationItems = useMemo(() => {
    return notificationItems.filter((item) => {
      if (notificationFilters.viewMode === 'unread' && notificationReadIdSet.has(item.id)) {
        return false
      }

      if (notificationFilters.eventType !== 'all' && item.type !== notificationFilters.eventType) {
        return false
      }

      return true
    })
  }, [notificationFilters, notificationItems, notificationReadIdSet])

  const shouldHideSearch = hideSearchRoutes.includes(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const markNotificationAsRead = (notificationId) => {
    if (!notificationId) return

    setNotificationReadIds((prev) => {
      if (prev.includes(notificationId)) return prev
      return [...prev, notificationId]
    })
  }

  const markAllNotificationsAsRead = () => {
    setNotificationReadIds(notificationItems.map((item) => item.id))
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

  const notificationContent = (
    <div className={styles.notificationPanel}>
      <div className={styles.notificationPanelHeader}>
        <div>
          <h3>Thông báo bác sĩ</h3>
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
            viewMode: values.viewMode || 'all',
            eventType: values.eventType || 'all',
          })
        }}
      >
        <Form.Item name="viewMode" className={styles.notificationFilterItem}>
          <Select
            size="middle"
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'unread', label: 'Chưa đọc' },
            ]}
          />
        </Form.Item>

        <Form.Item name="eventType" className={styles.notificationFilterItem}>
          <Select
            size="middle"
            options={[
              { value: 'all', label: 'Mọi loại' },
              { value: 'appointment', label: 'Lịch hẹn' },
              { value: 'record', label: 'Hồ sơ bệnh án' },
              { value: 'examSlip', label: 'Phiếu khám' },
              { value: 'system', label: 'Hệ thống' },
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
          const isRead = notificationReadIdSet.has(item.id)

          return (
            <List.Item
              key={item.id}
              className={`${styles.notificationItem} ${isRead ? '' : styles.notificationItemUnread}`}
              onClick={() => markNotificationAsRead(item.id)}
            >
              <div className={styles.notificationItemTop}>
                <Tag color={NOTIFICATION_TYPE_COLORS[item.type] || 'default'}>
                  {getNotificationTypeLabel(item.type)}
                </Tag>
                <Text className={styles.notificationTimeText}>
                  {formatNotificationTimeAgo(item.createdAt)}
                </Text>
              </div>

              <Text strong className={styles.notificationTitleText}>
                {item.title}
              </Text>
              <Text className={styles.notificationDescText}>{item.description}</Text>
            </List.Item>
          )
        }}
      />
    </div>
  )

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
              <p>{getRoleLabel(userProfile?.role || 'VETERINARIAN')}</p>
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
          <header
            className={`${styles.header} ${shouldUseMedicalRecordHeader ? styles.headerMedicalRecord : ''}`}
          >
            <div className={styles.headerSearchWrap}>
              {shouldUseMedicalRecordHeader ? (
                <h1 className={styles.headerTitle}>Hồ sơ y tế điện tử</h1>
              ) : !shouldHideSearch ? (
                <Input
                  className={styles.searchInput}
                  prefix={<SearchOutlined />}
                  placeholder="Tìm kiếm thú cưng, chủ nuôi..."
                />
              ) : null}
            </div>

            <div className={styles.headerActions}>
              <LanguageSwitcher scope={LANGUAGE_SCOPE.veterinarian} />

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
                  aria-label="Xem thông báo bác sĩ"
                  className={styles.notificationBellButton}
                  icon={(
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
                  )}
                />
              </Popover>
            </div>
          </header>
        ) : null}

        <section className={`${styles.content} ${isExamFormFocusMode ? styles.contentFocus : ''}`}>
          <Outlet />
        </section>
      </main>
    </div>
  )
}
