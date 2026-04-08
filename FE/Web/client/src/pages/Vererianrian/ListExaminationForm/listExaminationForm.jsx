import {
    FileAddOutlined,
    LeftOutlined,
    PlusCircleOutlined,
    RightOutlined,
} from '@ant-design/icons'
import { Avatar, Button, DatePicker, Empty, Spin, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ADMIN_AUTH_STORAGE, getAdminAuthItem } from '../../../constants/authStorage'
import { getAdminInstance } from '../../../services/apiClient'
import {
    APPOINTMENT_STATUS,
    getAppointmentsApi,
} from '../../../services/appointmentService'
import { getBreedLabel } from '../../../services/petService'
import { formatDateDDMMYYYY, formatTimeHHMM } from '../../../utils/dateTimeFormat'
import { getServiceLabel } from '../../../utils/enumLabel'
import styles from './listExaminationForm.module.css'

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

const formatDate = (value) => {
	return formatDateDDMMYYYY(value, '--/--/----')
}

const toRecordRow = (item, t) => {
	const pet = item?.pet || {}
	const owner = pet?.owner || {}

	return {
		id: String(item?.id || Math.random()),
		appointmentId: item?.id,
		service: item?.service,
		status: item?.status,
		hasMedicalRecord: Boolean(item?.medical?.id) || item?.status === APPOINTMENT_STATUS.COMPLETED,
		medical: item?.medical || null,
		appointmentDate: item?.appointmentDate || null,
		createdDate: formatDate(item?.appointmentDate),
		appointmentTime: formatTimeHHMM(item?.appointmentTime, ''),
		clinicId: item?.clinic?.id || item?.clinicId || '',
		formName: getServiceLabel(item?.service, item?.service || t('examForm.list.states.notUpdated')),
		petName: pet?.name || t('examForm.list.states.notUpdated'),
		petAvatar: pet?.avatar || '',
		ownerName: owner?.fullName || t('examForm.list.states.notUpdated'),
		ownerId: owner?.id || '',
		ownerEmail: owner?.email || '',
		petBreedLabel: getBreedLabel(pet?.breed, pet?.species),
		petRaw: pet,
	}
}

export default function ListExaminationForm() {
	const { t } = useTranslation('vererianrian')
	const [loading, setLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState(dayjs())
	const [rows, setRows] = useState([])
	const [currentPage, setCurrentPage] = useState(1)
	const inFlightRef = useRef(false)

	const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
		if (inFlightRef.current) return
		inFlightRef.current = true
		try {
			if (!silent) setLoading(true)
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
			const mappedRows = activeItems.map((item) => toRecordRow(item, t))
			mappedRows.sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)))
			setRows(mappedRows)
		} catch (error) {
			setRows([])
			if (!silent) message.error(error?.message || t('examForm.list.messages.loadError'))
		} finally {
			inFlightRef.current = false
			setLoading(false)
		}
	}, [selectedDate, t])

	useEffect(() => {
		fetchAppointments()
	}, [fetchAppointments])

	useEffect(() => {
		const onFocus = () => fetchAppointments({ silent: true })
		const onVisibilityChange = () => {
			if (!document.hidden) fetchAppointments({ silent: true })
		}

		window.addEventListener('focus', onFocus)
		document.addEventListener('visibilitychange', onVisibilityChange)

		return () => {
			window.removeEventListener('focus', onFocus)
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
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
			message.warning(t('examForm.list.messages.missingAppointment'))
			return
		}

		const url = `/veterinarian/exam-forms/create?appointmentId=${encodeURIComponent(String(row.appointmentId))}`
		window.open(url, '_blank')
	}

	const handleCreateWalkIn = () => {
		window.open('/veterinarian/exam-forms/create?mode=walkin', '_blank')
	}

	return (
		<div className={styles.pageRoot}>
			<section className={styles.tablePanel}>
				<div className={styles.tablePanelHeader}>
					<Typography.Title level={3} className={styles.panelTitle}>
						{t('examForm.list.title')}
					</Typography.Title>
					<div className={styles.headerActions}>
						<DatePicker
							value={selectedDate}
							onChange={(value) => setSelectedDate(value || dayjs())}
							format="DD/MM/YYYY"
							allowClear={false}
							className={styles.datePicker}
						/>
						<Button
							type="primary"
							icon={<PlusCircleOutlined />}
							className={styles.emergencyBtn}
							onClick={handleCreateWalkIn}
							aria-label={t('examForm.list.actions.createWalkIn')}
							title={t('examForm.list.actions.createWalkIn')}
						>
							{t('examForm.list.actions.createWalkIn')}
						</Button>
					</div>
				</div>

				{loading ? (
					<div className={styles.loadingWrap}>
						<Spin size="large" />
					</div>
				) : rows.length === 0 ? (
					<div className={styles.emptyWrap}>
						<Empty description={t('examForm.list.states.empty')} />
					</div>
				) : (
					<>
						<div className={styles.tableWrap}>
							<table>
								<thead>
									<tr>
										<th>{t('examForm.list.table.pet')}</th>
										<th>{t('examForm.list.table.owner')}</th>
										<th>{t('examForm.list.table.createdDate')}</th>
										<th>{t('examForm.list.table.formName')}</th>
										<th>{t('examForm.list.table.action')}</th>
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
														{row.hasMedicalRecord ? t('examForm.list.actions.open') : t('examForm.list.actions.create')}
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
								{t('examForm.list.pagination.summary', {
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
