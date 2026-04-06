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
import { useCallback, useEffect, useState } from 'react'
import {
    APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
    APPOINTMENT_STATUS,
    getClinicAppointmentsApi,
    updateAppointmentStatusApi,
} from '../../../../data/Clinic/api/appointmentApi'
import { getInvoiceByMedicalRecordIdApi, INVOICE_STATUS } from '../../../../data/Clinic/api/invoiceApi'
import { getLatestMedicalByPetId } from '../../../../data/Clinic/api/medicalApi'
import { getUserByIdApi } from '../../../../data/Clinic/api/user'
import {
    getAppointmentStatusLabel,
    getPetBreedLabel,
    getPetSpeciesLabel,
    getServiceLabel,
} from '../../../../utils/enumLabel'
import styles from './appointmentManagement.module.css'

const { Title, Text } = Typography

const TIME_SLOTS = ['08:00', '08:30','09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

const STATUS_COLUMNS = [
	{
		key: APPOINTMENT_STATUS.BOOKED,
		title: getAppointmentStatusLabel(APPOINTMENT_STATUS.BOOKED),
		dotClass: styles.grayDot,
		badgeStatus: 'default',
	},
	{
		key: APPOINTMENT_STATUS.IN_PROGRESS,
		title: getAppointmentStatusLabel(APPOINTMENT_STATUS.IN_PROGRESS),
		dotClass: styles.greenDot,
		badgeStatus: 'processing',
	},
	{
		key: APPOINTMENT_STATUS.COMPLETED,
		title: getAppointmentStatusLabel(APPOINTMENT_STATUS.COMPLETED),
		dotClass: styles.blueDot,
		badgeStatus: 'success',
	},
]

const MISSING_APPOINTMENT_FIELD = 'Không có trong dữ liệu lịch hẹn'

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

const getAgeLabel = (dateOfBirth) => {
	if (!dateOfBirth) return 'Chưa cập nhật'

	const birthDate = new Date(dateOfBirth)
	if (Number.isNaN(birthDate.getTime())) return 'Chưa cập nhật'

	const now = new Date()
	let totalMonths =
		(now.getFullYear() - birthDate.getFullYear()) * 12 +
		(now.getMonth() - birthDate.getMonth())

	if (now.getDate() < birthDate.getDate()) {
		totalMonths -= 1
	}

	if (totalMonths < 0) return 'Chưa cập nhật'
	if (totalMonths < 24) return `${totalMonths} tháng`
	return `${Math.floor(totalMonths / 12)} tuổi`
}

const formatDisplayDate = (dateValue) => {
	if (!dateValue) return ''
	return new Date(dateValue).toLocaleDateString('vi-VN')
}

const getTimeValue = (time) => (time || '').slice(0, 5)

const getGenderLabel = (value) => {
	if (typeof value === 'boolean') {
		return value ? 'Đực' : 'Cái'
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase()
		if (!normalized) return MISSING_APPOINTMENT_FIELD
		if (['male', 'm', 'duc', 'đực', 'true', '1'].includes(normalized)) return 'Đực'
		if (['female', 'f', 'cai', 'cái', 'false', '0'].includes(normalized)) return 'Cái'
		return value
	}

	return MISSING_APPOINTMENT_FIELD
}

function AppointmentCard({ item, onOpenDetails, onDragStart }) {
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
						<p>{`Chủ: ${item.ownerName}`}</p>
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

	const fetchAppointments = useCallback(async () => {
		try {
			setLoading(true)

			const response = await getClinicAppointmentsApi({
				page: 1,
				limit: 300,
				date: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
				time: selectedTime,
			})

			const items = Array.isArray(response?.items) ? response.items : []
			setAppointments(items)
		} catch (error) {
			message.error(error.message || 'Không thể tải danh sách lịch khám của phòng khám')
		} finally {
			setLoading(false)
		}
	}, [selectedDate, selectedTime])

	useEffect(() => {
		fetchAppointments()
	}, [fetchAppointments])

	useEffect(() => {
		let active = true

		const hydratePaymentStatus = async () => {
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
					const petId = item?.pet?.id

					if (!appointmentId || !petId) {
						return [appointmentId, INVOICE_STATUS.UNPAID]
					}

					try {
						const latestMedical = await getLatestMedicalByPetId(petId)
						if (!latestMedical?.id) {
							return [appointmentId, INVOICE_STATUS.UNPAID]
						}

						const invoice = await getInvoiceByMedicalRecordIdApi(latestMedical.id)
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
				nextPaymentMap[appointmentId] = paymentStatus
			})

			setPaymentStatusByAppointmentId(nextPaymentMap)
		}

		hydratePaymentStatus()

		return () => {
			active = false
		}
	}, [appointments])

	useEffect(() => {
		const syncAppointmentsOnFocus = () => {
			fetchAppointments()
		}

		const syncAppointmentsOnVisibilityChange = () => {
			if (!document.hidden) {
				fetchAppointments()
			}
		}

		const syncAppointmentsOnPayment = (event) => {
			if (event.key !== APPOINTMENT_PAYMENT_SYNC_EVENT_KEY || !event.newValue) return

			try {
				const payload = JSON.parse(event.newValue)
				if (!payload?.appointmentId || !payload?.status) return

				setAppointments((prev) =>
					prev.map((item) =>
						item.id === payload.appointmentId ? { ...item, status: payload.status } : item,
					),
				)

				if (payload?.paymentStatus) {
					setPaymentStatusByAppointmentId((prev) => ({
						...prev,
						[payload.appointmentId]: payload.paymentStatus,
					}))
				}
			} catch {
			}
		}

		window.addEventListener('focus', syncAppointmentsOnFocus)
		document.addEventListener('visibilitychange', syncAppointmentsOnVisibilityChange)
		window.addEventListener('storage', syncAppointmentsOnPayment)

		return () => {
			window.removeEventListener('focus', syncAppointmentsOnFocus)
			document.removeEventListener('visibilitychange', syncAppointmentsOnVisibilityChange)
			window.removeEventListener('storage', syncAppointmentsOnPayment)
		}
	}, [fetchAppointments])

	const mappedAppointments = appointments
		.filter((item) => item.status !== APPOINTMENT_STATUS.CANCELLED)
		.map((item) => {
			const petSource = item.pet || {}
			const ownerSource = pickFirst(petSource.owner, item.owner, {})

			const petName = getByPaths(item, ['pet.name', 'petName', 'pet_name'], 'Không rõ')
			const petAvatar = getByPaths(item, ['pet.avatar', 'petAvatar', 'pet_avatar'], '')
			const petSpecies = getByPaths(item, ['pet.species', 'petSpecies', 'pet_species'], null)
			const petBreed = getByPaths(item, ['pet.breed', 'petBreed', 'pet_breed'], null)
			const petGender = getByPaths(item, ['pet.gender', 'petGender', 'pet_gender'], null)
			const petDateOfBirth = getByPaths(item, ['pet.dateOfBirth', 'pet.date_of_birth', 'petDateOfBirth', 'pet_date_of_birth'], null)
			const petFeature = getByPaths(item, ['pet.note', 'pet.featureNote', 'pet_note', 'featureNote', 'feature_note'], null)
			const ownerId = getByPaths(item, ['pet.owner.id', 'owner.id', 'ownerId', 'owner_id', 'pet.ownerId'], '')
			const ownerName = getByPaths(item, ['pet.owner.fullName', 'owner.fullName', 'ownerName', 'owner_name'], 'Không rõ')
			const ownerPhone = getByPaths(item, ['pet.owner.phone', 'owner.phone', 'ownerPhone', 'owner_phone'], MISSING_APPOINTMENT_FIELD)

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
				? 'Đã thanh toán'
				: isCompletedUnpaid
					? 'Chưa thanh toán'
					: getAppointmentStatusLabel(item.status, item.status)

			const badgeStatus = isCompletedUnpaid
				? 'warning'
				: badgeByStatus[item.status] || 'default'

			return {
				id: item.id,
				status: item.status,
				statusLabel,
				badgeStatus,
				date: formatDisplayDate(item.appointmentDate),
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
				speciesLabel: petSpecies ? getPetSpeciesLabel(petSpecies) : MISSING_APPOINTMENT_FIELD,
				breedLabel: getPetBreedLabel(petBreed, petSpecies),
				genderLabel: getGenderLabel(petGender),
				ageLabel: getAgeLabel(petDateOfBirth),
				dateOfBirthLabel: petDateOfBirth
					? new Date(petDateOfBirth).toLocaleDateString('vi-VN')
					: MISSING_APPOINTMENT_FIELD,
				featureNote: petFeature || MISSING_APPOINTMENT_FIELD,
				appointmentNote: item.note || 'Không có ghi chú',
				clinicName: item.clinic?.name || 'Không rõ',
				clinicAddress: item.clinic?.address || 'Không rõ',
				veterinarianName:
					getByPaths(item, ['veterinarian.user.fullName', 'veterinarianName'], 'Chưa phân công'),
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
			await updateAppointmentStatusApi(appointmentId, nextStatus)
			message.success(`Đã cập nhật trạng thái thành ${getAppointmentStatusLabel(nextStatus, nextStatus)}`)
		} catch (error) {
			setAppointments((prev) =>
				prev.map((item) =>
					item.id === appointmentId ? { ...item, status: previousAppointment.status } : item,
				),
			)
			message.error(error.message || 'Cập nhật trạng thái thất bại')
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
			const res = await getUserByIdApi(ownerId)
			const ownerData = res?.data

			if (ownerData) {
				setOwnerDetailsById((prev) => ({ ...prev, [ownerId]: ownerData }))
			}
		} catch {
		}
	}

	const canClinicCancelAppointment =
		selectedAppointment &&
		selectedAppointment.status === APPOINTMENT_STATUS.BOOKED

	const handleClinicCancelAppointment = () => {
		if (!selectedAppointment) return

		Modal.confirm({
			title: 'Xóa lịch đặt',
			content: 'Xác nhận hủy lịch đặt này?',
			okText: 'Xóa lịch',
			okButtonProps: { danger: true },
			centered: true,
			async onOk() {
				try {
					setUpdatingId(selectedAppointment.id)
					await updateAppointmentStatusApi(selectedAppointment.id, APPOINTMENT_STATUS.CANCELLED)
					message.success('Đã hủy lịch đặt khám')
					setIsModalOpen(false)
					setSelectedAppointment(null)
					await fetchAppointments()
				} catch (error) {
					message.error(error.message || 'Không thể hủy lịch đặt')
				} finally {
					setUpdatingId('')
				}
			},
		})
	}

	const totalAppointments = filteredAppointments.length
	const timeOptions = TIME_SLOTS.map((slot) => ({ value: slot, label: slot }))
	const ownerDetails = selectedAppointment?.ownerId
		? ownerDetailsById[selectedAppointment.ownerId]
		: null
	const ownerNameDisplay = ownerDetails?.fullName || selectedAppointment?.ownerName || 'Không rõ'
	const ownerPhoneDisplay = ownerDetails?.phone || selectedAppointment?.ownerPhone || MISSING_APPOINTMENT_FIELD

	return (
		<div className={styles.content}>
				<div className={styles.topBar}>
					<div className={styles.searchBox}>
						<SearchOutlined />
						<Input
							placeholder="Tìm thú cưng, chủ nuôi, dịch vụ..."
							variant="borderless"
							value={searchValue}
							onChange={(event) => setSearchValue(event.target.value)}
						/>
					</div>
				</div>

				<div className={styles.mainBody}>
					<Title level={3} className={styles.pageTitle}>
						Quản lý lịch khám
					</Title>
					<Text className={styles.pageSubTitle}>
						{`Tổng ${totalAppointments} lịch hẹn của ngày hiện tại.`}
					</Text>

					<Card className={styles.filterCard}>
						<Row gutter={[12, 12]} align="middle">
							<Col xs={24} md={12}>
								<Text strong>Ngày khám</Text>
								<DatePicker
									className={styles.filterInput}
									format="DD/MM/YYYY"
									value={selectedDate}
									onChange={(value) => setSelectedDate(value)}
									allowClear
								/>
							</Col>

							<Col xs={24} md={12}>
								<Text strong>Giờ khám</Text>
								<Select
									className={styles.filterInput}
									placeholder="Chọn khung giờ"
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
							{STATUS_COLUMNS.map((column) => {
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
													/>
												))
											) : (
												<div className={styles.emptyWrap}>
													<Empty description="Không có lịch hẹn" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
				style={{textAlign: 'center'}}
					title="THÔNG TIN CHI TIẾT THÚ CƯNG & LỊCH KHÁM"
					open={isModalOpen}
					onCancel={() => setIsModalOpen(false)}
					footer={[
						canClinicCancelAppointment ? (
							<Button key="cancel-appointment" danger onClick={handleClinicCancelAppointment}>
								Xóa lịch đặt
							</Button>
						) : null,
					]}
					width={920}
					centered
				>
					{selectedAppointment ? (
						<div className={styles.modalBody}>
							<div className={styles.petHeader}>
								<Avatar
									size={84}
									src={selectedAppointment.petAvatar || undefined}
									icon={!selectedAppointment.petAvatar ? <MedicineBoxOutlined /> : undefined}
								>
									{!selectedAppointment.petAvatar ? selectedAppointment.avatarText : null}
								</Avatar>
								<div>
									<Title level={3} className={styles.petTitle}>{selectedAppointment.petName}</Title>
								</div>
							</div>

							<div className={styles.infoSection}>
								<div className={`${styles.sectionTitle} ${styles.petSectionTitle}`}>Thông tin Thú cưng</div>
								<div className={styles.infoGrid}>
									<div className={styles.infoRow}><span>Tên thú cưng:</span><strong>{selectedAppointment.petName}</strong></div>
									<div className={styles.infoRow}><span>Ngày sinh / Tuổi:</span><strong>{`${selectedAppointment.dateOfBirthLabel} / ${selectedAppointment.ageLabel}`}</strong></div>
									<div className={styles.infoRow}><span>Loài:</span><strong>{selectedAppointment.speciesLabel}</strong></div>
									<div className={styles.infoRow}><span>Giới tính:</span><strong>{selectedAppointment.genderLabel}</strong></div>
									<div className={styles.infoRow}><span>Giống:</span><strong>{selectedAppointment.breedLabel}</strong></div>
									<div className={styles.infoRow}><span>Tên chủ thú cưng:</span><strong>{ownerNameDisplay}</strong></div>
									<div className={styles.infoRow}><span>Đặc điểm nhận dạng:</span><strong>{selectedAppointment.featureNote}</strong></div>
									<div className={styles.infoRow}><span>Số điện thoại:</span><strong>{ownerPhoneDisplay}</strong></div>
								</div>
							</div>

							<div className={styles.infoSection}>
								<div className={`${styles.sectionTitle} ${styles.appointmentSectionTitle}`}>Thông tin Lịch Khám</div>
								<div className={styles.infoGrid}>
									<div className={styles.infoRow}><span>Phòng khám:</span><strong>{selectedAppointment.clinicName}</strong></div>
									<div className={styles.infoRow}><span>Ngày & giờ:</span><strong>{`${selectedAppointment.date} - ${selectedAppointment.time}`}</strong></div>
									<div className={`${styles.infoRow} ${styles.fullWidthRow}`}><span>Địa chỉ:</span><strong>{selectedAppointment.clinicAddress}</strong></div>
									<div className={styles.infoRow}><span>Dịch vụ:</span><strong>{selectedAppointment.serviceLabel}</strong></div>
									<div className={styles.infoRow}><span>Bác sĩ:</span><strong>{selectedAppointment.veterinarianName}</strong></div>
									<div className={styles.infoRow}><span>Trạng thái:</span><Tag icon={selectedAppointment.status === APPOINTMENT_STATUS.COMPLETED ? <DollarCircleOutlined /> : <CheckCircleOutlined />}>{selectedAppointment.statusLabel}</Tag></div>
									<div className={`${styles.infoRow} ${styles.fullWidthRow}`}><span>Ghi chú:</span><strong>{selectedAppointment.appointmentNote}</strong></div>
								</div>
							</div>
						</div>
					) : null}
				</Modal>
		</div>
	)
}
