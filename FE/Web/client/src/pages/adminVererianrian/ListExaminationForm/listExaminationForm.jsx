import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	DeleteOutlined,
	FileAddOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, DatePicker, Empty, Modal, Spin, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import {
	APPOINTMENT_STATUS,
	deleteVeterinarianAppointmentApi,
	getVeterinarianAppointmentsApi,
} from '../../../data/adminVererianrian/api/appointmentApi'
import { getBreedLabel } from '../../../data/client/api/petApi'
import styles from './listExaminationForm.module.css'

const PAGE_SIZE = 4

const formatDate = (value) => {
	if (!value) return '--/--/----'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '--/--/----'
	return date.toLocaleDateString('vi-VN')
}

const toRecordRow = (item) => {
	const pet = item?.pet || {}
	const owner = pet?.owner || {}

	return {
		id: String(item?.id || Math.random()),
		appointmentId: item?.id,
		status: item?.status,
		createdDate: formatDate(item?.appointmentDate),
		revisitDate: formatDate(item?.appointmentDate),
		formName: item?.service || 'Chưa cập nhật',
		petName: pet?.name || 'Chưa cập nhật',
		petAvatar: pet?.avatar || '',
		ownerName: owner?.fullName || 'Chưa cập nhật',
		petBreedLabel: getBreedLabel(pet?.breed, pet?.species),
		petRaw: pet,
	}
}

const summaryCardConfig = [
	{
		key: 'today',
		title: 'Lịch hôm nay',
		icon: <CalendarOutlined />,
		iconClass: 'summaryIconGreen',
	},
	{
		key: 'waiting',
		title: 'Đang chờ',
		icon: <ClockCircleOutlined />,
		iconClass: 'summaryIconOrange',
	},
	{
		key: 'completed',
		title: 'Đã hoàn thành',
		icon: <CheckCircleOutlined />,
		iconClass: 'summaryIconBlue',
	},
]

export default function ListExaminationForm() {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState(dayjs())
	const [rows, setRows] = useState([])

	const fetchAppointments = useCallback(async () => {
		try {
			setLoading(true)
			const response = await getVeterinarianAppointmentsApi({
				page: 1,
				limit: 500,
				date: selectedDate.format('YYYY-MM-DD'),
			})

			const items = Array.isArray(response?.items) ? response.items : []
			const activeItems = items.filter((item) => item?.status !== APPOINTMENT_STATUS.CANCELLED)
			setRows(activeItems.map(toRecordRow).slice(0, PAGE_SIZE))
		} catch (error) {
			setRows([])
			message.error(error?.message || 'Không thể tải danh sách phiếu khám')
		} finally {
			setLoading(false)
		}
	}, [selectedDate])

	useEffect(() => {
		fetchAppointments()
	}, [fetchAppointments])

	const stats = useMemo(() => {
		const waitingCount = rows.filter((row) => {
			return row.status === APPOINTMENT_STATUS.BOOKED || row.status === APPOINTMENT_STATUS.IN_PROGRESS
		}).length

		const completedCount = rows.filter((row) => row.status === APPOINTMENT_STATUS.COMPLETED).length

		return {
			today: rows.length,
			waiting: waitingCount,
			completed: completedCount,
		}
	}, [rows])

	const handleCreateExamination = (row) => {
		if (!row?.appointmentId) {
			message.warning('Không tìm thấy lịch hẹn để tạo phiếu khám')
			return
		}

		navigate(`/admin/veterinarian/exam-forms/create?appointmentId=${row.appointmentId}`, {
			state: {
				appointment: row,
			},
		})
	}

	const handleDelete = (row) => {
		Modal.confirm({
			title: 'Bạn có muốn xóa lịch hẹn này không?',
			content: 'Hành động này sẽ xóa lịch hẹn khỏi danh sách.',
			okText: 'Xóa',
			cancelText: 'Hủy',
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await deleteVeterinarianAppointmentApi(row.appointmentId)
					message.success('Xóa lịch hẹn thành công')
					fetchAppointments()
				} catch (error) {
					message.error(error?.message || 'Không thể xóa lịch hẹn')
				}
			},
		})
	}

	return (
		<div className={styles.pageRoot}>
			<div className={styles.pageHeader}>
				<Typography.Title className={styles.pageTitle}>Dashboard Bác sĩ</Typography.Title>
				<Typography.Paragraph className={styles.pageSubtitle}>
					Chào mừng trở lại, hôm nay bạn có {stats.today} lịch hẹn.
				</Typography.Paragraph>
			</div>

			<div className={styles.summaryGrid}>
				{summaryCardConfig.map((card) => (
					<Card key={card.key} className={styles.summaryCard}>
						<div className={`${styles.summaryIcon} ${styles[card.iconClass]}`}>{card.icon}</div>
						<Typography.Text className={styles.summaryTitle}>{card.title}</Typography.Text>
						<Typography.Title className={styles.summaryValue} level={2}>
							{stats[card.key]}
						</Typography.Title>
					</Card>
				))}
			</div>

			<section className={styles.tablePanel}>
				<div className={styles.tablePanelHeader}>
					<Typography.Title level={3} className={styles.panelTitle}>
						Danh sách phiếu khám
					</Typography.Title>
					<DatePicker
						value={selectedDate}
						onChange={(value) => setSelectedDate(value || dayjs())}
						format="DD/MM/YYYY"
						allowClear={false}
						className={styles.datePicker}
					/>
				</div>

				{loading ? (
					<div className={styles.loadingWrap}>
						<Spin size="large" />
					</div>
				) : rows.length === 0 ? (
					<div className={styles.emptyWrap}>
						<Empty description="Không có lịch hẹn theo ngày đã chọn" />
					</div>
				) : (
					<>
						<div className={styles.tableWrap}>
							<table>
								<thead>
									<tr>
										<th>THÚ CƯNG & CHỦ NUÔI</th>
										<th>NGÀY TẠO</th>
										<th>TÊN PHIẾU KHÁM</th>
										<th>NGÀY TÁI KHÁM</th>
										<th>THAO TÁC</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr key={row.id}>
											<td>
												<div className={styles.petCell}>
													<Avatar src={row.petAvatar || undefined} className={styles.petAvatar}>
														{row.petName.charAt(0).toUpperCase()}
													</Avatar>
													<div className={styles.petInfo}>
														<strong>{row.petName}</strong>
														<p>{row.ownerName}</p>
													</div>
												</div>
											</td>
											<td>{row.createdDate}</td>
											<td>{row.formName}</td>
											<td>{row.revisitDate}</td>
											<td>
												<div className={styles.actionWrap}>
													<Button
														type="primary"
														className={styles.createBtn}
														onClick={() => handleCreateExamination(row)}
														icon={<FileAddOutlined />}
													>
														Tạo phiếu khám
													</Button>
													<Button
														className={styles.deleteBtn}
														onClick={() => handleDelete(row)}
														icon={<DeleteOutlined />}
													>
														Xóa
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className={styles.footerRow}>
							<p>Hiển thị {rows.length} trong số {stats.today} lịch hẹn</p>
						</div>
					</>
				)}
			</section>
		</div>
	)
}
