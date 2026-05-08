import {
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	DollarCircleOutlined,
	MedicineBoxOutlined,
	SearchOutlined,
} from '@ant-design/icons'
import {
	Avatar,
	Badge,
	Button,
	Card,
	Col,
	DatePicker,
	Empty,
	Input,
	message,
	Modal,
	Row,
	Select,
	Spin,
	Tag,
	Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminInstance } from '../../../services/apiClient'
import {
	APPOINTMENT_PAYMENT_STATUS_MAP_STORAGE_KEY,
	APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
	APPOINTMENT_STATUS,
	getAppointmentsApi,
	updateAppointmentStatusApi,
} from '../../../services/appointmentService'
import { getInvoiceByMedicalRecordIdApi, INVOICE_STATUS } from '../../../services/invoiceService'
import { getLatestMedicalByPetIdApi } from '../../../services/medicalService'
import { getUserByIdApi } from '../../../services/userService'
import { formatDateDDMMYYYY, formatTimeHHMM } from '../../../utils/dateTimeFormat'
import {
	getAppointmentStatusLabel,
	getPetBreedLabel,
	getPetSpeciesLabel,
	getServiceLabel,
} from '../../../utils/enumLabel'
import styles from './appointmentManagement.module.css'

const { Title, Text } = Typography

const TIME_SLOTS = ['08:00', '08:30','09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
const PAYMENT_SYNC_TTL_MS = 30 * 60 * 1000

const STATUS_COLUMN_CONFIGS = [
	{
		key: APPOINTMENT_STATUS.BOOKED,
		dotClass: styles.grayDot,
		badgeStatus: 'default',
	},
	{
		key: APPOINTMENT_STATUS.IN_PROGRESS,
		dotClass: styles.greenDot,
		badgeStatus: 'processing',
	},
	{
		key: APPOINTMENT_STATUS.COMPLETED,
		dotClass: styles.blueDot,
		badgeStatus: 'success',
	},
]

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

const getNestedValue = (source, path) => {
	if (!source || !path) return undefined

	return path.split('.').reduce((acc, key) => {
		if (acc === undefined || acc === null) return undefined
		return acc[key]
	}, source)
}

const getByPaths = (source, paths, fallback) => {
	for (const path of paths) {
		const value = getNestedValue(source, path)
		if (value !== undefined && value !== null && value !== '') {
			return value
		}
	}

	return fallback
}

const getAgeLabel = (dateOfBirth, t) => {
	if (!dateOfBirth) return t('appointments.common.notUpdated')

	const birthDate = new Date(dateOfBirth)
	if (Number.isNaN(birthDate.getTime())) return t('appointments.common.notUpdated')

	const now = new Date()
	let totalMonths =
		(now.getFullYear() - birthDate.getFullYear()) * 12 +
		(now.getMonth() - birthDate.getMonth())

	if (now.getDate() < birthDate.getDate()) {
		totalMonths -= 1
	}

	if (totalMonths < 0) return t('appointments.common.notUpdated')
	if (totalMonths < 24) {
		return t('appointments.common.monthsOld', { count: totalMonths })
	}
	return t('appointments.common.yearsOld', { count: Math.floor(totalMonths / 12) })
}

const formatDisplayDate = (dateValue) => {
	return formatDateDDMMYYYY(dateValue, '')
}

const getTimeValue = (time) => formatTimeHHMM(time, '')

const getAppointmentStartMs = (appointmentDate, appointmentTime) => {
	if (!appointmentDate || !appointmentTime) return null

	const date = new Date(appointmentDate)
	if (Number.isNaN(date.getTime())) return null

	const [hours, minutes] = String(appointmentTime || '00:00').slice(0, 5).split(':')
	const startDateTime = new Date(date)
	startDateTime.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0)

	return Number.isNaN(startDateTime.getTime()) ? null : startDateTime.getTime()
}

const getGenderLabel = (value, t, missingField) => {
	if (typeof value === 'boolean') {
		return value ? t('appointments.common.male') : t('appointments.common.female')
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase()
		if (!normalized) return missingField
		if (['male', 'm', 'duc', 'đực', 'true', '1'].includes(normalized)) return t('appointments.common.male')
		if (['female', 'f', 'cai', 'cái', 'false', '0'].includes(normalized)) return t('appointments.common.female')
		return value
	}

	return missingField
}

const readPaymentSyncPayload = () => {
	if (typeof window === 'undefined') return null

	try {
		const rawPayload = window.localStorage.getItem(APPOINTMENT_PAYMENT_SYNC_EVENT_KEY)
		if (!rawPayload) return null

		const payload = JSON.parse(rawPayload)
		if (!payload?.appointmentId) return null

		const updatedAt = Number(payload?.updatedAt)
		if (!Number.isFinite(updatedAt)) return null
		if (Date.now() - updatedAt > PAYMENT_SYNC_TTL_MS) return null

		return payload
	} catch {
		return null
	}
}

const readPersistedPaymentStatusMap = () => {
	if (typeof window === 'undefined') return {}

	try {
		const rawMap = window.localStorage.getItem(APPOINTMENT_PAYMENT_STATUS_MAP_STORAGE_KEY)
		if (!rawMap) return {}

		const parsedMap = JSON.parse(rawMap)
		if (!parsedMap || typeof parsedMap !== 'object') return {}

		const normalizedMap = {}
		Object.entries(parsedMap).forEach(([appointmentId, paymentStatus]) => {
			if (!appointmentId) return
			normalizedMap[String(appointmentId)] = paymentStatus
		})

		return normalizedMap
	} catch {
		return {}
	}
}

const persistPaymentStatusMap = (paymentStatusMap) => {
	if (typeof window === 'undefined') return

	try {
		window.localStorage.setItem(
			APPOINTMENT_PAYMENT_STATUS_MAP_STORAGE_KEY,
			JSON.stringify(paymentStatusMap || {}),
		)
	} catch {
	}
}

function AppointmentCard({ item, onOpenDetails, onDragStart, t }) {
	return (
		<Card
			hoverable
			className={styles.card}
			onClick={() => onOpenDetails(item)}
			draggable
			onDragStart={(event) => onDragStart(event, item.id)}
		>
			<div className={styles.cardTop}>
				<div className={styles.petProfile}>
					<Avatar
						size={44}
						src={item.petAvatar || undefined}
						icon={!item.petAvatar ? <MedicineBoxOutlined /> : undefined}
					>
						{!item.petAvatar ? item.avatarText : null}
					</Avatar>
					<div>
						<h4>{item.petName}</h4>
						<p>{t('appointments.card.ownerPrefix', { owner: item.ownerName })}</p>
					</div>
				</div>

				<div className={styles.timeTags}>
					<Tag color="default" icon={<ClockCircleOutlined />}>
						{item.time}
					</Tag>
					<Tag color="default" icon={<CalendarOutlined />}>
						{item.date}
					</Tag>
				</div>
			</div>

			<div className={styles.cardBottom}>
				<div className={styles.serviceInfo}>
					<MedicineBoxOutlined />
					<span>{item.serviceLabel}</span>
				</div>

				<Badge status={item.badgeStatus} text={item.statusLabel} />
			</div>
		</Card>
	)
}

export default function AppointmentManagement() {
	const { t, i18n } = useTranslation('clinic')
	const [loading, setLoading] = useState(false)
	const [updatingId, setUpdatingId] = useState('')
	const [selectedDate, setSelectedDate] = useState(dayjs())
	const [selectedTime, setSelectedTime] = useState(undefined)
	const [searchValue, setSearchValue] = useState('')
	const [appointments, setAppointments] = useState([])
	const [selectedAppointment, setSelectedAppointment] = useState(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [ownerDetailsById, setOwnerDetailsById] = useState({})
	const [paymentStatusByAppointmentId, setPaymentStatusByAppointmentId] = useState({})
	const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN'
	const missingAppointmentField = t('appointments.common.missingFromAppointment')

	const statusColumns = useMemo(
		() =>
			STATUS_COLUMN_CONFIGS.map((column) => ({
				...column,
				title: getAppointmentStatusLabel(column.key, column.key),
			})),
		[i18n.language],
	)

	const applyPaymentSyncPayload = useCallback((payload) => {
		if (!payload?.appointmentId) return
		const appointmentIdKey = String(payload.appointmentId)

		if (payload?.status) {
			setAppointments((prev) =>
				prev.map((item) =>
					item.id === payload.appointmentId ? { ...item, status: payload.status } : item,
				),
			)
		}

		if (payload?.paymentStatus) {
			setPaymentStatusByAppointmentId((prev) => {
				const nextMap = {
					...prev,
					[appointmentIdKey]: payload.paymentStatus,
				}
				persistPaymentStatusMap(nextMap)
				return nextMap
			})
		}
	}, [])

	const fetchAppointments = useCallback(async () => {
		try {
			setLoading(true)

			const response = await getAppointmentsApi(getAdminInstance(), {
				page: 1,
				limit: 300,
				date: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
				time: selectedTime,
			})

			const items = Array.isArray(response?.items) ? response.items : []
			setAppointments(items)
		} catch (error) {
			message.error(error.message || t('appointments.messages.fetchFailed'))
		} finally {
			setLoading(false)
		}
	}, [selectedDate, selectedTime, t])

	useEffect(() => {
		fetchAppointments()
	}, [fetchAppointments])

	useEffect(() => {
		let active = true

		const hydratePaymentStatus = async () => {
			const persistedPaymentMap = readPersistedPaymentStatusMap()
			const completedAppointments = appointments.filter(
				(item) => item?.status === APPOINTMENT_STATUS.COMPLETED,
			)

			if (completedAppointments.length === 0) {
				if (active) {
					setPaymentStatusByAppointmentId({})
				}
				return
			}

			const entries = await Promise.all(
				completedAppointments.map(async (item) => {
					const appointmentId = item?.id
					const appointmentMedicalId = getByPaths(item, ['medical.id', 'medicalId', 'medical_id'], '')
					const petId = item?.pet?.id

					if (!appointmentId) {
						return [appointmentId, INVOICE_STATUS.UNPAID]
					}

					try {
						let medicalRecordId = appointmentMedicalId

						if (!medicalRecordId && petId) {
							const latestMedical = await getLatestMedicalByPetIdApi(getAdminInstance(), petId)
							medicalRecordId = latestMedical?.id || ''
						}

						if (!medicalRecordId) {
							return [appointmentId, INVOICE_STATUS.UNPAID]
						}

						const invoice = await getInvoiceByMedicalRecordIdApi(getAdminInstance(), medicalRecordId)
						return [
							appointmentId,
							invoice?.status === INVOICE_STATUS.PAID ? INVOICE_STATUS.PAID : INVOICE_STATUS.UNPAID,
						]
					} catch (error) {
						if (error?.response?.status === 404) {
							return [appointmentId, INVOICE_STATUS.UNPAID]
						}

						return [appointmentId, INVOICE_STATUS.UNPAID]
					}
				}),
			)

			if (!active) return

			const nextPaymentMap = {}
			entries.forEach(([appointmentId, paymentStatus]) => {
				if (!appointmentId) return
				const appointmentIdKey = String(appointmentId)
				const persistedStatus = persistedPaymentMap[appointmentIdKey]
				nextPaymentMap[appointmentIdKey] =
					paymentStatus === INVOICE_STATUS.PAID || persistedStatus === INVOICE_STATUS.PAID
						? INVOICE_STATUS.PAID
						: paymentStatus
			})

			const recentSyncPayload = readPaymentSyncPayload()
			if (recentSyncPayload?.appointmentId && recentSyncPayload?.paymentStatus) {
				nextPaymentMap[String(recentSyncPayload.appointmentId)] = recentSyncPayload.paymentStatus
			}

			persistPaymentStatusMap({
				...persistedPaymentMap,
				...nextPaymentMap,
			})
			setPaymentStatusByAppointmentId(nextPaymentMap)
		}

		hydratePaymentStatus()

		return () => {
			active = false
		}
	}, [appointments])

	useEffect(() => {
		const syncFromStorageSnapshot = () => {
			const persistedPaymentMap = readPersistedPaymentStatusMap()
			if (Object.keys(persistedPaymentMap).length > 0) {
				setPaymentStatusByAppointmentId((prev) => ({
					...persistedPaymentMap,
					...prev,
				}))
			}

			const payload = readPaymentSyncPayload()
			if (!payload) return
			applyPaymentSyncPayload(payload)
		}

		const syncAppointmentsOnFocus = () => {
			syncFromStorageSnapshot()
			fetchAppointments()
		}

		const syncAppointmentsOnVisibilityChange = () => {
			if (!document.hidden) {
				syncFromStorageSnapshot()
				fetchAppointments()
			}
		}

		const syncAppointmentsOnPayment = (event) => {
			if (event.key !== APPOINTMENT_PAYMENT_SYNC_EVENT_KEY || !event.newValue) return

			try {
				const payload = JSON.parse(event.newValue)
				applyPaymentSyncPayload(payload)
			} catch {
			}
		}

		syncFromStorageSnapshot()

		window.addEventListener('focus', syncAppointmentsOnFocus)
		document.addEventListener('visibilitychange', syncAppointmentsOnVisibilityChange)
		window.addEventListener('storage', syncAppointmentsOnPayment)

		return () => {
			window.removeEventListener('focus', syncAppointmentsOnFocus)
			document.removeEventListener('visibilitychange', syncAppointmentsOnVisibilityChange)
			window.removeEventListener('storage', syncAppointmentsOnPayment)
		}
	}, [applyPaymentSyncPayload, fetchAppointments])

	const mappedAppointments = appointments
		.filter((item) => item.status !== APPOINTMENT_STATUS.CANCELLED)
		.map((item) => {
			const petSource = item.pet || {}
			const ownerSource = pickFirst(petSource.owner, item.owner, {})

			const petName = getByPaths(item, ['pet.name', 'petName', 'pet_name'], t('appointments.common.unknown'))
			const petAvatar = getByPaths(item, ['pet.avatar', 'petAvatar', 'pet_avatar'], '')
			const petSpecies = getByPaths(item, ['pet.species', 'petSpecies', 'pet_species'], null)
			const petBreed = getByPaths(item, ['pet.breed', 'petBreed', 'pet_breed'], null)
			const petGender = getByPaths(item, ['pet.gender', 'petGender', 'pet_gender'], null)
			const petDateOfBirth = getByPaths(item, ['pet.dateOfBirth', 'pet.date_of_birth', 'petDateOfBirth', 'pet_date_of_birth'], null)
			const petFeature = getByPaths(item, ['pet.note', 'pet.featureNote', 'pet_note', 'featureNote', 'feature_note'], null)
			const ownerId = getByPaths(item, ['pet.owner.id', 'owner.id', 'ownerId', 'owner_id', 'pet.ownerId'], '')
			const ownerName = getByPaths(item, ['pet.owner.fullName', 'owner.fullName', 'ownerName', 'owner_name'], t('appointments.common.unknown'))
			const ownerPhone = getByPaths(item, ['pet.owner.phone', 'owner.phone', 'ownerPhone', 'owner_phone'], missingAppointmentField)

			const badgeByStatus = {
				[APPOINTMENT_STATUS.BOOKED]: 'default',
				[APPOINTMENT_STATUS.IN_PROGRESS]: 'processing',
				[APPOINTMENT_STATUS.COMPLETED]: 'success',
			}

			const paymentStatus = paymentStatusByAppointmentId[item.id]
			const isCompletedUnpaid =
				item.status === APPOINTMENT_STATUS.COMPLETED && paymentStatus !== INVOICE_STATUS.PAID
			const isCompletedPaid =
				item.status === APPOINTMENT_STATUS.COMPLETED && paymentStatus === INVOICE_STATUS.PAID

			const statusLabel = isCompletedPaid
				? t('appointments.status.paid')
				: isCompletedUnpaid
					? t('appointments.status.unpaid')
					: getAppointmentStatusLabel(item.status, item.status)

			const badgeStatus = isCompletedUnpaid
				? 'warning'
				: badgeByStatus[item.status] || 'default'

			return {
				id: item.id,
				status: item.status,
				statusLabel,
				badgeStatus,
				date: formatDisplayDate(item.appointmentDate, locale),
				time: getTimeValue(item.appointmentTime),
				appointmentDateRaw: item.appointmentDate,
				service: item.service,
				serviceLabel: getServiceLabel(item.service, item.service),
				petName,
				petAvatar,
				avatarText: (petName || 'P').charAt(0).toUpperCase(),
				ownerId,
				ownerName,
				ownerPhone,
				speciesLabel: petSpecies ? getPetSpeciesLabel(petSpecies) : missingAppointmentField,
				breedLabel: getPetBreedLabel(petBreed, petSpecies),
				genderLabel: getGenderLabel(petGender, t, missingAppointmentField),
				ageLabel: getAgeLabel(petDateOfBirth, t),
				dateOfBirthLabel: petDateOfBirth
					? formatDateDDMMYYYY(petDateOfBirth, missingAppointmentField)
					: missingAppointmentField,
				featureNote: petFeature || missingAppointmentField,
				appointmentNote: item.note || t('appointments.common.noNotes'),
				clinicName: item.clinic?.name || t('appointments.common.unknown'),
				clinicAddress: item.clinic?.address || t('appointments.common.unknown'),
				veterinarianName:
					getByPaths(item, ['veterinarian.user.fullName', 'veterinarianName'], t('appointments.common.notAssigned')),
				ownerRaw: ownerSource,
				petRaw: petSource,
				paymentStatus,
			}
		})

	const keyword = searchValue.trim().toLowerCase()
	const filteredAppointments = !keyword
		? mappedAppointments
		: mappedAppointments.filter((item) => {
				const normalized = [item.petName, item.ownerName, item.serviceLabel, item.veterinarianName]
					.join(' ')
					.toLowerCase()

				return normalized.includes(keyword)
		  })

	const groupedAppointments = {
		[APPOINTMENT_STATUS.BOOKED]: [],
		[APPOINTMENT_STATUS.IN_PROGRESS]: [],
		[APPOINTMENT_STATUS.COMPLETED]: [],
	}

	filteredAppointments.forEach((item) => {
		if (groupedAppointments[item.status]) {
			groupedAppointments[item.status].push(item)
		}
	})

	const handleDragStart = (event, appointmentId) => {
		event.dataTransfer.setData('text/plain', appointmentId)
	}

	const handleDropToColumn = async (event, nextStatus) => {
		event.preventDefault()
		const appointmentId = event.dataTransfer.getData('text/plain')

		if (!appointmentId) return

		const previousAppointment = appointments.find((item) => item.id === appointmentId)
		if (!previousAppointment || previousAppointment.status === nextStatus) return

		setAppointments((prev) => prev.map((item) => (item.id === appointmentId ? { ...item, status: nextStatus } : item)))

		try {
			setUpdatingId(appointmentId)
			await updateAppointmentStatusApi(getAdminInstance(), appointmentId, nextStatus)
			message.success(
				t('appointments.messages.updateSuccess', {
					status: getAppointmentStatusLabel(nextStatus, nextStatus),
				}),
			)
		} catch (error) {
			setAppointments((prev) =>
				prev.map((item) =>
					item.id === appointmentId ? { ...item, status: previousAppointment.status } : item,
				),
			)
			message.error(error.message || t('appointments.messages.updateFailed'))
		} finally {
			setUpdatingId('')
		}
	}

	const handleOpenDetails = async (appointment) => {
		setSelectedAppointment(appointment)
		setIsModalOpen(true)

		const ownerId = appointment?.ownerId
		if (!ownerId || ownerDetailsById[ownerId]) return

		try {
			const res = await getUserByIdApi(getAdminInstance(), ownerId)
			const ownerData = res?.data

			if (ownerData) {
				setOwnerDetailsById((prev) => ({ ...prev, [ownerId]: ownerData }))
			}
		} catch {
		}
	}

	const canClinicCancelAppointment =
		selectedAppointment &&
		selectedAppointment.status === APPOINTMENT_STATUS.BOOKED &&
		(() => {
			const appointmentStartMs = getAppointmentStartMs(
				selectedAppointment.appointmentDateRaw,
				selectedAppointment.time,
			)
			if (!appointmentStartMs) return false
			return Date.now() >= appointmentStartMs
		})()

	const handleClinicCancelAppointment = () => {
		if (!selectedAppointment) return

		Modal.confirm({
			title: t('appointments.cancelModal.title'),
			content: t('appointments.cancelModal.content'),
			okText: t('appointments.cancelModal.okText'),
			cancelText: t('appointments.cancelModal.cancelText'),
			okButtonProps: { danger: true },
			centered: true,
			async onOk() {
				try {
					setUpdatingId(selectedAppointment.id)
					await updateAppointmentStatusApi(getAdminInstance(), selectedAppointment.id, APPOINTMENT_STATUS.CANCELLED)
					message.success(t('appointments.messages.cancelSuccess'))
					setIsModalOpen(false)
					setSelectedAppointment(null)
					await fetchAppointments()
				} catch (error) {
					message.error(error.message || t('appointments.messages.cancelFailed'))
				} finally {
					setUpdatingId('')
				}
			},
		})
	}

	const totalAppointments = filteredAppointments.length
	const timeOptions = useMemo(() => TIME_SLOTS.map((slot) => ({ value: slot, label: slot })), [])
	const ownerDetails = selectedAppointment?.ownerId
		? ownerDetailsById[selectedAppointment.ownerId]
		: null
	const ownerNameDisplay = ownerDetails?.fullName || selectedAppointment?.ownerName || t('appointments.common.unknown')
	const ownerPhoneDisplay = ownerDetails?.phone || selectedAppointment?.ownerPhone || missingAppointmentField

	return (
		<div className={styles.content}>
				<div className={styles.topBar}>
					<div className={styles.searchBox}>
						<SearchOutlined />
						<Input
							placeholder={t('appointments.searchPlaceholder')}
							variant="borderless"
							value={searchValue}
							onChange={(event) => setSearchValue(event.target.value)}
						/>
					</div>
					<div className={styles.topBarActionSpacer} aria-hidden="true" />
				</div>

				<div className={styles.mainBody}>
					<Title level={3} className={styles.pageTitle}>
						{t('appointments.pageTitle')}
					</Title>
					<Text className={styles.pageSubTitle}>
						{t('appointments.pageSubtitle', { count: totalAppointments })}
					</Text>

					<Card className={styles.filterCard}>
						<Row gutter={[12, 12]} align="middle">
							<Col xs={24} md={12}>
								<Text strong>{t('appointments.filters.examDate')}</Text>
								<DatePicker
									className={styles.filterInput}
									format="DD/MM/YYYY"
									value={selectedDate}
									onChange={(value) => setSelectedDate(value)}
									allowClear
								/>
							</Col>

							<Col xs={24} md={12}>
								<Text strong>{t('appointments.filters.examTime')}</Text>
								<Select
									size='large'
									className={styles.filterInput}
									placeholder={t('appointments.filters.timePlaceholder')}
									allowClear
									value={selectedTime}
									onChange={(value) => setSelectedTime(value)}
									options={timeOptions}
								/>
							</Col>

						</Row>
					</Card>

					<Spin spinning={loading || Boolean(updatingId)}>
						<div className={styles.groupSection}>
							{statusColumns.map((column) => {
								const columnData = groupedAppointments[column.key] || []

								return (
									<div
										key={column.key}
										className={styles.groupColumn}
										onDragOver={(event) => event.preventDefault()}
										onDrop={(event) => handleDropToColumn(event, column.key)}
									>
										<div className={styles.columnHeader}>
											<div>
												<span className={`${styles.dot} ${column.dotClass}`} />
												<span>{column.title}</span>
											</div>
											<Badge count={columnData.length} className={styles.countBadge} />
										</div>

										<div className={styles.cardList}>
											{columnData.length > 0 ? (
												columnData.map((item) => (
													<AppointmentCard
														key={item.id}
														item={item}
														onOpenDetails={handleOpenDetails}
														onDragStart={handleDragStart}
														t={t}
													/>
												))
											) : (
												<div className={styles.emptyWrap}>
													<Empty description={t('appointments.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
												</div>
											)}
										</div>
									</div>
								)
							})}
						</div>
					</Spin>
				</div>
				
				<Modal
					title={t('appointments.detailModal.title')}
					open={isModalOpen}
					onCancel={() => setIsModalOpen(false)}
					footer={[
						canClinicCancelAppointment ? (
							<Button key="cancel-appointment" danger onClick={handleClinicCancelAppointment}>
								{t('appointments.detailModal.actions.deleteBooking')}
							</Button>
						) : null,
					]}
					width={920}
					styles={{ body: { padding: '12px 18px' } }}
					centered
				>
					{selectedAppointment ? (
						<div className={styles.modalBody}>
							<div className={styles.petHeader}>
								<Avatar
									size={72}
									src={selectedAppointment.petAvatar || undefined}
									icon={!selectedAppointment.petAvatar ? <MedicineBoxOutlined /> : undefined}
								>
									{!selectedAppointment.petAvatar ? selectedAppointment.avatarText : null}
								</Avatar>
								<div>
									<Title level={4} className={styles.petTitle}>{selectedAppointment.petName}</Title>
								</div>
							</div>

							<div className={styles.infoSection}>
								<div className={`${styles.sectionTitle} ${styles.petSectionTitle}`}>{t('appointments.detailModal.petSectionTitle')}</div>
								<div className={styles.infoGrid}>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.petName')}</span><strong>{selectedAppointment.petName}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.birthAndAge')}</span><strong>{`${selectedAppointment.dateOfBirthLabel} / ${selectedAppointment.ageLabel}`}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.species')}</span><strong>{selectedAppointment.speciesLabel}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.gender')}</span><strong>{selectedAppointment.genderLabel}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.breed')}</span><strong>{selectedAppointment.breedLabel}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.ownerName')}</span><strong>{ownerNameDisplay}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.feature')}</span><strong>{selectedAppointment.featureNote}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.phone')}</span><strong>{ownerPhoneDisplay}</strong></div>
								</div>
							</div>

							<div className={styles.infoSection}>
								<div className={`${styles.sectionTitle} ${styles.appointmentSectionTitle}`}>{t('appointments.detailModal.appointmentSectionTitle')}</div>
								<div className={styles.infoGrid}>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.clinic')}</span><strong>{selectedAppointment.clinicName}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.dateTime')}</span><strong>{`${selectedAppointment.date} - ${selectedAppointment.time}`}</strong></div>
									<div className={`${styles.infoRow} ${styles.fullWidthRow}`}><span>{t('appointments.detailModal.fields.address')}</span><strong>{selectedAppointment.clinicAddress}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.service')}</span><strong>{selectedAppointment.serviceLabel}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.veterinarian')}</span><strong>{selectedAppointment.veterinarianName}</strong></div>
									<div className={styles.infoRow}><span>{t('appointments.detailModal.fields.status')}</span><Tag icon={selectedAppointment.status === APPOINTMENT_STATUS.COMPLETED ? <DollarCircleOutlined /> : <CheckCircleOutlined />}>{selectedAppointment.statusLabel}</Tag></div>
									<div className={`${styles.infoRow} ${styles.fullWidthRow}`}><span>{t('appointments.detailModal.fields.note')}</span><strong>{selectedAppointment.appointmentNote}</strong></div>
								</div>
							</div>
						</div>
					) : null}
				</Modal>
		</div>
	)
}
