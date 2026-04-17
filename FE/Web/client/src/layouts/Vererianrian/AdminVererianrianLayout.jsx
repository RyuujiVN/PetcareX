import {
    CalendarOutlined,
    FileTextOutlined,
    FormOutlined,
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { Badge, Button, Empty, Form, Input, List, Popover, Select, Tag, Typography, notification } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CiHospital1 } from "react-icons/ci"
import { IoMdNotificationsOutline } from 'react-icons/io'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getNormalizedRoles, getPrimaryRole } from '../../constants/authRole'
import { getRoleLabel } from '../../constants/veterinaryLabels'
import { RoleEnum } from '../../enum/role.enum'
import { useAuth } from '../../hooks/Clinic/AuthContext'
import LanguageSwitcher from '../../components/common/LanguageSwitcher/LanguageSwitcher'
import PortalAccountMenu from '../../components/common/PortalAccountMenu/PortalAccountMenu'
import { LANGUAGE_SCOPE } from '../../constants/languageStorage'
import useNotificationSocket from '../../hooks/useNotificationSocket'
import { getAdminInstance } from '../../services/apiClient'
import { resolveNotificationHref } from '../../services/notificationService'
import '../../styles/vererianrian/colorsToken.css'
import styles from './AdminVererianrianLayout.module.css'

const { Text } = Typography

const buildMenuItems = (t) => [
  {
    key: 'appointments',
    label: t('layout.menu.appointments'),
    icon: CalendarOutlined,
    path: '/veterinarian/appointments',
    activePaths: ['/veterinarian/appointments'],
  },
  {
    key: 'records',
    label: t('layout.menu.records'),
    icon: FileTextOutlined,
    path: '/veterinarian/listRecords',
    activePaths: [
      '/veterinarian/listRecords',
      '/veterinarian/medical-records',
      '/veterinarian/viewRecords',
    ],
  },
  {
    key: 'exam-slips',
    label: t('layout.menu.examForms'),
    icon: FormOutlined,
    path: '/veterinarian/exam-forms',
    activePaths: ['/veterinarian/exam-forms'],
  },
  {
    key: 'forum',
    label: t('layout.menu.forum'),
    icon: MessageOutlined,
    path: '/veterinarian/forum',
    activePaths: ['/veterinarian/forum'],
  },
  {
    key: 'chatbot',
    label: t('layout.menu.chatbot'),
    icon: RobotOutlined,
    path: '/veterinarian/chatbot',
    activePaths: ['/veterinarian/chatbot'],
  },
]

const NOTIFICATION_TYPE_COLORS = {
  appointment: 'blue',
  'ai-diagnosis': 'purple',
  system: 'gold',
	'forum-like': 'geekblue',
	'forum-reply': 'cyan',
  'forum-comment': 'cyan',
}

const getNotificationTypeLabel = (type, t) => {
  if (type === 'appointment') return t('layout.notifications.types.appointment')
  if (type === 'ai-diagnosis') return t('layout.notifications.types.aiDiagnosis')
  if (type === 'system') return t('layout.notifications.types.system')
  if (type === 'forum-like') return t('layout.notifications.types.forumLike')
  if (type === 'forum-reply') return t('layout.notifications.types.forumReply')
  if (type === 'forum-comment') return t('layout.notifications.types.forumComment')
  return t('layout.notifications.types.other')
}

const formatNotificationTimeAgo = (dateValue, t) => {
  const createdAt = new Date(dateValue).getTime()
  if (Number.isNaN(createdAt)) return t('layout.notifications.time.justNow')

  const diff = Date.now() - createdAt
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return t('layout.notifications.time.justNow')
  if (diff < hour) return t('layout.notifications.time.minutesAgo', { count: Math.floor(diff / minute) })
  if (diff < day) return t('layout.notifications.time.hoursAgo', { count: Math.floor(diff / hour) })
  return t('layout.notifications.time.daysAgo', { count: Math.floor(diff / day) })
}

const normalizePath = (path) => {
  if (!path) return '/'
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}

const isPathMatch = (pathname, pathPrefix) => {
  const currentPath = normalizePath(pathname)
  const normalizedPrefix = normalizePath(pathPrefix)
  return currentPath === normalizedPrefix || currentPath.startsWith(`${normalizedPrefix}/`)
}

const isMenuActive = (pathname, item) => {
  const activePaths = item.activePaths?.length ? item.activePaths : [item.path]
  return activePaths.some((pathPrefix) => isPathMatch(pathname, pathPrefix))
}

const getClinicDisplayName = (profile, fallbackName) => {
  return (
    profile?.clinicName ||
    profile?.clinicInfo?.name ||
    profile?.clinic?.name ||
    profile?.veterinarian?.clinic?.name ||
    profile?.adminClinic?.clinic?.name ||
    fallbackName
  )
}

export default function AdminVererianrianLayout() {
  const { t } = useTranslation('vererianrian')
  const location = useLocation()
  const navigate = useNavigate()
  const { token, userProfile, login, logout, refreshUserProfile, activeRole } = useAuth()
  const [notificationApi, notificationContextHolder] = notification.useNotification()
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [notificationFilters, setNotificationFilters] = useState({
    viewMode: 'all',
    eventType: 'all',
  })
  const shownToastIdsRef = useRef(new Set())
  const [, setTimeTick] = useState(0)

  // Force re-render every 30s so time-ago labels stay fresh
  useEffect(() => {
    const id = window.setInterval(() => setTimeTick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])
  const effectiveRole = activeRole || (userProfile ? getPrimaryRole(userProfile) : null)
  const normalizedRoles = userProfile ? getNormalizedRoles(userProfile) : []
  const hasVeterinarianRole = normalizedRoles.includes(RoleEnum.VETERINARIAN)
  const menuItems = useMemo(() => buildMenuItems(t), [t])
  const clinicDisplayName = getClinicDisplayName(userProfile, t('layout.defaultClinicName'))
  const hideSearchRoutes = [
    '/veterinarian/exam-forms/create',
    '/veterinarian/viewRecords',
  ]
  const isExamFormFocusMode = location.pathname === '/veterinarian/exam-forms/create'
  const isViewPetMedicalRecordsRoute =
    location.pathname === '/veterinarian/viewRecords' ||
    location.pathname.startsWith('/veterinarian/viewRecords/')
  const shouldUseMedicalRecordHeader = isViewPetMedicalRecordsRoute && !isExamFormFocusMode

  const {
    notifications: notificationItems,
    readIdSet: notificationReadIdSet,
    unreadCount: unreadNotificationCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    latestIncomingNotification,
  } = useNotificationSocket({
    storageKey: `ws_notif_vet:${userProfile?.id || 'default'}`,
    token,
    enabled: !!token,
    instance: getAdminInstance(),
  })

  const handleNotificationItemClick = useCallback((item) => {
    if (!item?.id) return

    void markNotificationAsRead(item.id)
    setNotificationPopoverOpen(false)

    const targetHref = resolveNotificationHref(item, 'veterinarian')
    if (targetHref) {
      navigate(targetHref)
    }
  }, [markNotificationAsRead, navigate])

  useEffect(() => {
    const notificationId = latestIncomingNotification?.id
    if (!notificationId) return

    if (shownToastIdsRef.current.has(notificationId)) return
    shownToastIdsRef.current.add(notificationId)

    notificationApi.open({
      key: `vet-live-notification-${notificationId}`,
      message: latestIncomingNotification?.title || t('layout.notifications.panelTitle'),
      description: latestIncomingNotification?.description || '',
      placement: 'bottomRight',
      duration: 5,
      onClick: () => handleNotificationItemClick(latestIncomingNotification),
    })
  }, [handleNotificationItemClick, latestIncomingNotification, notificationApi, t])

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
      navigate('/admin/dashboard/clinics', { replace: true })
    }
  }, [token, effectiveRole, hasVeterinarianRole, navigate])

  const notificationContent = (
    <div className={styles.notificationPanel}>
      <div className={styles.notificationPanelHeader}>
        <div>
          <h3>{t('layout.notifications.panelTitle')}</h3>
          <p>
            {t('layout.notifications.summary', {
              unread: unreadNotificationCount,
              total: notificationItems.length,
            })}
          </p>
        </div>
        <Button
          type="link"
          size="small"
          onClick={markAllNotificationsAsRead}
          disabled={unreadNotificationCount === 0}
          className={styles.markAllReadBtn}
        >
          {t('layout.notifications.markAllRead')}
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
              { value: 'all', label: t('layout.notifications.filters.all') },
              { value: 'unread', label: t('layout.notifications.filters.unread') },
            ]}
          />
        </Form.Item>

        <Form.Item name="eventType" className={styles.notificationFilterItem}>
          <Select
            size="middle"
            options={[
              { value: 'all', label: t('layout.notifications.filters.allTypes') },
              { value: 'appointment', label: t('layout.notifications.filters.appointment') },
              { value: 'ai-diagnosis', label: t('layout.notifications.filters.aiDiagnosis') },
				{ value: 'forum-like', label: t('layout.notifications.filters.forumLike') },
				{ value: 'forum-comment', label: t('layout.notifications.filters.forumComment') },
				{ value: 'forum-reply', label: t('layout.notifications.filters.forumReply') },
              { value: 'system', label: t('layout.notifications.filters.system') },
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
              description={t('layout.notifications.empty')}
            />
          ),
        }}
        renderItem={(item) => {
          const isRead = notificationReadIdSet.has(item.id)

          return (
            <List.Item
              key={item.id}
              className={`${styles.notificationItem} ${isRead ? '' : styles.notificationItemUnread}`}
              onClick={() => handleNotificationItemClick(item)}
            >
              <div className={styles.notificationItemTop}>
                <Tag color={NOTIFICATION_TYPE_COLORS[item.type] || 'default'}>
                  {getNotificationTypeLabel(item.type, t)}
                </Tag>
                <Text className={styles.notificationTimeText}>
                  {formatNotificationTimeAgo(item.createdAt, t)}
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
    <div
      className={`${styles.layout} ${isExamFormFocusMode ? styles.layoutFocus : ''} ${!isSidebarVisible || isExamFormFocusMode ? styles.layoutSingleColumn : ''}`}
    >
      {notificationContextHolder}
      {!isExamFormFocusMode && !isSidebarVisible ? (
        <Button
          type="text"
          aria-label={t('layout.aria.toggleSidebar', { defaultValue: 'Show or hide sidebar' })}
          className={styles.sidebarToggleButton}
          icon={<MenuUnfoldOutlined />}
          onClick={() => setIsSidebarVisible(true)}
        />
      ) : null}
      {!isExamFormFocusMode && isSidebarVisible ? (
        <aside className={styles.sidebar}>
          <Button
            type="text"
            aria-label={t('layout.aria.toggleSidebar', { defaultValue: 'Show or hide sidebar' })}
            className={styles.sidebarInlineToggleButton}
            icon={<MenuFoldOutlined />}
            onClick={() => setIsSidebarVisible(false)}
          />

          <div>
            <div className={styles.brandWrap}>
              <div className={styles.brandIcon}>
                <CiHospital1 />
              </div>
              <div>
                <h2>{clinicDisplayName}</h2>
                <p>{t('layout.brandSubtitle')}</p>
              </div>
            </div>

            <nav className={styles.menu}>
              {menuItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={`${styles.menuItem} ${isMenuActive(location.pathname, item) ? styles.menuItemActive : ''}`}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className={styles.profileCard}>
            <PortalAccountMenu
              namespace="vererianrian"
              userProfile={userProfile}
              login={login}
              logout={logout}
              refreshUserProfile={refreshUserProfile}
              onAfterLogout={() => navigate('/login', { replace: true })}
              defaultName={t('layout.defaultDoctorName')}
              defaultMeta={t('layout.defaultDoctorRole')}
              metaText={getRoleLabel(userProfile?.role || 'VETERINARIAN')}
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
                <h1 className={styles.headerTitle}>{t('layout.medicalHeaderTitle')}</h1>
              ) : !shouldHideSearch ? (
                <Input
                  className={styles.searchInput}
                  prefix={<SearchOutlined />}
                  placeholder={t('layout.searchPlaceholder')}
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
                  aria-label={t('layout.aria.openNotifications')}
                  className={styles.notificationBellButton}
                  icon={(
                    <Badge
                      count={unreadNotificationCount}
                      size="small"
                      overflowCount={9}
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
