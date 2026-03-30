import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Empty, Pagination, Spin, message } from 'antd'
import dayjs from 'dayjs'
import {
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	DeleteOutlined,
	EyeOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
	APPOINTMENT_STATUS,
	getVeterinarianAppointmentsApi,
} from '../../../data/adminVererianrian/api/appointmentApi'
import styles from './listMedicalRecords.module.css'

const PAGE_SIZE = 4

const formatDate = (value) => {
	if (!value) return 'Chưa cập nhật'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
	return date.toLocaleDateString('vi-VN')
}

const formatTime = (value) => {
	if (!value) return 'Chưa cập nhật'
	return String(value).slice(0, 5)
}

const toPetRow = (item) => {
	const pet = item?.pet || {}
	const owner = pet?.owner || {}

	return {
		id: String(item?.id || Math.random()),
		appointmentId: item?.id,
		medicalId: item?.medical?.id || '',
		petId: pet?.id || '',
		petName: pet?.name || 'Chưa cập nhật',
		petBreed: pet?.breed || '',
		petSpecies: pet?.species || '',
		petAvatar: pet?.avatar || '',
		petDateOfBirth: pet?.dateOfBirth || '',
		petGender: pet?.gender,
		petWeight: pet?.weight,
		ownerName: owner?.fullName || 'Chưa cập nhật',
		createdDate: formatDate(item?.appointmentDate),
		timeRange: formatTime(item?.appointmentTime),
		revisitDate: formatDate(item?.medical?.followUpDate || item?.followUpDate),
		status: item?.status,
	}
}

export default function ListMedicalRecords() {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState(dayjs())
	const [currentPage, setCurrentPage] = useState(1)
	const [rows, setRows] = useState([])
	const [hiddenRowIds, setHiddenRowIds] = useState([])

	const fetchRecords = useCallback(async () => {
		try {
			setLoading(true)
			const response = await getVeterinarianAppointmentsApi({
				page: 1,
				limit: 500,
				date: selectedDate.format('YYYY-MM-DD'),
			})

			const items = Array.isArray(response?.items) ? response.items : []
			const activeItems = items.filter((item) => item?.status !== APPOINTMENT_STATUS.CANCELLED)
			const mappedRows = activeItems.map(toPetRow)
			mappedRows.sort((a, b) => a.timeRange.localeCompare(b.timeRange))
			setRows(mappedRows)
		} catch (error) {
			setRows([])
			message.error(error?.message || 'Không thể tải danh sách hồ sơ bệnh án')
		} finally {
			setLoading(false)
		}
	}, [selectedDate])

	useEffect(() => {
		fetchRecords()
	}, [fetchRecords])

	useEffect(() => {
		setCurrentPage(1)
	}, [selectedDate])

	const visibleRows = useMemo(
		() => rows.filter((row) => !hiddenRowIds.includes(row.id)),
		[rows, hiddenRowIds],
	)

	const stats = useMemo(() => {
		const waitingCount = visibleRows.filter((row) => {
			return row.status === APPOINTMENT_STATUS.BOOKED || row.status === APPOINTMENT_STATUS.IN_PROGRESS
		}).length

		const completedCount = visibleRows.filter(
			(row) => row.status === APPOINTMENT_STATUS.COMPLETED,
		).length

		return {
			today: visibleRows.length,
			waiting: waitingCount,
			completed: completedCount,
		}
	}, [visibleRows])

	const paginatedRows = useMemo(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE
		return visibleRows.slice(startIndex, startIndex + PAGE_SIZE)
	}, [currentPage, visibleRows])

	const onViewDetail = (row) => {
		if (!row?.petId) {
			message.warning('Không tìm thấy thú cưng để xem chi tiết hồ sơ')
			return
		}

		const searchParams = new URLSearchParams({
			petId: String(row.petId),
		})

		if (row.medicalId) {
			searchParams.set('medicalId', String(row.medicalId))
		}

		navigate(`/admin/veterinarian/medical-records/view?${searchParams.toString()}`, {
			state: {
				record: row,
			},
		})
	}

	const onHideRow = (rowId) => {
		setHiddenRowIds((prev) => [...prev, rowId])
	}

	return (
		<div className={styles.pageRoot}>
			<div className={styles.headerBlock}>
				<h1>Dashboard Bác sĩ</h1>
				<p>Chào mừng trở lại, hôm nay bạn có {stats.today} lịch hẹn.</p>
			</div>

			<section className={styles.metricGrid}>
				<article className={styles.metricCard}>
					<div className={`${styles.metricIcon} ${styles.todayIcon}`}>
						<CalendarOutlined />
					</div>
					<p className={styles.metricLabel}>Lịch hôm nay</p>
					<strong>{stats.today}</strong>
				</article>

				<article className={styles.metricCard}>
					<div className={`${styles.metricIcon} ${styles.waitingIcon}`}>
						<ClockCircleOutlined />
					</div>
					<p className={styles.metricLabel}>Đang chờ</p>
					<strong>{stats.waiting}</strong>
				</article>

				<article className={styles.metricCard}>
					<div className={`${styles.metricIcon} ${styles.doneIcon}`}>
						<CheckCircleOutlined />
					</div>
					<p className={styles.metricLabel}>Đã hoàn thành</p>
					<strong>{stats.completed}</strong>
				</article>
			</section>

			<section className={styles.tablePanel}>
				<div className={styles.tablePanelHeader}>
					<h2>Hồ sơ bệnh án thú cưng</h2>
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
				) : visibleRows.length === 0 ? (
					<div className={styles.emptyWrap}>
						<Empty description="Không có hồ sơ theo ngày đã chọn" />
					</div>
				) : (
					<>
						<div className={styles.tableWrap}>
							<table>
								<thead>
									<tr>
										<th>THÚ CƯNG & CHỦ NUÔI</th>
										<th>NGÀY TẠO</th>
										<th>THỜI GIAN</th>
										<th>NGÀY TÁI KHÁM</th>
										<th>THAO TÁC</th>
									</tr>
								</thead>
								<tbody>
									{paginatedRows.map((row) => (
										<tr key={row.id}>
											<td>
												<div className={styles.petCell}>
													<div className={styles.petAvatar}>
														{row.petAvatar ? (
															<img src={row.petAvatar} alt={row.petName} />
														) : (
															<span>{row.petName.charAt(0).toUpperCase()}</span>
														)}
													</div>
													<div className={styles.petInfo}>
														<strong>{row.petName}</strong>
														<p>{row.ownerName}</p>
													</div>
												</div>
											</td>
											<td>{row.createdDate}</td>
											<td>{row.timeRange}</td>
											<td>{row.revisitDate}</td>
											<td>
												<div className={styles.actionWrap}>
													<Button className={styles.viewBtn} onClick={() => onViewDetail(row)}>
														<EyeOutlined /> Xem chi tiết
													</Button>
													<Button className={styles.deleteBtn} onClick={() => onHideRow(row.id)}>
														<DeleteOutlined /> Xóa
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className={styles.footerRow}>
							<p>Hiển thị {paginatedRows.length} trong số {visibleRows.length} lịch hẹn</p>
							<Pagination
								current={currentPage}
								total={visibleRows.length}
								pageSize={PAGE_SIZE}
								onChange={(page) => setCurrentPage(page)}
								showSizeChanger={false}
								simple
							/>
						</div>
					</>
				)}
			</section>
		</div>
	)
}
