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
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../../data/Clinic/api/medicalApi'
import styles from './viewMedicalRecords.module.css'

const EMPTY_TIMELINE = []
const EMPTY_REMINDERS = []
const DEFAULT_PET_SUMMARY = {
	name: 'Chưa chọn thú cưng',
	avatar: '',
	breedName: 'Chưa cập nhật giống',
	birthday: 'Chưa cập nhật',
	gender: 'Chưa cập nhật',
}

const EMPTY_TIMELINE_HINT =
	'Chưa có hồ sơ để hiển thị. Hãy chọn thú cưng từ danh sách để xem đúng hồ sơ riêng.'

const BREED_LABELS = {
	DOG: {
		PUG: 'Pug',
		POODLE: 'Poodle',
		MONGREL_DOG: 'Chó ta',
		CHIHUAHUA: 'Chihuahua',
		POMERANIAN: 'Phốc sóc',
		SAMOYED: 'Samoyed',
		CORGI: 'Corgi',
		SHIBA_INU: 'Shiba Inu',
		BULLDOG: 'Bulldog',
	},
	CAT: {
		PERSIAN: 'Ba Tư',
		MUNCHKIN: 'Munchkin',
		SPHYNX: 'Sphynx',
		BRITISH_SHORTHAIR: 'Mèo Anh lông ngắn',
		BENGAL: 'Bengal',
		MAINE_COON: 'Maine Coon',
		RAGDOLL: 'Ragdoll',
		SIAMESE: 'Xiêm',
		MONGREL_CAT: 'Mèo ta',
	},
}

const formatEnumLabel = (value) => {
	if (!value) return 'Chưa cập nhật giống'

	return String(value)
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

const getBreedLabel = (breedValue, speciesValue) => {
	if (!breedValue) return 'Chưa cập nhật giống'

	const normalizedBreed = String(breedValue).toUpperCase()
	const normalizedSpecies = String(speciesValue || '').toUpperCase()

	if (normalizedSpecies && BREED_LABELS[normalizedSpecies]?.[normalizedBreed]) {
		return BREED_LABELS[normalizedSpecies][normalizedBreed]
	}

	for (const speciesBreeds of Object.values(BREED_LABELS)) {
		if (speciesBreeds?.[normalizedBreed]) {
			return speciesBreeds[normalizedBreed]
		}
	}

	return formatEnumLabel(normalizedBreed)
}

const mapPetSummaryFromPet = (pet) => {
	if (!pet) return null

	return {
		name: pet?.name || DEFAULT_PET_SUMMARY.name,
		avatar: pet?.avatar || DEFAULT_PET_SUMMARY.avatar,
		breedName: getBreedLabel(pet?.breed || pet?.breedName, pet?.species),
		birthday: formatDate(pet?.dateOfBirth),
		gender: formatGender(pet?.gender),
	}
}

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

const normalizeMedicalErrorMessage = (error) => {
	const rawMessage = error?.message || 'Không thể tải hồ sơ khám bệnh'
	const normalized = rawMessage.trim().toLowerCase()

	if (normalized === 'internal server error') {
		return 'Không thể tải hồ sơ khám bệnh. Vui lòng thử lại hoặc kiểm tra dữ liệu thú cưng.'
	}

	return rawMessage
}

const parseConclusionSummary = (conclusionText) => {
	const raw = String(conclusionText || '').trim()
	if (!raw) return 'Chưa cập nhật'

	const summaryMatch = raw.match(/Ket\s*luan\s*:\s*([^\n]+)/i)
	return summaryMatch?.[1]?.trim() || raw
}

const mapMedicalToTimelineRecord = (record, medicalOrders = [], medicines = []) => {
	const conclusionSummary = parseConclusionSummary(record?.conclusion)
	const medicineSummary =
		medicines.length > 0
			? medicines.map((medicine, index) => {
					const medicineName = medicine.medicine?.name || 'Thuốc chưa xác định'
					const quantity = medicine.quantity ? ` (${medicine.quantity})` : ''

					return (
						<div key={index}>
							{medicineName}
							{quantity}
						</div>
					)
			  })
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
			{ label: 'Tên phòng khám', value: record?.clinic?.name || 'Chưa cập nhật' },
			{ label: 'Ngày tạo hồ sơ', value: formatDate(record?.createdAt) },
		],
		rightInfo: [
			{
				label: 'Tên bác sĩ',
				value: record?.veterinarian?.fullName || 'Chưa cập nhật',
			},
			{ label: 'Ngày tái khám', value: formatDate(record?.followUpDate) },
		],
		detailRows: [
			{ label: 'Triệu chứng', value: record?.symptoms || 'Chưa cập nhật' },
			{ label: 'Chẩn đoán', value: record?.diagnosis || 'Chưa cập nhật' },
			{ label: 'Kết luận', value: conclusionSummary },
			{ label: 'Thuốc', value: medicineSummary },
			{ label: 'Ghi chú', value: record?.note || 'Chưa cập nhật' },
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

function ViewMedicalRecords() {
	const navigate = useNavigate()
	const location = useLocation()
	const isVeterinarianPortal = location.pathname.startsWith('/veterinarian')
	const routePrefix = isVeterinarianPortal ? '/veterinarian' : '/clinic'
	const [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [timelineRecords, setTimelineRecords] = useState(EMPTY_TIMELINE)
	const [reminders, setReminders] = useState(EMPTY_REMINDERS)
	const [petSummary, setPetSummary] = useState(DEFAULT_PET_SUMMARY)
	const selectedRecord = location?.state?.record
	const medicalId = searchParams.get('medicalId')
	const petId = searchParams.get('petId')
	const handleChangePet = () => {
		navigate(`${routePrefix}/medical-records`)
	}

	const loadMedicalData = useCallback(async () => {
		try {
			setLoading(true)

			const resolvedPetId = petId || selectedRecord?.petId

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

			if (records.length === 0 && selectedRecord) {
				const summaryFromState = mapPetSummaryFromPet(selectedRecord)
				if (summaryFromState) {
					setPetSummary(summaryFromState)
				}
			}

			if (records.length === 0) {
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				if (!selectedRecord) {
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
			const fallbackPet = selectedRecord || {}
			setPetSummary({
				name:
					firstRecord?.pet?.name ||
					firstRecord?.petName ||
					fallbackPet?.name ||
					DEFAULT_PET_SUMMARY.name,
				avatar: firstRecord?.pet?.avatar || fallbackPet?.avatar || DEFAULT_PET_SUMMARY.avatar,
				breedName: getBreedLabel(
					firstRecord?.pet?.breed || firstRecord?.pet?.breedName || fallbackPet?.breed,
					firstRecord?.pet?.species || fallbackPet?.species,
				),
				birthday: formatDate(firstRecord?.pet?.dateOfBirth || fallbackPet?.dateOfBirth),
				gender: formatGender(firstRecord?.pet?.gender ?? fallbackPet?.gender),
			})
		} catch (error) {
			message.error(normalizeMedicalErrorMessage(error))
			setTimelineRecords(EMPTY_TIMELINE)
			setReminders(EMPTY_REMINDERS)
			setPetSummary(DEFAULT_PET_SUMMARY)
		} finally {
			setLoading(false)
		}
	}, [medicalId, petId, selectedRecord])

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
            <header className={styles.topHeader}>
                <h1>Hồ sơ chi tiết</h1>
            </header>
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
							<h1 style={{ fontSize: 25 }}>{petSummary.name}</h1>
						</div>
						<p className={styles.petMeta}>{`${petSummary.breedName}`}</p>
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
												<h3 style={{ fontSize: 22 }}>{record.title}</h3>
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
										</div>
									</div>
								))
							)}
						</div>
					</article>
				</section>
			</main>
		</div>
	)
}

export default ViewMedicalRecords
