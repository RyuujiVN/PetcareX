import {
	FileAddOutlined,
	LeftOutlined,
	PlusCircleOutlined,
	RightOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Empty, Spin, Typography, message } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminInstance } from '../../../services/apiClient'
import { getMyAppointmentsApi } from '../../../services/appointmentService'
import { getVeterinarianMedicalRecordsApi } from '../../../services/medicalService'
import styles from './listExaminationForm.module.css'

const PAGE_SIZE = 10
const VET_APPOINTMENT_MEDICAL_MAP_STORAGE_KEY = 'veterinarian:appointmentMedicalMap'

const readAppointmentMedicalMap = () => {
	if (typeof window === 'undefined') return {}
	try {
		const raw = window.localStorage.getItem(VET_APPOINTMENT_MEDICAL_MAP_STORAGE_KEY)
		if (!raw) return {}
		const parsed = JSON.parse(raw)
		return parsed && typeof parsed === 'object' ? parsed : {}
	} catch {
		return {}
	}
}

const formatDate = (value) => {
	if (!value) return '--/--/----'
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return '--/--/----'
	const dd = String(d.getDate()).padStart(2, '0')
	const mm = String(d.getMonth() + 1).padStart(2, '0')
	const yyyy = d.getFullYear()
	return `${dd}/${mm}/${yyyy}`
}

export default function ListExaminationForm() {
	const { t } = useTranslation('vererianrian')
	const [loading, setLoading] = useState(false)
	const [records, setRecords] = useState([])
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const [appointmentLinkedIds, setAppointmentLinkedIds] = useState(() => new Set())
	const inFlightRef = useRef(false)

	const fetchAppointmentLinkedIds = useCallback(async () => {
		const linked = new Set()

		const map = readAppointmentMedicalMap()
		Object.values(map).forEach((entry) => {
			if (typeof entry === 'string') {
				linked.add(String(entry))
			} else if (entry && typeof entry === 'object' && entry.medicalId) {
				linked.add(String(entry.medicalId))
			}
		})

		try {
			const payload = await getMyAppointmentsApi(getAdminInstance(), 1, 500)
			const items = Array.isArray(payload?.items) ? payload.items : []
			items.forEach((item) => {
				const medicalId = item?.medical?.id
				if (medicalId) linked.add(String(medicalId))
			})
		} catch {
			// ignore — fall back to localStorage-only classification
		}

		setAppointmentLinkedIds(linked)
	}, [])

	const fetchRecords = useCallback(
		async (targetPage, { silent = false } = {}) => {
			if (inFlightRef.current) return
			inFlightRef.current = true
			try {
				if (!silent) setLoading(true)
				const payload = await getVeterinarianMedicalRecordsApi(
					getAdminInstance(),
					targetPage,
					PAGE_SIZE,
				)
				const items = Array.isArray(payload?.items) ? payload.items : []
				const meta = payload?.meta || {}
				setRecords(items)
				setTotalPages(Math.max(1, Number(meta?.totalPages) || 1))
				setTotalItems(Number(meta?.totalItems) || items.length)
			} catch (error) {
				setRecords([])
				setTotalPages(1)
				setTotalItems(0)
				if (!silent) message.error(error?.message || t('examForm.list.messages.loadError'))
			} finally {
				inFlightRef.current = false
				setLoading(false)
			}
		},
		[t],
	)

	useEffect(() => {
		fetchRecords(page)
	}, [fetchRecords, page])

	useEffect(() => {
		fetchAppointmentLinkedIds()
	}, [fetchAppointmentLinkedIds])

	useEffect(() => {
		const onFocus = () => {
			fetchRecords(page, { silent: true })
			fetchAppointmentLinkedIds()
		}
		const onVisibilityChange = () => {
			if (!document.hidden) onFocus()
		}
		window.addEventListener('focus', onFocus)
		document.addEventListener('visibilitychange', onVisibilityChange)
		return () => {
			window.removeEventListener('focus', onFocus)
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
	}, [fetchRecords, fetchAppointmentLinkedIds, page])

	const handleCreateWalkIn = () => {
		window.open('/veterinarian/exam-forms/create?mode=walkin', '_blank')
	}

	const handleOpenRecord = (record) => {
		const medicalId = record?.id
		if (!medicalId) return
		const isAppointment = appointmentLinkedIds.has(String(medicalId))
		const url = isAppointment
			? `/veterinarian/exam-forms/create?medicalId=${encodeURIComponent(String(medicalId))}`
			: `/veterinarian/exam-forms/create?mode=walkin&medicalId=${encodeURIComponent(String(medicalId))}`
		window.open(url, '_blank')
	}

	const rows = useMemo(() => {
		return records.map((record) => {
			const pet = record?.pet || {}
			const owner = pet?.owner || {}
			const id = String(record?.id || '')
			const isAppointment = appointmentLinkedIds.has(id)
			return {
				id,
				raw: record,
				petName: pet?.name || t('examForm.list.states.notUpdated'),
				petAvatar: pet?.avatar || '',
				ownerName: owner?.fullName || t('examForm.list.states.notUpdated'),
				createdDate: formatDate(record?.createdAt),
				formName: record?.name || t('examForm.list.states.notUpdated'),
				isAppointment,
			}
		})
	}, [records, appointmentLinkedIds, t])

	const renderTable = () => {
		if (loading) {
			return (
				<div className={styles.loadingWrap}>
					<Spin size="large" />
				</div>
			)
		}

		if (rows.length === 0) {
			return (
				<div className={styles.emptyWrap}>
					<Empty description={t('examForm.list.states.empty')} />
				</div>
			)
		}

		return (
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
							{rows.map((row) => (
								<tr key={row.id}>
									<td>
										<div className={styles.petCell}>
											<Avatar src={row.petAvatar || undefined} className={styles.petAvatar}>
												{(row.petName || '?').charAt(0).toUpperCase()}
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
												onClick={() => handleOpenRecord(row.raw)}
												icon={<FileAddOutlined />}
											>
												{t('examForm.list.actions.open')}
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
							shown: rows.length,
							total: totalItems,
						})}
					</p>
					<div className={styles.paginationArrows}>
						<Button
							shape="circle"
							icon={<LeftOutlined />}
							disabled={page <= 1}
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
						/>
						<Button
							shape="circle"
							icon={<RightOutlined />}
							disabled={page >= totalPages}
							onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
						/>
					</div>
				</div>
			</>
		)
	}

	return (
		<div className={styles.pageRoot}>
			<section className={styles.tablePanel}>
				<div className={styles.tablePanelHeader}>
					<Typography.Title level={3} className={styles.panelTitle}>
						{t('examForm.list.title')}
					</Typography.Title>
					<div className={styles.headerActions}>
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

				{renderTable()}
			</section>
		</div>
	)
}
