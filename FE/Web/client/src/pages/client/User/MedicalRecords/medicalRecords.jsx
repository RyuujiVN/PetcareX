import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
	FaBell,
	FaCakeCandles,
	FaCalendarCheck,
	FaDog,
	FaMars,
	FaShieldDog,
	FaSyringe,
} from 'react-icons/fa6'
import { MdHealthAndSafety } from 'react-icons/md'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../../data/client/api/medicalApi'
import { getBreedLabel, getMyPetsApi } from '../../../../data/client/api/petApi'
import { getMedicalRecordStatusLabel, getMedicineUnitLabel, getServiceLabel } from '../../../../utils/enumLabel'
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
	if (typeof gender === 'boolean') return gender ? 'Đực' : 'Cái'
	if (!gender) return 'Chưa cập nhật'
	const normalizedGender = String(gender).trim().toLowerCase()
	if (normalizedGender === 'male') return 'Đực'
	if (normalizedGender === 'female') return 'Cái'
	return String(gender)
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

const formatFollowUpDate = (value) => {
	const resolved = formatDate(value)
	return resolved === 'Chưa cập nhật' ? 'Không' : resolved
}

const resolveRecordTitle = (name, fallback = 'Phiếu khám chưa đặt tên') => {
	if (!name) return fallback
	return getServiceLabel(name, name) || fallback
}

const resolveExamDate = (record) =>
	formatDate(
		record?.appointment?.appointmentDate ||
			record?.appointmentDate ||
			record?.examDate ||
			record?.visitDate ||
			record?.createdAt,
	)

const formatVitalValue = (value, suffix = '') => {
	if (value === null || value === undefined || value === '') return 'Chưa cập nhật'
	return suffix ? `${value} ${suffix}` : String(value)
}

const formatBloodPressure = (systolic, diastolic) => {
	if (!systolic && !diastolic) return 'Chưa cập nhật'
	if (systolic && diastolic) return `${systolic}/${diastolic} mmHg`
	return `${systolic || diastolic} mmHg`
}

const resolveMedicineUnitLabel = (item) => {
	const unitValue =
		item?.medicine?.unit ||
		item?.medicine?.medicineUnit ||
		item?.medicine?.unitType ||
		item?.unit ||
		item?.unitType ||
		''
	if (!unitValue) return ''
	return getMedicineUnitLabel(unitValue, unitValue)
}

const normalizeMedicalErrorMessage = (error) => {
	const rawMessage = error?.message || 'Không thể tải hồ sơ khám bệnh'
	const normalized = rawMessage.trim().toLowerCase()

	if (normalized === 'internal server error') {
		return 'Không thể tải hồ sơ khám bệnh. Vui lòng thử lại hoặc kiểm tra dữ liệu thú cưng.'
	}

	return rawMessage
}

const mapMedicalToTimelineRecord = (record, medicalOrders = [], medicines = []) => {
	const orderSummary =
		medicalOrders.length > 0
			? medicalOrders
					.map(
						(order) =>
							order?.medicalOrder?.nameVn ||
							order?.medicalOrder?.nameEng ||
							order?.medicalOrder?.name ||
							'Chỉ định chưa xác định',
					)
					.join(', ')
			: 'Không có'

	const medicineSummary =
		medicines.length > 0
			? medicines.map((medicine) => {
					const medicineName = medicine.medicine?.name || 'Thuốc chưa xác định'
					const unitLabel = resolveMedicineUnitLabel(medicine)
					const quantity = medicine.quantity
						? ` (${medicine.quantity}${unitLabel ? ` ${unitLabel}` : ''})`
						: ''

					return `${medicineName}${quantity}`
				})
				.join(', ')
			: 'Không có'

	const hasConclusion = Boolean(record?.conclusion)
	const status = getMedicalRecordStatusLabel(hasConclusion, { uppercase: true })
	const statusType = hasConclusion ? 'done' : 'pending'

	let markerType = 'checkup'
	if (medicalOrders.length > 0) markerType = 'vaccine'
	if (medicines.length > 0) markerType = 'skin'

	const vitalRows = [
		{ label: 'Cân nặng', value: formatVitalValue(record?.weight, 'kg') },
		{ label: 'Nhiệt độ', value: formatVitalValue(record?.temperature, '°C') },
		{ label: 'Nhịp tim', value: formatVitalValue(record?.heartRate, 'l/p/m') },
		{ label: 'Huyết áp', value: formatBloodPressure(record?.systolic, record?.diastolic) },
	]

	const detailRows = [
		{ label: 'Triệu chứng', value: record?.symptoms || 'Chưa cập nhật' },
		{ label: 'Chẩn đoán', value: record?.diagnosis || 'Chưa cập nhật' },
		{ label: 'Kết luận', value: record?.conclusion || 'Chưa cập nhật' },
		{ label: 'Lời dặn bác sĩ', value: record?.note || 'Chưa cập nhật' },
		{ label: 'Chỉ định xét nghiệm', value: orderSummary },
		{ label: 'Đơn thuốc', value: medicineSummary },
	]

	return {
		id: record?.id || `record-${Date.now()}`,
		markerType,
		title: resolveRecordTitle(record?.name),
		status,
		statusType,
		leftInfo: [
			{ label: 'Tên phòng khám', value: record?.clinic?.name || 'Chưa cập nhật' },
			{ label: 'Ngày khám', value: resolveExamDate(record) },
		],
		rightInfo: [
			{
				label: 'Tên bác sĩ',
				value: record?.veterinarian?.fullName || 'Chưa cập nhật',
			},
			{ label: 'Ngày tái khám', value: formatFollowUpDate(record?.followUpDate) },

		],
		vitalRows,
		detailRows,
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
		title: resolveRecordTitle(record?.name, 'Nhắc lịch khám'),
		subtitle: `Ngày khám: ${resolveExamDate(record)}`,
	}
}

function MedicalRecords() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [timelineRecords, setTimelineRecords] = useState(EMPTY_TIMELINE)
	const [reminders, setReminders] = useState(EMPTY_REMINDERS)
	const [petSummary, setPetSummary] = useState(DEFAULT_PET_SUMMARY)
	const medicalId = searchParams.get('medicalId')
	const petId = searchParams.get('petId')
	const handleChangePet = () => {
			navigate('/listPetMedicalRecords')
		}
	const loadMedicalData = useCallback(async () => {
		try {
			setLoading(true)

			const myPets = await getMyPetsApi().catch(() => [])
			const petList = Array.isArray(myPets) ? myPets : []

			const selectedPet = petId
				? petList.find((item) => String(item?.id) === String(petId))
				: petList[0]

			if (petId && !selectedPet) {
				message.warning('Không tìm thấy thú cưng được chọn. Vui lòng thử lại từ danh sách thú cưng.')
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				setPetSummary(DEFAULT_PET_SUMMARY)
				return
			}

			const resolvedPetId = petId || selectedPet?.id

			let records = []
			if (medicalId) {
				const detail = await getMedicalById(medicalId)
				records = detail ? [detail] : []
			} else if (resolvedPetId) {
				const byPet = await getMedicalByPetId(resolvedPetId)
				records = Array.isArray(byPet?.items)
					? byPet.items
					: Array.isArray(byPet?.data)
						? byPet.data
						: Array.isArray(byPet)
							? byPet
							: []
			}

			if (!medicalId && records.length > 0) {
				records = await Promise.all(
					records.map(async (record) => {
						if (!record?.id) return record
						const detail = await getMedicalById(record.id).catch(() => null)
						return detail ? { ...record, ...detail } : record
					}),
				)
			}

			if (records.length === 0 && selectedPet) {
				setPetSummary({
					name: selectedPet?.name || DEFAULT_PET_SUMMARY.name,
					avatar: selectedPet?.avatar || DEFAULT_PET_SUMMARY.avatar,
					breedName: getBreedLabel(selectedPet?.breed, selectedPet?.species),
					birthday: formatDate(selectedPet?.dateOfBirth),
					gender: formatGender(selectedPet?.gender),
					weight: selectedPet?.weight ? `${selectedPet.weight} kg` : DEFAULT_PET_SUMMARY.weight,
				})
			}

			if (records.length === 0) {
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				if (!selectedPet) {
					setPetSummary(DEFAULT_PET_SUMMARY)
				}
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
				name:
					firstRecord?.pet?.name ||
					firstRecord?.petName ||
					selectedPet?.name ||
					DEFAULT_PET_SUMMARY.name,
				avatar: firstRecord?.pet?.avatar || selectedPet?.avatar || DEFAULT_PET_SUMMARY.avatar,
				breedName: getBreedLabel(
					firstRecord?.pet?.breed || firstRecord?.pet?.breedName || selectedPet?.breed,
					firstRecord?.pet?.species || selectedPet?.species,
				),
				birthday: formatDate(firstRecord?.pet?.dateOfBirth || selectedPet?.dateOfBirth),
				gender: formatGender(firstRecord?.pet?.gender ?? selectedPet?.gender),
				weight:
					firstRecord?.pet?.weight || firstRecord?.weight || selectedPet?.weight
						? `${firstRecord?.pet?.weight || firstRecord?.weight || selectedPet?.weight} kg`
						: DEFAULT_PET_SUMMARY.weight,
			})
		} catch (error) {
			message.error(normalizeMedicalErrorMessage(error))
			setTimelineRecords(EMPTY_TIMELINE)
			setReminders(EMPTY_REMINDERS)
			setPetSummary(DEFAULT_PET_SUMMARY)
		} finally {
			setLoading(false)
		}
	}, [medicalId, petId])

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
	}, [])

	useEffect(() => {
		loadMedicalData()
	}, [loadMedicalData])


	const handleBookNow = (service) => {
		navigate('/booking', { state: { service } })
	}

	return (
		<div className={styles.pageRoot}>
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
						<div className={styles.petNameRow}>
							<h1 style={{fontSize: 25}}>{petSummary.name}</h1>
						</div>
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

									<div className={styles.recordCard}>
									<div className={styles.recordHeader}>
										<h3 style={{fontSize: 22}}>{record.title}</h3>
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
										<div className={styles.recordVitalsGrid}>
											{record.vitalRows.map((line) => (
												<p key={`${record.id}-${line.label}`}>
													<span>{line.label}:</span> {line.value}
												</p>
											))}
										</div>
										<div className={styles.recordDetailColumn}>
											{record.detailRows.map((line) => (
												<p key={`${record.id}-${line.label}`}>
													<span>{line.label}:</span> {line.value}
												</p>
											))}
										</div>
									</div>
								</div>
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
								<div
									key={reminder.id}
									className={`${styles.reminderCard} ${styles[reminder.type]}`}
								>
									<span className={styles.reminderIcon}>{getReminderIcon(reminder.type)}</span>
									<span>
										<strong>{reminder.title}</strong>
										<small>{reminder.subtitle}</small>
									</span>
								</div>
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
