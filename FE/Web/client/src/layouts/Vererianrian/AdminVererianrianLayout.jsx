import {
    CalendarOutlined,
    FormOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MessageOutlined,
    RobotOutlined,
    SearchOutlined
} from '@ant-design/icons'
import { Badge, Button, Input, Popover, notification } from 'antd'
import { MessageCircle } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../../components/common/LanguageSwitcher/LanguageSwitcher'
import PortalAccountMenu from '../../components/common/PortalAccountMenu/PortalAccountMenu'
import UnifiedNotificationPanel from '../../components/common/UnifiedNotificationPanel/UnifiedNotificationPanel'
import { getNormalizedRoles, getPrimaryRole } from '../../constants/authRole'
import { LANGUAGE_SCOPE } from '../../constants/languageStorage'
import { getRoleLabel } from '../../constants/veterinaryLabels'
import { RoleEnum } from '../../enum/role.enum'
import { useAuth } from '../../hooks/Clinic/AuthContext'
import useNotificationSocket from '../../hooks/useNotificationSocket'
import { getAdminInstance } from '../../services/apiClient'
import { resolveNotificationHref } from '../../services/notificationService'
import '../../styles/vererianrian/colorsToken.css'
import styles from './AdminVererianrianLayout.module.css'

const buildMenuItems = (t) => [
  {
    key: 'appointments',
    label: t('layout.menu.appointments'),
    icon: CalendarOutlined,
    path: '/veterinarian/appointments',
    activePaths: ['/veterinarian/appointments'],
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
  const [notificationFilter, setNotificationFilter] = useState('all')
  const [notificationLastSyncedAt, setNotificationLastSyncedAt] = useState('')
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
  const isChatbotRoute =
    location.pathname === '/veterinarian/chatbot' ||
    location.pathname.startsWith('/veterinarian/chatbot/')
  const isViewPetMedicalRecordsRoute =
    location.pathname === '/veterinarian/viewRecords' ||
    location.pathname.startsWith('/veterinarian/viewRecords/')
  const shouldUseMedicalRecordHeader = isViewPetMedicalRecordsRoute && !isExamFormFocusMode
  const isForumRoute =
    location.pathname === '/veterinarian/forum' ||
    location.pathname.startsWith('/veterinarian/forum/')

  const {
    notifications: notificationItems,
    readIdSet: notificationReadIdSet,
    unreadCount: unreadNotificationCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    loading: notificationLoading,
    refreshNotifications,
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

  useEffect(() => {
    if (!token) {
      setNotificationLastSyncedAt('')
      return
    }

    setNotificationLastSyncedAt(new Date().toISOString())
  }, [notificationItems, token])

  const handleRefreshNotifications = useCallback(async () => {
    await refreshNotifications()
    setNotificationLastSyncedAt(new Date().toISOString())
  }, [refreshNotifications])

  const buildForumActionText = useCallback(
    (notificationItem, actionType) => {
      if (actionType === 'like') {
        return t('layout.notifications.events.forumActionLike', {
          defaultValue: 'liked your post',
        })
      }

      if (actionType === 'reply') {
        return t('layout.notifications.events.forumActionReply', {
          defaultValue: 'replied to your comment',
        })
      }

      return t('layout.notifications.events.forumActionComment', {
        defaultValue: 'commented on your post',
      })
    },
    [t],
  )

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
    <UnifiedNotificationPanel
      title={t('layout.notifications.panelTitle')}
      refreshLabel={t('layout.notifications.refresh', {
        defaultValue: 'Làm mới',
      })}
      markReadLabel={t('layout.notifications.markAllRead')}
      allLabel={t('layout.notifications.filters.all')}
      unreadLabel={t('layout.notifications.filters.unread')}
      emptyLabel={t('layout.notifications.empty')}
      syncedAtLabel={t('layout.notifications.syncedAt', {
        defaultValue: 'Cập nhật lúc',
      })}
      forumActorFallbackLabel={t('layout.notifications.forumActorFallback', {
        defaultValue: 'Người dùng',
      })}
      notifications={notificationItems}
      readIdSet={notificationReadIdSet}
      unreadCount={unreadNotificationCount}
      loading={notificationLoading}
      filterMode={notificationFilter}
      onFilterModeChange={setNotificationFilter}
      onRefresh={handleRefreshNotifications}
      onMarkAllRead={markAllNotificationsAsRead}
      onItemClick={handleNotificationItemClick}
      formatTimeAgo={(value) => formatNotificationTimeAgo(value, t)}
      buildForumActionText={buildForumActionText}
      lastSyncedAt={notificationLastSyncedAt}
    />
  )

  return (
    <div
      className={`${styles.layout} ${isExamFormFocusMode ? styles.layoutFocus : ''} ${!isSidebarVisible || isExamFormFocusMode ? styles.layoutSingleColumn : ''} ${isChatbotRoute ? styles.chatbotRouteActive : ''}`}
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
                <img
                  src="/avatarProject.png"
                  alt={clinicDisplayName}
                  className={styles.brandImage}
                />
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
              {isChatbotRoute ? (
                <div className={styles.chatbotHeaderTitle}>
                  <MessageCircle size={18} />
                  <span>{t('pages.chatbot.assistantTitle')}</span>
                </div>
              ) : shouldUseMedicalRecordHeader ? (
                <h1 className={styles.headerTitle}>{t('layout.medicalHeaderTitle')}</h1>
              ) : isForumRoute ? (
                <div
                  id="forum-search-slot-vet"
                  className={styles.forumHeaderSearchSlot}
                />
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

        <section className={`${styles.content} ${isExamFormFocusMode ? styles.contentFocus : ''} ${isChatbotRoute ? styles.contentChatbot : ''}`}>
          <Outlet />
        </section>
      </main>
    </div>
  )
}
