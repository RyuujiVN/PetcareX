import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    LeftOutlined,
    PlayCircleOutlined,
    RightOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Col, Flex, message, Row, Segmented, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ADMIN_AUTH_STORAGE, getAdminAuthItem } from '../../../constants/authStorage'
import { getAdminInstance } from '../../../services/apiClient'
import {
    APPOINTMENT_STATUS,
    getMyAppointmentsApi,
    updateAppointmentStatusApi,
} from '../../../services/appointmentService'
import { formatTimeHHMM } from '../../../utils/dateTimeFormat'
import { getServiceLabel } from '../../../utils/enumLabel'
import styles from './petAppointmentVererianrian.module.css'

const PAGE_SIZE = 4
const TODAY_DATE = new Date().toISOString().slice(0, 10)

const getCurrentVeterinarianUserId = () => {
  try {
    const raw = getAdminAuthItem(ADMIN_AUTH_STORAGE.userInfoKey)
    if (!raw) return ''

    const profile = JSON.parse(raw)
    return profile?.id || profile?.user?.id || ''
  } catch {
    return ''
  }
}

const normalizeTime = (value) => formatTimeHHMM(value, '--:--')

const mapStatusClass = (status) => {
  if (status === APPOINTMENT_STATUS.IN_PROGRESS) return 'statusInProgress'
  if (status === APPOINTMENT_STATUS.COMPLETED) return 'statusConfirmed'
  return 'statusUpcoming'
}

const mapServiceClass = (service) => {
  const normalized = String(service || '').toUpperCase()
  if (normalized.includes('PHẪU')) return 'serviceSurgery'
  if (normalized.includes('TIÊM') || normalized.includes('VACC')) return 'serviceVaccine'
  return 'serviceGeneral'
}

const toRow = (item, t) => {
  const pet = item?.pet || {}
  const owner = pet?.owner || {}

  return {
    id: item?.id,
    status: item?.status,
    petName: pet?.name || t('appointments.states.notUpdated'),
    ownerName: owner?.fullName || t('appointments.states.notUpdated'),
    petAvatar: pet?.avatar || '',
    service: getServiceLabel(item?.service, item?.service || t('appointments.states.notUpdated')),
    time: normalizeTime(item?.appointmentTime),
    medicalId: item?.medical?.id || '',
  }
}

const buildAppointmentsSignature = (items) =>
  items
    .map((item) => `${item.id || ''}:${item.status || ''}:${item.time || ''}:${item.ownerName || ''}`)
    .join('|')

export default function PetAppointmentVererianrian() {
  const { t } = useTranslation('vererianrian')
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [allAppointments, setAllAppointments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const inFlightRef = useRef(false)
  const hasLoadedOnceRef = useRef(false)
  const lastDataSignatureRef = useRef('')
  const updatingIdsRef = useRef(new Set())

  const getStatusLabel = useCallback(
    (status) => {
      if (status === APPOINTMENT_STATUS.BOOKED) return t('appointments.status.booked')
      if (status === APPOINTMENT_STATUS.IN_PROGRESS) return t('appointments.status.inProgress')
      if (status === APPOINTMENT_STATUS.COMPLETED) return t('appointments.status.completed')
      if (status === APPOINTMENT_STATUS.CANCELLED) return t('appointments.status.cancelled')
      return status || t('common.states.unknown')
    },
    [t],
  )

  const tableTabs = useMemo(
    () => [
      { label: t('appointments.tabs.all'), value: 'all' },
      { label: getStatusLabel(APPOINTMENT_STATUS.IN_PROGRESS), value: 'inProgress' },
      { label: getStatusLabel(APPOINTMENT_STATUS.COMPLETED), value: 'completed' },
    ],
    [getStatusLabel, t],
  )

  const fetchTodayAppointments = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) {
      return
    }

    inFlightRef.current = true

    try {
      if (!hasLoadedOnceRef.current && !silent) {
        setLoading(true)
      }

      if (hasLoadedOnceRef.current && silent) {
        setIsRefreshing(true)
      }

      const response = await getMyAppointmentsApi(getAdminInstance(), {
        page: 1,
        limit: 500,
        date: TODAY_DATE,
      })

      const currentUserId = getCurrentVeterinarianUserId()
      const items = Array.isArray(response?.items) ? response.items : []

      const filtered = items
        .filter((item) => item?.status !== APPOINTMENT_STATUS.CANCELLED)
        .filter((item) => {
          if (!currentUserId) return true
          const veterinarianUserId = item?.veterinarian?.user?.id
          return String(veterinarianUserId || '') === String(currentUserId)
        })
        .map((item) => toRow(item, t))
        .sort((a, b) => String(a.time).localeCompare(String(b.time)))

      const nextSignature = buildAppointmentsSignature(filtered)
      if (nextSignature !== lastDataSignatureRef.current) {
        lastDataSignatureRef.current = nextSignature
        setAllAppointments(filtered)
      }

      hasLoadedOnceRef.current = true
    } catch (error) {
      setAllAppointments([])
      message.error(error?.message || t('appointments.messages.loadError'))
    } finally {
      inFlightRef.current = false
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    fetchTodayAppointments()

    const intervalId = window.setInterval(() => fetchTodayAppointments({ silent: true }), 10000)
    const onFocus = () => fetchTodayAppointments({ silent: true })
    const onVisibilityChange = () => {
      if (!document.hidden) fetchTodayAppointments({ silent: true })
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchTodayAppointments])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const stats = useMemo(() => {
    const today = allAppointments.length
    const inProgress = allAppointments.filter((item) => item.status === APPOINTMENT_STATUS.IN_PROGRESS).length
    const completed = allAppointments.filter((item) => item.status === APPOINTMENT_STATUS.COMPLETED).length

    return {
      today,
      inProgress,
      completed,
    }
  }, [allAppointments])

  const summaryCards = useMemo(
    () => [
      {
        key: 'today',
        icon: <CalendarOutlined />,
        title: t('appointments.summary.today'),
        value: stats.today,
        iconClassName: 'summaryIconGreen',
      },
      {
        key: 'inProgress',
        icon: <ClockCircleOutlined />,
        title: getStatusLabel(APPOINTMENT_STATUS.IN_PROGRESS),
        value: stats.inProgress,
        iconClassName: 'summaryIconOrange',
      },
      {
        key: 'completed',
        icon: <CheckCircleOutlined />,
        title: getStatusLabel(APPOINTMENT_STATUS.COMPLETED),
        value: stats.completed,
        iconClassName: 'summaryIconBlue',
      },
    ],
    [getStatusLabel, stats, t],
  )

  const filteredAppointments = useMemo(() => {
    if (activeTab === 'inProgress') {
      return allAppointments.filter((item) => item.status === APPOINTMENT_STATUS.IN_PROGRESS)
    }

    if (activeTab === 'completed') {
      return allAppointments.filter((item) => item.status === APPOINTMENT_STATUS.COMPLETED)
    }

    return allAppointments
  }, [activeTab, allAppointments])

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredAppointments.slice(startIndex, startIndex + PAGE_SIZE)
  }, [currentPage, filteredAppointments])

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))

  const openExamFormInNewTab = (appointmentId) => {
    if (!appointmentId) return
    const url = `/veterinarian/exam-forms/create?appointmentId=${encodeURIComponent(String(appointmentId))}`
    window.open(url, '_blank')
  }

  const handleStart = async (appointment) => {
    if (!appointment?.id) return

    openExamFormInNewTab(appointment.id)

    if (appointment.status === APPOINTMENT_STATUS.IN_PROGRESS) {
      return
    }

    if (updatingIdsRef.current.has(appointment.id)) {
      return
    }

    const previousStatus = appointment.status

    setAllAppointments((prev) =>
      prev.map((item) =>
        item.id === appointment.id
          ? { ...item, status: APPOINTMENT_STATUS.IN_PROGRESS }
          : item,
      ),
    )

    updatingIdsRef.current.add(appointment.id)

    try {
      await updateAppointmentStatusApi(getAdminInstance(), appointment.id, {
        status: APPOINTMENT_STATUS.IN_PROGRESS,
      })
      await fetchTodayAppointments({ silent: true })
    } catch (error) {
      setAllAppointments((prev) =>
        prev.map((item) =>
          item.id === appointment.id
            ? { ...item, status: previousStatus }
            : item,
        ),
      )
      message.error(error?.message || t('appointments.messages.updateStatusError'))
    } finally {
      updatingIdsRef.current.delete(appointment.id)
    }
  }

  const getActionButtons = (appointment) => {
    if (appointment.status === APPOINTMENT_STATUS.IN_PROGRESS) {
      return {
        primaryLabel: getStatusLabel(APPOINTMENT_STATUS.IN_PROGRESS),
        primaryIcon: <ClockCircleOutlined />,
        primaryClassName: 'inProgressActionBtn',
        secondaryLabel: '',
        onPrimary: () => handleStart(appointment),
        onSecondary: () => undefined,
        disablePrimary: false,
      }
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return {
        primaryLabel: getStatusLabel(APPOINTMENT_STATUS.COMPLETED),
        secondaryLabel: '',
        onPrimary: () => undefined,
        onSecondary: () => undefined,
        disablePrimary: true,
      }
    }

    return {
      primaryLabel: t('appointments.actions.startExam'),
      primaryIcon: <PlayCircleOutlined />,
      primaryClassName: 'primaryActionBtn',
      secondaryLabel: '',
      onPrimary: () => handleStart(appointment),
      onSecondary: () => undefined,
      disablePrimary: false,
    }
  }

  return (
    <div className={styles.pageWrap}>
      <Row gutter={[16, 16]}>
        {summaryCards.map((card) => (
          <Col xs={24} lg={8} key={card.key}>
            <Card className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles[card.iconClassName]}`}>{card.icon}</div>
              <Typography.Text className={styles.summaryTitle}>{card.title}</Typography.Text>
              <Typography.Title level={2} className={styles.summaryValue}>
                {card.value}
              </Typography.Title>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className={styles.tablePanel}>
        <Flex justify="space-between" align="center" className={styles.tableHeader}>
          <Typography.Title className={styles.panelTitle}>{t('appointments.title')}</Typography.Title>
          <Space size={12}>
            <Typography.Text type="secondary">
              {isRefreshing ? '' : ''}
            </Typography.Text>
            <Segmented options={tableTabs} value={activeTab} onChange={setActiveTab} className={styles.segmented} />
          </Space>
        </Flex>

        <div className={styles.tableHeadRow}>
          <span>{t('appointments.table.pet')}</span>
          <span>{t('appointments.table.owner')}</span>
          <span>{t('appointments.table.service')}</span>
          <span>{t('appointments.table.time')}</span>
          <span>{t('appointments.table.action')}</span>
        </div>

        {loading ? (
          <div className={styles.loadingWrap}>
            <Spin size="large" />
          </div>
        ) : paginatedAppointments.length === 0 ? (
          <div className={styles.emptyText}>{t('appointments.states.empty')}</div>
        ) : (
          paginatedAppointments.map((item) => {
            const actions = getActionButtons(item)

            return (
              <div key={item.id} className={styles.tableRow}>
                <div className={styles.petInfoCol}>
                  <Avatar src={item.petAvatar || undefined} className={styles.petAvatar}>
                    {item.petName.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Typography.Text className={styles.petName}>{item.petName}</Typography.Text>
                  </div>
                </div>
                <Typography.Text className={styles.ownerName}>{item.ownerName}</Typography.Text>
                <Tag className={`${styles.serviceTag} ${styles[mapServiceClass(item.service)]}`}>{item.service}</Tag>
                <Typography.Text className={styles.timeText}>{item.time}</Typography.Text>

                <Space className={styles.actionsCol} size={8}>
                  <Button
                    type="primary"
                    className={styles[actions.primaryClassName] || styles.primaryActionBtn}
                    onClick={actions.onPrimary}
                    disabled={actions.disablePrimary}
                    icon={actions.primaryIcon}
                  >
                    {actions.primaryLabel}
                  </Button>
                  {actions.secondaryLabel ? (
                    <Button className={styles.ghostActionBtn} onClick={actions.onSecondary}>
                      {actions.secondaryLabel}
                    </Button>
                  ) : null}
                </Space>
              </div>
            )
          })
        )}

        <Flex justify="space-between" align="center" className={styles.tableFooter}>
          <Typography.Text>
            {t('appointments.pagination.summary', {
              shown: paginatedAppointments.length,
              total: filteredAppointments.length,
            })}
          </Typography.Text>
          <Space size={8}>
            <Button
              shape="circle"
              icon={<LeftOutlined />}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Button
              shape="circle"
              icon={<RightOutlined />}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </Space>
        </Flex>
      </Card>
    </div>
  )
}
