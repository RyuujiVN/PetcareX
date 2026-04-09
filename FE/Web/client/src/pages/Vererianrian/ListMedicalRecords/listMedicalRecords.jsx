import { EyeOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, DatePicker, Empty, Spin, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ADMIN_AUTH_STORAGE, getAdminAuthItem } from '../../../constants/authStorage'
import { getAdminInstance } from '../../../services/apiClient'
import {
    APPOINTMENT_STATUS,
    getAppointmentsApi,
} from '../../../services/appointmentService'
import { formatDateDDMMYYYY, formatTimeHHMM } from '../../../utils/dateTimeFormat'
import styles from './listMedicalRecords.module.css'

const PAGE_SIZE = 4

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

const formatDate = (value, fallback) => formatDateDDMMYYYY(value, fallback)

const formatTime = (value, fallback) => formatTimeHHMM(value, fallback)

const toPetRow = (item, t) => {
	const pet = item?.pet || {}
	const owner = pet?.owner || {}
	const notUpdated = t('medicalRecords.list.states.notUpdated')

	return {
		id: String(item?.id || Math.random()),
		appointmentId: item?.id,
		medicalId: item?.medical?.id || '',
		petId: pet?.id || '',
		petName: pet?.name || notUpdated,
		petAvatar: pet?.avatar || '',
		ownerName: owner?.fullName || notUpdated,
		createdDate: formatDate(item?.appointmentDate, notUpdated),
		time: formatTime(item?.appointmentTime, notUpdated),
	}
}

export default function ListMedicalRecords() {
	const { t } = useTranslation('vererianrian')
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState(dayjs())
	const [currentPage, setCurrentPage] = useState(1)
	const [rows, setRows] = useState([])

	const fetchRecords = useCallback(async () => {
		try {
			setLoading(true)
			const response = await getAppointmentsApi(getAdminInstance(), {
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
			const mappedRows = activeItems.map((item) => toPetRow(item, t))
			mappedRows.sort((a, b) => a.time.localeCompare(b.time))
			setRows(mappedRows)
		} catch (error) {
			setRows([])
			message.error(error?.message || t('medicalRecords.list.messages.loadError'))
		} finally {
			setLoading(false)
		}
	}, [selectedDate, t])

	useEffect(() => {
		fetchRecords()
	}, [fetchRecords])

	useEffect(() => {
		setCurrentPage(1)
	}, [selectedDate])

	const paginatedRows = useMemo(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE
		return rows.slice(startIndex, startIndex + PAGE_SIZE)
	}, [currentPage, rows])

	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))

	const handleViewRecords = (row) => {
		if (!row?.petId) {
			message.warning(t('medicalRecords.list.messages.missingPet'))
			return
		}

		const searchParams = new URLSearchParams({
			petId: String(row.petId),
		})

		if (row.medicalId) {
			searchParams.set('medicalId', String(row.medicalId))
		}

		navigate(`/veterinarian/viewRecords?${searchParams.toString()}`, {
			state: {
				record: row,
			},
		})
	}

	return (
		<div className={styles.pageRoot}>
			<section className={styles.tablePanel}>
				<div className={styles.tablePanelHeader}>
					<Typography.Title className={styles.panelTitle}>{t('medicalRecords.list.title')}</Typography.Title>
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
						<Empty description={t('medicalRecords.list.states.empty')} />
					</div>
				) : (
					<>
						<div className={styles.tableWrap}>
							<table>
								<thead>
									<tr>
										<th>{t('medicalRecords.list.table.pet')}</th>
										<th>{t('medicalRecords.list.table.owner')}</th>
										<th>{t('medicalRecords.list.table.createdDate')}</th>
										<th>{t('medicalRecords.list.table.time')}</th>
										<th>{t('medicalRecords.list.table.action')}</th>
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
													</div>
												</div>
											</td>
											<td>{row.ownerName}</td>
											<td>{row.createdDate}</td>
											<td>{row.time}</td>
											<td>
												<div className={styles.actionWrap}>
													<Button
														className={styles.viewBtn}
														onClick={() => handleViewRecords(row)}
														style={{ backgroundColor: '#4672b4', borderColor: '#4672b4', color: '#fff' }}
													>
														<EyeOutlined /> {t('medicalRecords.list.actions.viewDetail')}
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className={styles.footerRow}>
							<p>
								{t('medicalRecords.list.pagination.summary', {
									shown: paginatedRows.length,
									total: rows.length,
								})}
							</p>
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
