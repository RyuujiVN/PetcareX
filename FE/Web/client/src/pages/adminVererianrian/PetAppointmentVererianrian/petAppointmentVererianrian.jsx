import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileSearchOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Col, Flex, Row, Segmented, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './petAppointmentVererianrian.module.css'

const summaryCards = [
  {
    key: 'today',
    icon: <CalendarOutlined />,
    title: 'Lịch hôm nay',
    value: '12',
    iconClassName: 'summaryIconGreen',
  },
  {
    key: 'waiting',
    icon: <ClockCircleOutlined />,
    title: 'Đang chờ',
    value: '5',
    iconClassName: 'summaryIconOrange',
  },
  {
    key: 'completed',
    icon: <CheckCircleOutlined />,
    title: 'Đã hoàn thành',
    value: '7',
    iconClassName: 'summaryIconBlue',
  },
]

const appointments = [
  {
    id: '1',
    petName: 'LuLu - Chó Corgi',
    ownerName: 'Nguyễn Văn A',
    petAvatar: '🐶',
    service: 'Tiêm chủng',
    serviceClassName: 'serviceVaccine',
    time: '09:00 - 09:30',
    status: 'Sắp tới',
    statusClassName: 'statusUpcoming',
    primaryAction: 'Bắt đầu khám',
    secondaryAction: 'Hủy',
  },
  {
    id: '2',
    petName: 'Mimi - Mèo Anh Lông Ngắn',
    ownerName: 'Trần Thị B',
    petAvatar: '🐱',
    service: 'Khám tổng quát',
    serviceClassName: 'serviceGeneral',
    time: '10:00 - 10:30',
    status: 'Đang khám',
    statusClassName: 'statusInProgress',
    primaryAction: 'Đang thực hiện',
    secondaryAction: '',
  },
  {
    id: '3',
    petName: 'Вл - Golden Retriever',
    ownerName: 'Lê Văn C',
    petAvatar: '🦮',
    service: 'Phẫu thuật',
    serviceClassName: 'serviceSurgery',
    time: '11:15 - 12:45',
    status: 'Đã xác nhận',
    statusClassName: 'statusConfirmed',
    primaryAction: 'Bắt đầu khám',
    secondaryAction: 'Hủy',
  },
  {
    id: '4',
    petName: 'Kiki - Poodle',
    ownerName: 'Phạm Văn D',
    petAvatar: '🐩',
    service: 'Tư vấn dinh',
    serviceClassName: 'serviceConsulting',
    time: '14:00 - 14:30',
    status: 'Sắp tới',
    statusClassName: 'statusUpcoming',
    primaryAction: 'Xác nhận',
    secondaryAction: 'Hủy',
  },
]

const tableTabs = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Sắp tới', value: 'upcoming' },
  { label: 'Đang khám', value: 'inProgress' },
]

export default function PetAppointmentVererianrian() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const visibleAppointments = useMemo(() => {
    if (activeTab === 'upcoming') return appointments.filter((item) => item.status === 'Sắp tới')
    if (activeTab === 'inProgress') return appointments.filter((item) => item.status === 'Đang khám')
    return appointments
  }, [activeTab])

  const handlePrimaryAction = (appointment) => {
    if (!appointment?.id || appointment.primaryAction === 'Đang thực hiện') return
    navigate(`/admin/veterinarian/exam-slips/${appointment.id}`)
  }

  const handleSecondaryAction = (appointment) => {
    if (!appointment?.id || !appointment.secondaryAction) return
    navigate('/admin/veterinarian/appointments')
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.titleBlock}>
        <Typography.Title level={2}>Dashboard Bác sĩ</Typography.Title>
        <Typography.Text>Chào mừng trở lại, hôm nay bạn có 12 lịch hẹn.</Typography.Text>
      </div>

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
          <Typography.Title level={3} className={styles.panelTitle}>
            Danh sách lịch hẹn hôm nay
          </Typography.Title>
          <Segmented
            options={tableTabs}
            value={activeTab}
            onChange={setActiveTab}
            className={styles.segmented}
          />
        </Flex>

        <div className={styles.tableHeadRow}>
          <span>THÚ CƯNG & CHỦ NUÔI</span>
          <span>DỊCH VỤ</span>
          <span>THỜI GIAN</span>
          <span>TRẠNG THÁI</span>
          <span>THAO TÁC</span>
        </div>

        {visibleAppointments.map((item) => (
          <div key={item.id} className={styles.tableRow}>
            <div className={styles.petInfoCol}>
              <Avatar className={styles.petAvatar}>{item.petAvatar}</Avatar>
              <div>
                <Typography.Text className={styles.petName}>{item.petName}</Typography.Text>
                <Typography.Text className={styles.ownerName}>{item.ownerName}</Typography.Text>
              </div>
            </div>

            <Tag className={`${styles.serviceTag} ${styles[item.serviceClassName]}`}>{item.service}</Tag>
            <Typography.Text className={styles.timeText}>{item.time}</Typography.Text>
            <Tag className={`${styles.statusTag} ${styles[item.statusClassName]}`}>{item.status}</Tag>

            <Space className={styles.actionsCol} size={8}>
              <Button
                type="primary"
                className={styles.primaryActionBtn}
                icon={<FileSearchOutlined />}
                onClick={() => handlePrimaryAction(item)}
                disabled={item.primaryAction === 'Đang thực hiện'}
              >
                {item.primaryAction}
              </Button>
              {item.secondaryAction ? (
                <Button className={styles.ghostActionBtn} onClick={() => handleSecondaryAction(item)}>
                  {item.secondaryAction}
                </Button>
              ) : null}
            </Space>
          </div>
        ))}

        <Flex justify="space-between" align="center" className={styles.tableFooter}>
          <Typography.Text>Hiển thị 4 trong số 12 lịch hẹn</Typography.Text>
          <Space size={8}>
            <Button shape="circle" icon={<LeftOutlined />} />
            <Button shape="circle" icon={<RightOutlined />} />
          </Space>
        </Flex>
      </Card>
    </div>
  )
}
