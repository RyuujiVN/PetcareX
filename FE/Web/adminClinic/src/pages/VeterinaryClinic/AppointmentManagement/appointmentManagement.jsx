import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Avatar,
	Badge,
	Button,
	Card,
	Col,
	DatePicker,
	Descriptions,
	Empty,
	Input,
	Layout,
	Menu,
	Modal,
	Row,
	Select,
	Spin,
	Tag,
	Typography,
	message,
} from 'antd'
import {
	BookOutlined,
	CalendarOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	DollarCircleOutlined,
	FileSearchOutlined,
	LineChartOutlined,
	MedicineBoxOutlined,
	NotificationOutlined,
	SearchOutlined,
	TeamOutlined,
	UserOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './appointmentManagement.module.css'
import {
	APPOINTMENT_STATUS,
	APPOINTMENT_STATUS_LABEL,
	SERVICE_OPTIONS,
	getClinicAppointmentsApi,
	updateAppointmentStatusApi,
} from '../../../data/api/appointmentApi'

const menuItems = [
	{ key: 'appointments', label: 'Lịch hẹn', icon: CalendarOutlined, path: '/clinic/appointments' },
	{ key: 'records', label: 'Sổ y tế điện tử', icon: BookOutlined, path: '/clinic/medical-records' },
	{ key: 'revenue', label: 'Doanh thu', icon: LineChartOutlined, path: '/clinic/revenue' },
	{ key: 'doctors', label: 'Bác sĩ', icon: TeamOutlined, path: '/clinic/doctors' },
	{ key: 'forms', label: 'Xem phiếu khám', icon: FileSearchOutlined, path: '/clinic/exam-slips' },
]

const { Sider, Content } = Layout
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
	const navigate = useNavigate()
	const location = useLocation()
	const [loading, setLoading] = useState(false)
	const [updatingId, setUpdatingId] = useState('')
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedTime, setSelectedTime] = useState(undefined)
	const [searchValue, setSearchValue] = useState('')
	const [appointments, setAppointments] = useState([])
	const [selectedAppointment, setSelectedAppointment] = useState(null)
	const [isModalOpen, setIsModalOpen] = useState(false)

	const userInfo = useMemo(() => {
		try {
			return JSON.parse(localStorage.getItem('userInfo') || '{}')
		} catch {
			return {}
		}
	}, [])

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

	const isActiveMenu = (path) => location.pathname === path || (path === '/clinic/appointments' && location.pathname === '/home')

	const goToMenu = (path) => {
		navigate(path)
	}

	const mappedAppointments = useMemo(() => {
		return appointments
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
					statusLabel: APPOINTMENT_STATUS_LABEL[item.status] || item.status,
					badgeStatus: badgeByStatus[item.status] || 'default',
					date: formatDisplayDate(item.appointmentDate),
					time: getTimeValue(item.appointmentTime),
					service: item.service,
					serviceLabel: SERVICE_OPTIONS[item.service] || item.service,
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
	}, [appointments])

	const filteredAppointments = useMemo(() => {
		const keyword = searchValue.trim().toLowerCase()
		if (!keyword) return mappedAppointments

		return mappedAppointments.filter((item) => {
			const normalized = [item.petName, item.ownerName, item.serviceLabel, item.veterinarianName]
				.join(' ')
				.toLowerCase()

			return normalized.includes(keyword)
		})
	}, [mappedAppointments, searchValue])

	const groupedAppointments = useMemo(() => {
		const grouped = {
			[APPOINTMENT_STATUS.BOOKED]: [],
			[APPOINTMENT_STATUS.IN_PROGRESS]: [],
			[APPOINTMENT_STATUS.COMPLETED]: [],
		}

		filteredAppointments.forEach((item) => {
			if (grouped[item.status]) {
				grouped[item.status].push(item)
			}
		})

		return grouped
	}, [filteredAppointments])

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

	const selectedMenuKey =
		menuItems.find((item) => isActiveMenu(item.path))?.key || 'appointments'

	const totalAppointments = filteredAppointments.length
	const timeOptions = TIME_SLOTS.map((slot) => ({ value: slot, label: slot }))

	return (
		<Layout className={styles.page}>
			<Sider width={244} className={styles.sidebar} breakpoint="lg" collapsedWidth="0">
				<div>
					<div className={styles.brandBox}>
						<div className={styles.brandIcon}>
							<MedicineBoxOutlined />
						</div>
						<div>
							<h2>PetcareX</h2>
							<p>Quản lý phòng khám</p>
						</div>
					</div>

					<Menu
						mode="inline"
						selectedKeys={[selectedMenuKey]}
						className={styles.menu}
						onClick={({ key }) => {
							const item = menuItems.find((menuItem) => menuItem.key === key)
							if (item) {
								goToMenu(item.path)
							}
						}}
						items={menuItems.map((item) => ({
							key: item.key,
							icon: <item.icon />,
							label: item.label,
						}))}
					/>
				</div>

				<div className={styles.profileBox}>
					<div className={styles.profileInfo}>
						<Avatar size={42} src={userInfo?.avatarUrl || undefined} icon={<UserOutlined />} />
						<div>
							<h4>{userInfo?.fullName || 'Quản lý phòng khám'}</h4>
							<p>{userInfo?.role || 'ADMIN_CLINIC'}</p>
						</div>
					</div>
				</div>
			</Sider>

			<Content className={styles.content}>
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
							<Col xs={24} md={9}>
								<Text strong>Ngày khám</Text>
								<DatePicker
									className={styles.filterInput}
									format="DD/MM/YYYY"
									value={selectedDate}
									onChange={(value) => setSelectedDate(value)}
									allowClear
								/>
							</Col>

							<Col xs={24} md={9}>
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

							<Col xs={24} md={6}>
								<Text strong>&nbsp;</Text>
								<Button type="primary" block onClick={fetchAppointments}>
									Lọc lịch khám
								</Button>
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
					title="Thông tin thú cưng"
					open={isModalOpen}
					onCancel={() => setIsModalOpen(false)}
					footer={[
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
									<Text>
										{`${selectedAppointment.breedLabel} · ${selectedAppointment.ageLabel} · ${selectedAppointment.weightLabel}`}
									</Text>
									<div className={styles.petMetaLine}>
										<Tag icon={<CalendarOutlined />}>{selectedAppointment.dateOfBirthLabel}</Tag>
										<Tag icon={<UserOutlined />}>{selectedAppointment.genderLabel}</Tag>
									</div>
								</div>
							</div>

							<Descriptions
								title="Thông tin thú cưng"
								column={2}
								className={styles.detailSection}
								items={[
									{ key: 'petName', label: 'Tên thú cưng', children: selectedAppointment.petName },
									{ key: 'species', label: 'Loài', children: selectedAppointment.speciesLabel },
									{ key: 'breed', label: 'Giống', children: selectedAppointment.breedLabel },
									{ key: 'gender', label: 'Giới tính', children: selectedAppointment.genderLabel },
									{ key: 'age', label: 'Ngày sinh / Tuổi', children: `${selectedAppointment.dateOfBirthLabel} / ${selectedAppointment.ageLabel}` },
									{ key: 'weight', label: 'Cân nặng', children: selectedAppointment.weightLabel },
									{ key: 'feature', label: 'Màu lông / Đặc điểm nhận dạng', children: selectedAppointment.featureNote, span: 2 },
									{ key: 'owner', label: 'Tên chủ thú cưng', children: selectedAppointment.ownerName },
									{ key: 'phone', label: 'Số điện thoại', children: selectedAppointment.ownerPhone },
								]}
							/>

							<Descriptions
								title="Thông tin lịch khám"
								column={2}
								className={styles.detailSection}
								items={[
									{ key: 'clinic', label: 'Phòng khám', children: selectedAppointment.clinicName },
									{ key: 'address', label: 'Địa chỉ', children: selectedAppointment.clinicAddress },
									{ key: 'time', label: 'Ngày & giờ', children: `${selectedAppointment.date} - ${selectedAppointment.time}` },
									{ key: 'service', label: 'Dịch vụ', children: selectedAppointment.serviceLabel },
									{ key: 'vet', label: 'Bác sĩ', children: selectedAppointment.veterinarianName },
									{
										key: 'status',
										label: 'Trạng thái',
										children: (
											<Tag icon={selectedAppointment.status === APPOINTMENT_STATUS.COMPLETED ? <DollarCircleOutlined /> : <CheckCircleOutlined />}>
												{selectedAppointment.statusLabel}
											</Tag>
										),
									},
									{ key: 'note', label: 'Ghi chú', children: selectedAppointment.appointmentNote, span: 2 },
								]}
							/>
						</div>
					) : null}
				</Modal>
			</Content>
		</Layout>
	)
}
