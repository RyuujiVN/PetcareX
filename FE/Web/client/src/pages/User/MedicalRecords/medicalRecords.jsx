import {
	FaBell,
	FaCalendarCheck,
	FaCakeCandles,
	FaDog,
	FaMars,
	FaShieldDog,
	FaSyringe,
} from 'react-icons/fa6'
import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { MdHealthAndSafety } from 'react-icons/md'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../../../components/layout/footer'
import Header from '../../../components/layout/header'
import {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../data/api/medicalApi'
import styles from './medicalRecords.module.css'

const EMPTY_TIMELINE = []
const EMPTY_REMINDERS = []
const DEFAULT_PET_SUMMARY = {
	name: 'Chưa chọn thú cưng',
	avatar: '',
	breedName: 'Chưa cập nhật giống',
	birthday: 'Chưa cập nhật',
	gender: 'Chưa cập nhật',
	weight: 'Chưa cập nhật',
}

const EMPTY_TIMELINE_HINT =
	'Chưa có hồ sơ để hiển thị. Hãy chọn thú cưng từ danh sách để xem đúng hồ sơ riêng.'

const formatGender = (gender) => {
	if (!gender) return 'Chưa cập nhật'
	if (gender === 'male') return 'Đực'
	if (gender === 'female') return 'Cái'
	return String(gender)
}

const isInternalServerError = (error) => {
	const messageText = error?.message?.toLowerCase?.() || ''
	return messageText.includes('internal server error')
}

const getMarkerIcon = (markerType) => {
	if (markerType === 'vaccine') return <FaSyringe />
	if (markerType === 'checkup') return <MdHealthAndSafety />
	return <FaDog />
}

const getReminderIcon = (type) => {
	if (type === 'vaccine') return <FaShieldDog />
	if (type === 'deworm') return <MdHealthAndSafety />
	return <FaCalendarCheck />
}

const formatDate = (value) => {
	if (!value) return 'Chưa cập nhật'

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'

	return date.toLocaleDateString('vi-VN')
}

const mapMedicalToTimelineRecord = (record, medicalOrders = [], medicines = []) => {
	const orderSummary =
		medicalOrders.length > 0
			? medicalOrders
					.map((order) => order.medicalOrder?.name)
					.filter(Boolean)
					.join(', ')
			: 'Chưa có chỉ định'

	const medicineSummary =
		medicines.length > 0
			? medicines
					.map((medicine) => {
						const medicineName = medicine.medicine?.name || 'Thuốc chưa xác định'
						const quantity = medicine.quantity ? ` (${medicine.quantity})` : ''
						return `${medicineName}${quantity}`
					})
					.join(', ')
			: 'Chưa kê thuốc'

	const hasConclusion = Boolean(record?.conclusion)
	const status = hasConclusion ? 'ĐÃ HOÀN THÀNH' : 'CHƯA HOÀN THÀNH'
	const statusType = hasConclusion ? 'done' : 'pending'

	let markerType = 'checkup'
	if (medicalOrders.length > 0) markerType = 'vaccine'
	if (medicines.length > 0) markerType = 'skin'

	return {
		id: record?.id || `record-${Date.now()}`,
		markerType,
		title: record?.name || 'Phiếu khám chưa đặt tên',
		status,
		statusType,
		leftInfo: [
			{ label: 'Mã hồ sơ', value: record?.id || 'Chưa cập nhật' },
			{ label: 'Mã phòng khám', value: record?.clinic?.id || 'Chưa cập nhật' },
			{ label: 'Ngày tạo hồ sơ', value: formatDate(record?.createdAt) },
		],
		rightInfo: [
			{ label: 'Tên thú cưng', value: record?.pet?.name || record?.petName || 'Chưa cập nhật' },
			{
				label: 'Tên bác sĩ',
				value: record?.veterinarian?.fullName || 'Chưa cập nhật',
			},
			{ label: 'Mã đơn thuốc', value: medicines[0]?.id || 'Chưa có đơn thuốc' },
		],
		detailRows: [
			{ label: 'Chẩn đoán', value: record?.diagnosis || 'Chưa cập nhật' },
			{ label: 'Triệu chứng', value: record?.symptoms || 'Chưa cập nhật' },
			{ label: 'Kết luận', value: record?.conclusion || 'Chưa cập nhật' },
			{ label: 'Ghi chú', value: record?.note || 'Chưa cập nhật' },
			{ label: 'Phiếu chỉ định', value: orderSummary },
			{ label: 'Thuốc', value: medicineSummary },
			{ label: 'Ngày tái khám', value: formatDate(record?.followUpDate) },
		],
	}
}

const mapMedicalToReminder = (record) => {
	if (record?.followUpDate) {
		return {
			id: `reminder-follow-up-${record.id}`,
			type: 'follow-up',
			title: `Tái khám - ${record?.pet?.name || record?.petName || 'Thú cưng'}`,
			subtitle: formatDate(record.followUpDate),
		}
	}

	return {
		id: `reminder-medical-${record?.id || Date.now()}`,
		type: 'vaccine',
		title: record?.name || 'Nhắc lịch khám',
		subtitle: `Ngày tạo: ${formatDate(record?.createdAt)}`,
	}
}

function MedicalRecords() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [timelineRecords, setTimelineRecords] = useState(EMPTY_TIMELINE)
	const [reminders, setReminders] = useState(EMPTY_REMINDERS)
	const [petSummary, setPetSummary] = useState(DEFAULT_PET_SUMMARY)

	const loadMedicalData = useCallback(async () => {
		try {
			setLoading(true)

			const medicalId = searchParams.get('medicalId')
			const petId = searchParams.get('petId')

			let records = []
			if (medicalId) {
				const detail = await getMedicalById(medicalId)
				records = detail ? [detail] : []
			} else if (petId) {
				const byPet = await getMedicalByPetId(petId)
				records = Array.isArray(byPet?.items) ? byPet.items : []
			} else {
				records = []
			}

			if (records.length === 0) {
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				setPetSummary(DEFAULT_PET_SUMMARY)
				return
			}

			const enrichedRecords = await Promise.all(
				records.map(async (record) => {
					const [medicalOrders, medicines] = await Promise.all([
						getMedicalOrdersByMedicalId(record.id).catch(() => []),
						getMedicinesByMedicalId(record.id).catch(() => []),
					])

					return {
						record,
						medicalOrders: Array.isArray(medicalOrders) ? medicalOrders : [],
						medicines: Array.isArray(medicines) ? medicines : [],
					}
				}),
			)

			setTimelineRecords(
				enrichedRecords.map(({ record, medicalOrders, medicines }) =>
					mapMedicalToTimelineRecord(record, medicalOrders, medicines),
				),
			)

			setReminders(enrichedRecords.slice(0, 3).map(({ record }) => mapMedicalToReminder(record)))

			const firstRecord = enrichedRecords[0]?.record
			setPetSummary({
				name: firstRecord?.pet?.name || firstRecord?.petName || DEFAULT_PET_SUMMARY.name,
				avatar: firstRecord?.pet?.avatar || DEFAULT_PET_SUMMARY.avatar,
				breedName: firstRecord?.pet?.breedName || DEFAULT_PET_SUMMARY.breedName,
				birthday: formatDate(firstRecord?.pet?.birthday),
				gender: formatGender(firstRecord?.pet?.gender),
				weight: firstRecord?.weight ? `${firstRecord.weight} kg` : DEFAULT_PET_SUMMARY.weight,
			})
		} catch (error) {
			const medicalId = searchParams.get('medicalId')
			const petId = searchParams.get('petId')
			const hasExplicitFilter = Boolean(medicalId || petId)

			if (hasExplicitFilter || !isInternalServerError(error)) {
				message.error(error.message || 'Không thể tải hồ sơ khám bệnh')
			}

			setTimelineRecords(EMPTY_TIMELINE)
			setReminders(EMPTY_REMINDERS)
			setPetSummary(DEFAULT_PET_SUMMARY)
		} finally {
			setLoading(false)
		}
	}, [searchParams])

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
	}, [])

	useEffect(() => {
		loadMedicalData()
	}, [loadMedicalData])

	const handleOpenAppointments = () => {
		navigate('/appointments')
	}

	const handleBookNow = (service) => {
		navigate('/booking', { state: { service } })
	}

	return (
		<div className={styles.pageRoot}>
			<Header />

			<main className={styles.pageContent}>
				<section className={styles.petCard}>
					{petSummary.avatar ? (
						<img src={petSummary.avatar} alt={petSummary.name} className={styles.petAvatar} />
					) : (
						<div className={styles.petAvatarFallback} aria-hidden="true">
							<FaDog />
						</div>
					)}

					<div className={styles.petInfo}>
						<h1>{petSummary.name}</h1>
						<p className={styles.petMeta}>{`${petSummary.breedName} • ${petSummary.weight}`}</p>
						<div className={styles.petSubMeta}>
							<span>
								<FaCakeCandles /> {petSummary.birthday}
							</span>
							<span>
								<FaMars /> {petSummary.gender}
							</span>
						</div>
					</div>
				</section>

				<section className={styles.mainGrid}>
					<article className={styles.timelinePanel}>
						<h2 className={styles.panelTitle}>
							<MdHealthAndSafety /> Dòng thời gian sức khỏe {loading ? '(đang tải...)' : ''}
						</h2>

						<div className={styles.timelineWrapper}>
							{timelineRecords.length === 0 ? (
								<p className={styles.emptyStateText}>{EMPTY_TIMELINE_HINT}</p>
							) : (
								timelineRecords.map((record) => (
								<div key={record.id} className={styles.timelineItem}>
									<div className={`${styles.timelineMarker} ${styles[record.markerType]}`}>
										{getMarkerIcon(record.markerType)}
									</div>

									<button
										type="button"
										className={styles.recordCard}
										disabled={loading}
										onClick={handleOpenAppointments}
									>
										<div className={styles.recordHeader}>
											<h3>{record.title}</h3>
											<span className={`${styles.statusTag} ${styles[record.statusType]}`}>
												{record.status}
											</span>
										</div>

										<div className={styles.recordMetaGrid}>
											<div>
												{record.leftInfo.map((line) => (
													<p key={`${record.id}-${line.label}-left`}>
														<strong>{line.label}:</strong> {line.value}
													</p>
												))}
											</div>

											<div>
												{record.rightInfo.map((line) => (
													<p key={`${record.id}-${line.label}-right`}>
														<strong>{line.label}:</strong> {line.value}
													</p>
												))}
											</div>
										</div>

										<div className={styles.recordDivider} />

										<div className={styles.recordDetails}>
											{record.detailRows.map((line) => (
												<p key={`${record.id}-${line.label}`}>
													<span>{line.label}:</span> {line.value}
												</p>
											))}
										</div>
									</button>
								</div>
							))
							)}
						</div>
					</article>

					<aside className={styles.reminderPanel}>
						<h2 className={styles.panelTitle}>
							<FaBell /> Nhắc nhở quan trọng
						</h2>

						<div className={styles.reminderList}>
							{reminders.length === 0 ? (
								<p className={styles.emptyStateText}>Chưa có nhắc nhở quan trọng.</p>
							) : (
								reminders.map((reminder) => (
								<button
									key={reminder.id}
									type="button"
									className={`${styles.reminderCard} ${styles[reminder.type]}`}
									disabled={loading}
									onClick={() => handleBookNow(reminder.title)}
								>
									<span className={styles.reminderIcon}>{getReminderIcon(reminder.type)}</span>
									<span>
										<strong>{reminder.title}</strong>
										<small>{reminder.subtitle}</small>
									</span>
								</button>
							))
							)}
						</div>

						<button
							type="button"
							className={styles.bookNowButton}
							disabled={loading}
							onClick={() => handleBookNow('Đặt lịch khám')}
						>
							Đặt lịch ngay
						</button>
					</aside>
				</section>
			</main>
		</div>
	)
}

export default MedicalRecords
