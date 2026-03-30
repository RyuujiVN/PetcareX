import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Col, Flex, Row, Segmented, Space, Spin, Tag, Typography, message, Modal } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ADMIN_AUTH_STORAGE } from '../../../constants/authStorage'
import {
  APPOINTMENT_STATUS,
  getVeterinarianAppointmentsApi,
  updateVeterinarianAppointmentStatusApi,
} from '../../../data/Vererianrian/api/appointmentApi'
import styles from './petAppointmentVererianrian.module.css'

const PAGE_SIZE = 4
const TODAY_DATE = new Date().toISOString().slice(0, 10)

const tableTabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang khám', value: 'inProgress' },
  { label: 'Đã hoàn thành', value: 'completed' },
]

const getCurrentVeterinarianUserId = () => {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE.userInfoKey)
    if (!raw) return ''

    const profile = JSON.parse(raw)
    return profile?.id || profile?.user?.id || ''
  } catch {
    return ''
  }
}

const normalizeTime = (value) => (value ? String(value).slice(0, 5) : '--:--')

const mapStatusToLabel = (status) => {
  if (status === APPOINTMENT_STATUS.IN_PROGRESS) return 'Đang khám'
  if (status === APPOINTMENT_STATUS.COMPLETED) return 'Đã hoàn thành'
  return status || 'Chưa cập nhật'
}

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

const toRow = (item) => {
  const pet = item?.pet || {}
  const owner = pet?.owner || {}

  return {
    id: item?.id,
    status: item?.status,
    petName: pet?.name || 'Chưa cập nhật',
    ownerName: owner?.fullName || 'Chưa cập nhật',
    petAvatar: pet?.avatar || '',
    service: item?.service || 'Chưa cập nhật',
    time: normalizeTime(item?.appointmentTime),
  }
}

const buildAppointmentsSignature = (items) =>
  items
    .map((item) => `${item.id || ''}:${item.status || ''}:${item.time || ''}:${item.ownerName || ''}`)
    .join('|')

export default function PetAppointmentVererianrian() {
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [allAppointments, setAllAppointments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const inFlightRef = useRef(false)
  const hasLoadedOnceRef = useRef(false)
  const lastDataSignatureRef = useRef('')

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

      const response = await getVeterinarianAppointmentsApi({
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
        .map(toRow)
        .sort((a, b) => String(a.time).localeCompare(String(b.time)))

      const nextSignature = buildAppointmentsSignature(filtered)
      if (nextSignature !== lastDataSignatureRef.current) {
        lastDataSignatureRef.current = nextSignature
        setAllAppointments(filtered)
      }

      hasLoadedOnceRef.current = true
    } catch (error) {
      setAllAppointments([])
      message.error(error?.message || 'Không thể tải lịch hẹn hôm nay')
    } finally {
      inFlightRef.current = false
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

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
        title: 'Lịch hôm nay',
        value: stats.today,
        iconClassName: 'summaryIconGreen',
      },
      {
        key: 'inProgress',
        icon: <ClockCircleOutlined />,
        title: 'Đang khám',
        value: stats.inProgress,
        iconClassName: 'summaryIconOrange',
      },
      {
        key: 'completed',
        icon: <CheckCircleOutlined />,
        title: 'Đã hoàn thành',
        value: stats.completed,
        iconClassName: 'summaryIconBlue',
      },
    ],
    [stats],
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

  const syncStatus = async (appointmentId, nextStatus) => {
    await updateVeterinarianAppointmentStatusApi(appointmentId, { status: nextStatus })
    await fetchTodayAppointments()
  }

  const handleStart = async (appointment) => {
    if (!appointment?.id) return

    try {
      await syncStatus(appointment.id, APPOINTMENT_STATUS.IN_PROGRESS)
      message.success('Đã bắt đầu khám')
    } catch (error) {
      message.error(error?.message || 'Không thể bắt đầu khám')
    }
  }

  const handleCancel = (appointment) => {
    if (!appointment?.id) return

    Modal.confirm({
      title: 'Bạn có muốn hủy lịch hẹn này không?',
      content: 'Lịch hẹn sẽ được chuyển sang trạng thái đã hủy.',
      okText: 'Xác nhận hủy',
      cancelText: 'Không',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await syncStatus(appointment.id, APPOINTMENT_STATUS.CANCELLED)
          message.success('Đã hủy lịch hẹn')
        } catch (error) {
          message.error(error?.message || 'Không thể hủy lịch hẹn')
        }
      },
    })
  }

  const handleFinish = async (appointment) => {
    if (!appointment?.id) return

    try {
      await syncStatus(appointment.id, APPOINTMENT_STATUS.COMPLETED)
      message.success('Đã hoàn tất lịch khám, trạng thái thanh toán do Admin Clinic xử lý')
    } catch (error) {
      message.error(error?.message || 'Không thể hoàn tất lịch khám')
    }
  }

  const getActionButtons = (appointment) => {
    if (appointment.status === APPOINTMENT_STATUS.IN_PROGRESS) {
      return {
        primaryLabel: 'Đang khám',
        secondaryLabel: 'Xong',
        onPrimary: () => undefined,
        onSecondary: () => handleFinish(appointment),
        disablePrimary: true,
      }
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return {
        primaryLabel: 'Đã hoàn thành',
        secondaryLabel: '',
        onPrimary: () => undefined,
        onSecondary: () => undefined,
        disablePrimary: true,
      }
    }

    return {
      primaryLabel: 'Bắt đầu khám',
      secondaryLabel: 'Hủy',
      onPrimary: () => handleStart(appointment),
      onSecondary: () => handleCancel(appointment),
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
          <Typography.Title className={styles.panelTitle}>Danh sách lịch hẹn hôm nay</Typography.Title>
          <Space size={12}>
            <Typography.Text type="secondary">
              {isRefreshing ? '' : ''}
            </Typography.Text>
            <Segmented options={tableTabs} value={activeTab} onChange={setActiveTab} className={styles.segmented} />
          </Space>
        </Flex>

        <div className={styles.tableHeadRow}>
          <span>THÚ CƯNG</span>
          <span>CHỦ NUÔI</span>
          <span>DỊCH VỤ</span>
          <span>THỜI GIAN</span>
          <span>THAO TÁC</span>
        </div>

        {loading ? (
          <div className={styles.loadingWrap}>
            <Spin size="large" />
          </div>
        ) : paginatedAppointments.length === 0 ? (
          <div className={styles.emptyText}>Không có lịch hẹn phù hợp.</div>
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
                    className={styles.primaryActionBtn}
                    onClick={actions.onPrimary}
                    disabled={actions.disablePrimary}
                    style={{ backgroundColor: '#4672b4', borderColor: '#4672b4'}}
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
            Hiển thị {paginatedAppointments.length} trong số {filteredAppointments.length} lịch hẹn
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
