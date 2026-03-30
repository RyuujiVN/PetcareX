import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	FileAddOutlined,
	LeftOutlined,
	RightOutlined,
} from '@ant-design/icons'
import { Avatar, Button, DatePicker, Empty, Spin, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { ADMIN_AUTH_STORAGE } from '../../../constants/authStorage'
import {
	APPOINTMENT_STATUS,
	getVeterinarianAppointmentsApi,
} from '../../../data/adminVererianrian/api/appointmentApi'
import { getBreedLabel } from '../../../data/client/api/petApi'
import styles from './listExaminationForm.module.css'

const PAGE_SIZE = 4

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
		hasMedicalRecord: Boolean(item?.medical?.id),
		createdDate: formatDate(item?.appointmentDate),
		appointmentTime: String(item?.appointmentTime || '').slice(0, 5),
		formName: item?.service || 'Chưa cập nhật',
		petName: pet?.name || 'Chưa cập nhật',
		petAvatar: pet?.avatar || '',
		ownerName: owner?.fullName || 'Chưa cập nhật',
		petBreedLabel: getBreedLabel(pet?.breed, pet?.species),
		petRaw: pet,
	}
}

export default function ListExaminationForm() {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState(dayjs())
	const [rows, setRows] = useState([])
	const [currentPage, setCurrentPage] = useState(1)

	const fetchAppointments = useCallback(async () => {
		try {
			setLoading(true)
			const response = await getVeterinarianAppointmentsApi({
				page: 1,
				limit: 500,
				date: selectedDate.format('YYYY-MM-DD'),
			})

			const items = Array.isArray(response?.items) ? response.items : []
			const currentUserId = getCurrentVeterinarianUserId()
			const activeItems = items
				.filter((item) => item?.status !== APPOINTMENT_STATUS.CANCELLED)
				.filter((item) => {
					if (!currentUserId) return true
					const veterinarianUserId = item?.veterinarian?.user?.id
					return String(veterinarianUserId || '') === String(currentUserId)
				})
			const mappedRows = activeItems.map(toRecordRow)
			mappedRows.sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)))
			setRows(mappedRows)
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

	useEffect(() => {
		setCurrentPage(1)
	}, [selectedDate])

	const paginatedRows = useMemo(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE
		return rows.slice(startIndex, startIndex + PAGE_SIZE)
	}, [currentPage, rows])

	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))

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

	return (
		<div className={styles.pageRoot}>
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
										<th>THÚ CƯNG</th>
										<th>CHỦ NUÔI</th>
										<th>NGÀY TẠO</th>
										<th>TÊN PHIẾU KHÁM</th>
										<th>THAO TÁC</th>
									</tr>
								</thead>
								<tbody>
									{paginatedRows.map((row) => (
										<tr key={row.id}>
											<td>
												<div className={styles.petCell}>
													<Avatar src={row.petAvatar || undefined} className={styles.petAvatar}>
														{row.petName.charAt(0).toUpperCase()}
													</Avatar>
													<div className={styles.petInfo}>
														<strong>{row.petName}</strong>
													</div>
												</div>
											</td>
											<td>{row.ownerName}</td>
											<td>{row.createdDate}</td>
											<td>{row.formName}</td>
											<td>
												<div className={styles.actionWrap}>
													<Button
														type="primary"
														className={styles.createBtn}
														onClick={() => handleCreateExamination(row)}
														icon={<FileAddOutlined />}
														style={{ backgroundColor: '#4672b4', borderColor: '#4672b4' }}
													>
														{row.hasMedicalRecord ? 'Tạo lại phiếu khám' : 'Tạo phiếu khám'}
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className={styles.footerRow}>
							<p>Hiển thị {paginatedRows.length} trong số {rows.length} lịch hẹn</p>
							<div className={styles.paginationArrows}>
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
							</div>
						</div>
					</>
				)}
			</section>
		</div>
	)
}
