import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
	Avatar,
	Badge,
	Button,
	Card,
	Col,
	DatePicker,
	Empty,
	Input,
	Modal,
	Row,
	Select,
	Spin,
	Tag,
	Typography,
	message,
} from 'antd'
import {
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	DollarCircleOutlined,
	MedicineBoxOutlined,
	NotificationOutlined,
	SearchOutlined,
} from '@ant-design/icons'
import styles from './appointmentManagement.module.css'
import {
	APPOINTMENT_STATUS,
	APPOINTMENT_STATUS_LABEL,
	SERVICE_OPTIONS,
	getClinicAppointmentsApi,
	updateAppointmentStatusApi,
} from '../../../../data/adminClinic/api/appointmentApi'

const { Title, Text } = Typography

const TIME_SLOTS = ['08:00', '09:00', '10:30', '13:30', '15:00', '16:30']

const STATUS_COLUMNS = [
	{
		key: APPOINTMENT_STATUS.BOOKED,
		title: 'Chờ khám',
		dotClass: styles.grayDot,
		badgeStatus: 'default',
	},
	{
		key: APPOINTMENT_STATUS.IN_PROGRESS,
		title: 'Đang khám',
		dotClass: styles.greenDot,
		badgeStatus: 'processing',
	},
	{
		key: APPOINTMENT_STATUS.COMPLETED,
		title: 'Hoàn tất',
		dotClass: styles.blueDot,
		badgeStatus: 'success',
	},
]

const LEGACY_TEXT_MAP = {
	'Chờ khám': 'Chờ khám',
	'Đang khám': 'Đang khám',
	'Đã thanh toán': 'Đã thanh toán',
	'Đã hủy': 'Đã hủy',
	'Khám sức khỏe định kỳ': 'Khám sức khỏe định kỳ',
	'Khám bệnh': 'Khám bệnh',
	'Tiêm chủng': 'Tiêm chủng',
	'Tẩy giun': 'Tẩy giun',
	'Siêu âm xét nghiệm': 'Siêu âm xét nghiệm',
	'Phẫu thuật': 'Phẫu thuật',
	'Cấp cứu': 'Cấp cứu',
}

const normalizeClinicText = (value) => {
	if (!value) return value

	return LEGACY_TEXT_MAP[value] || value
}

const getEnumLabel = (value) => {
	if (!value) return 'Chưa cập nhật'

	return String(value)
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

const getBreedLabel = (breed, species) => {
	const rawBreed = typeof breed === 'object' && breed !== null ? breed.name || breed.id || '' : breed || ''

	if (!rawBreed) return 'Chưa cập nhật giống'

	const rawValue = String(rawBreed).trim()
	const speciesPrefix = species ? `${String(species).trim()}_` : ''

	if (speciesPrefix && rawValue.startsWith(speciesPrefix)) {
		return getEnumLabel(rawValue.slice(speciesPrefix.length))
	}

	const matchedPrefix = rawValue.match(/^[A-Z]+_/)
	if (matchedPrefix) {
		return getEnumLabel(rawValue.slice(matchedPrefix[0].length))
	}

	return getEnumLabel(rawValue)
}

const getAgeLabel = (dateOfBirth) => {
	if (!dateOfBirth) return 'Chưa cập nhật'

	const birthDate = new Date(dateOfBirth)
	if (Number.isNaN(birthDate.getTime())) return 'Chưa cập nhật'

	const now = new Date()
	let years = now.getFullYear() - birthDate.getFullYear()
	const monthDiff = now.getMonth() - birthDate.getMonth()

	if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
		years -= 1
	}

	if (years <= 0) {
		const months = Math.max(
			(now.getFullYear() - birthDate.getFullYear()) * 12 + now.getMonth() - birthDate.getMonth(),
			1,
		)
		return `${months} tháng`
	}

	return `${years} tuổi`
}

const formatDisplayDate = (dateValue) => {
	if (!dateValue) return ''
	return new Date(dateValue).toLocaleDateString('vi-VN')
}

const getTimeValue = (time) => (time || '').slice(0, 5)

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

	const mappedAppointments = appointments
		.filter((item) => item.status !== APPOINTMENT_STATUS.CANCELLED)
		.map((item) => {
			const badgeByStatus = {
				[APPOINTMENT_STATUS.BOOKED]: 'default',
				[APPOINTMENT_STATUS.IN_PROGRESS]: 'processing',
				[APPOINTMENT_STATUS.COMPLETED]: 'success',
			}

			return {
				id: item.id,
				status: item.status,
				statusLabel: normalizeClinicText(APPOINTMENT_STATUS_LABEL[item.status] || item.status),
				badgeStatus: badgeByStatus[item.status] || 'default',
				date: formatDisplayDate(item.appointmentDate),
				time: getTimeValue(item.appointmentTime),
				appointmentDateRaw: item.appointmentDate,
				service: item.service,
				serviceLabel: normalizeClinicText(SERVICE_OPTIONS[item.service] || item.service),
				petName: item.pet?.name || 'Không rõ',
				petAvatar: item.pet?.avatar || '',
				avatarText: (item.pet?.name || 'P').charAt(0).toUpperCase(),
				ownerName: item.pet?.owner?.fullName || 'Không rõ',
				ownerPhone: item.pet?.owner?.phone || 'Chưa cập nhật',
				speciesLabel: getEnumLabel(item.pet?.species),
				breedLabel: getBreedLabel(item.pet?.breed, item.pet?.species),
				genderLabel:
					typeof item.pet?.gender === 'boolean'
						? item.pet.gender
							? 'Đực'
							: 'Cái'
						: 'Chưa cập nhật',
				ageLabel: getAgeLabel(item.pet?.dateOfBirth),
				dateOfBirthLabel: item.pet?.dateOfBirth
					? new Date(item.pet.dateOfBirth).toLocaleDateString('vi-VN')
					: 'Chưa cập nhật',
				weightLabel: item.pet?.weight ? `${item.pet.weight} kg` : 'Chưa cập nhật',
				featureNote: item.pet?.note || 'Chưa cập nhật',
				appointmentNote: item.note || 'Không có ghi chú',
				clinicName: item.clinic?.name || 'Không rõ',
				clinicAddress: item.clinic?.address || 'Không rõ',
				veterinarianName: item.veterinarian?.user?.fullName || 'Chưa phân công',
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
			message.success(`Đã cập nhật trạng thái thành ${APPOINTMENT_STATUS_LABEL[nextStatus]}`)
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

	const handleOpenDetails = (appointment) => {
		setSelectedAppointment(appointment)
		setIsModalOpen(true)
	}

	const isPastAppointment = (appointment) => {
		if (!appointment?.appointmentDateRaw) return false

		const now = new Date()
		const appointmentDate = new Date(appointment.appointmentDateRaw)
		if (Number.isNaN(appointmentDate.getTime())) return false

		const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		if (appointmentDay < today) return true

		if (appointmentDay > today || !appointment?.time) return false

		const appointmentDateTime = new Date(`${dayjs(appointmentDate).format('YYYY-MM-DD')}T${appointment.time}:00`)
		if (Number.isNaN(appointmentDateTime.getTime())) return false

		return appointmentDateTime < now
	}

	const isFutureAppointmentDate = (appointment) => {
		if (!appointment?.appointmentDateRaw) return false

		const appointmentDate = new Date(appointment.appointmentDateRaw)
		if (Number.isNaN(appointmentDate.getTime())) return false

		const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		return appointmentDay > today
	}

	const hasUserCancellationRequest = (appointment) => {
		const note = (appointment?.appointmentNote || '').toLowerCase()
		return /huy|hủy|cancel/.test(note)
	}

	const canClinicCancelAppointment =
		selectedAppointment &&
		selectedAppointment.status === APPOINTMENT_STATUS.BOOKED &&
		(
			isPastAppointment(selectedAppointment) ||
			hasUserCancellationRequest(selectedAppointment) ||
			isFutureAppointmentDate(selectedAppointment)
		)

	const handleClinicCancelAppointment = () => {
		if (!selectedAppointment) return

		Modal.confirm({
			title: 'Xóa lịch đặt',
			content: 'Xác nhận hủy lịch đặt này?',
			okText: 'Xóa lịch',
			cancelText: 'Đóng',
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
					<Button type="text" icon={<NotificationOutlined />} />
				</div>

				<div className={styles.mainBody}>
					<Title level={2} className={styles.pageTitle}>
						Bảng quản lý lịch khám
					</Title>
					<Text className={styles.pageSubTitle}>
						{`Tổng số ${totalAppointments} lịch hẹn phù hợp bộ lọc hiện tại.`}
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
					title="THÔNG TIN CHI TIẾT THÚ CƯNG & LỊCH KHÁM"
					open={isModalOpen}
					onCancel={() => setIsModalOpen(false)}
					footer={[
						canClinicCancelAppointment ? (
							<Button key="cancel-appointment" danger onClick={handleClinicCancelAppointment}>
								Xóa lịch đặt
							</Button>
						) : null,
						<Button key="close" onClick={() => setIsModalOpen(false)}>
							Đóng
						</Button>,
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
									<Text className={styles.petSubMeta}>
										{`${selectedAppointment.breedLabel} · ${selectedAppointment.ageLabel} · ${selectedAppointment.weightLabel}`}
									</Text>
									<div className={styles.petMetaLine}>
										<span className={styles.metaDot} />
										<span>{selectedAppointment.genderLabel}</span>
										<span>Ngày sinh: {selectedAppointment.dateOfBirthLabel}</span>
									</div>
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
									<div className={styles.infoRow}><span>Tên chủ thú cưng:</span><strong>{selectedAppointment.ownerName}</strong></div>
									<div className={styles.infoRow}><span>Cân nặng:</span><strong>{selectedAppointment.weightLabel}</strong></div>
									<div className={styles.infoRow}><span>Số điện thoại:</span><strong>{selectedAppointment.ownerPhone}</strong></div>
									<div className={`${styles.infoRow} ${styles.fullWidthRow}`}><span>Màu lông / Đặc điểm nhận dạng:</span><strong>{selectedAppointment.featureNote}</strong></div>
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
