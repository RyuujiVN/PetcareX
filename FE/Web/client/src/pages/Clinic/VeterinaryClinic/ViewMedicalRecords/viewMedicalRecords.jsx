import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
    FaCakeCandles,
    FaCalendarCheck,
    FaDog,
    FaMars,
    FaShieldDog,
    FaSyringe
} from 'react-icons/fa6'
import { MdHealthAndSafety } from 'react-icons/md'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
    getMedicalByIdApi,
    getMedicalByPetIdApi,
    getMedicalOrdersByMedicalIdApi,
    getMedicinesByMedicalIdApi,
} from '../../../../services/medicalService'
import { getPetByIdApi } from '../../../../services/petService'
import { getAdminInstance } from '../../../../services/apiClient'
import {
    getMedicalRecordStatusLabel,
    getMedicineUnitLabel,
    getPetBreedLabel,
    getServiceLabel,
} from '../../../../utils/enumLabel'
import styles from './viewMedicalRecords.module.css'

const EMPTY_TIMELINE = []
const EMPTY_REMINDERS = []
const FALLBACK_TEXT = 'Không'
const DEFAULT_PET_SUMMARY = {
	name: 'Không',
	avatar: '',
	breedName: FALLBACK_TEXT,
	birthday: FALLBACK_TEXT,
	gender: FALLBACK_TEXT,
}

const EMPTY_TIMELINE_HINT =
	'Chưa có hồ sơ để hiển thị. Hãy chọn thú cưng từ danh sách để xem đúng hồ sơ riêng.'

const mapPetSummaryFromPet = (pet) => {
	if (!pet) return null

	return {
		name: pet?.name || DEFAULT_PET_SUMMARY.name,
		avatar: pet?.avatar || DEFAULT_PET_SUMMARY.avatar,
		breedName: getPetBreedLabel(pet?.breed || pet?.breedName, pet?.species, FALLBACK_TEXT),
		birthday: formatDate(pet?.dateOfBirth),
		gender: formatGender(pet?.gender),
	}
}

const formatGender = (gender) => {
	if (typeof gender === 'boolean') return gender ? 'Đực' : 'Cái'
	if (!gender) return FALLBACK_TEXT
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
	if (!value) return FALLBACK_TEXT

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return FALLBACK_TEXT

	return date.toLocaleDateString('vi-VN')
}

const formatFollowUpDate = (value) => {
	const resolved = formatDate(value)
	return resolved === FALLBACK_TEXT ? 'Không' : resolved
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
	if (value === null || value === undefined || value === '') return FALLBACK_TEXT
	return suffix ? `${value} ${suffix}` : String(value)
}

const formatBloodPressure = (systolic, diastolic) => {
	if (!systolic && !diastolic) return FALLBACK_TEXT
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
					const medicineName = medicine?.medicine?.name || FALLBACK_TEXT
					const unitLabel = resolveMedicineUnitLabel(medicine)
					const quantity = medicine?.quantity
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
		{ label: 'Triệu chứng', value: record?.symptoms || FALLBACK_TEXT },
		{ label: 'Chẩn đoán', value: record?.diagnosis || FALLBACK_TEXT },
		{ label: 'Kết luận', value: record?.conclusion || FALLBACK_TEXT },
		{ label: 'Lời dặn bác sĩ', value: record?.note || FALLBACK_TEXT },
		{ label: 'Chỉ định xét nghiệm', value: orderSummary },
		{ label: 'Đơn thuốc', value: medicineSummary },
	]

	return {
		id: record?.id || `record-${Date.now()}`,
		markerType,
		title: getServiceLabel(record?.name, record?.name || 'Phiếu khám'),
		status,
		statusType,
		leftInfo: [
			{ label: 'Tên phòng khám', value: record?.clinic?.name || FALLBACK_TEXT },
			{ label: 'Ngày khám', value: resolveExamDate(record) },
		],
		rightInfo: [
			{
				label: 'Tên bác sĩ',
				value: record?.veterinarian?.fullName || FALLBACK_TEXT,
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
	const [expandedRecords, setExpandedRecords] = useState(() => new Set())
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
				const detail = await getMedicalByIdApi(getAdminInstance(), medicalId)
				records = detail ? [detail] : []
			} else if (resolvedPetId) {
				const byPet = await getMedicalByPetIdApi(getAdminInstance(), resolvedPetId)
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
						const detail = await getMedicalByIdApi(getAdminInstance(), record.id).catch(() => null)
						return detail ? { ...record, ...detail } : record
					}),
				)
			}

			const firstRecordPetId = records[0]?.pet?.id || records[0]?.petId
			const petDetail =
				resolvedPetId || firstRecordPetId
					? await getPetByIdApi(getAdminInstance(), resolvedPetId || firstRecordPetId).catch(() => null)
					: null

			if (records.length === 0 && selectedRecord) {
				const summaryFromState = mapPetSummaryFromPet(petDetail || selectedRecord)
				if (summaryFromState) {
					setPetSummary(summaryFromState)
				}
			}

			if (records.length === 0) {
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				setExpandedRecords(new Set())
				if (!selectedRecord) {
					setPetSummary(DEFAULT_PET_SUMMARY)
				}
				return
			}

			const enrichedRecords = await Promise.all(
				records.map(async (record) => {
					const [medicalOrders, medicines] = await Promise.all([
						getMedicalOrdersByMedicalIdApi(getAdminInstance(), record.id).catch(() => []),
						getMedicinesByMedicalIdApi(getAdminInstance(), record.id).catch(() => []),
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
			setExpandedRecords(new Set())

			setReminders(enrichedRecords.slice(0, 3).map(({ record }) => mapMedicalToReminder(record)))

			const firstRecord = enrichedRecords[0]?.record
			const fallbackPet = selectedRecord || {}
			const resolvedPet = petDetail || firstRecord?.pet || fallbackPet
			setPetSummary({
				name:
					resolvedPet?.name ||
					firstRecord?.pet?.name ||
					firstRecord?.petName ||
					fallbackPet?.name ||
					DEFAULT_PET_SUMMARY.name,
				avatar: resolvedPet?.avatar || firstRecord?.pet?.avatar || fallbackPet?.avatar || DEFAULT_PET_SUMMARY.avatar,
				breedName: getPetBreedLabel(
					resolvedPet?.breed || firstRecord?.pet?.breed || firstRecord?.pet?.breedName || fallbackPet?.breed,
					resolvedPet?.species || firstRecord?.pet?.species || fallbackPet?.species,
					FALLBACK_TEXT,
				),
				birthday: formatDate(resolvedPet?.dateOfBirth || firstRecord?.pet?.dateOfBirth || fallbackPet?.dateOfBirth),
				gender: formatGender(resolvedPet?.gender ?? firstRecord?.pet?.gender ?? fallbackPet?.gender),
			})
		} catch (error) {
			message.error(normalizeMedicalErrorMessage(error))
			setTimelineRecords(EMPTY_TIMELINE)
			setReminders(EMPTY_REMINDERS)
			setExpandedRecords(new Set())
			setPetSummary(DEFAULT_PET_SUMMARY)
		} finally {
			setLoading(false)
		}
	}, [medicalId, petId, selectedRecord])

	const toggleExpandedRecord = useCallback((recordId) => {
		setExpandedRecords((prev) => {
			const next = new Set(prev)
			if (next.has(recordId)) {
				next.delete(recordId)
			} else {
				next.add(recordId)
			}
			return next
		})
	}, [])

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
								timelineRecords.map((record) => {
									const isExpanded = expandedRecords.has(record.id)

									return (
										<div key={record.id} className={styles.timelineItem}>
											<div className={`${styles.timelineMarker} ${styles[record.markerType]}`}>
												{getMarkerIcon(record.markerType)}
											</div>

											<div className={styles.recordCard}>
												<div className={styles.recordHeader}>
													<div className={styles.headerMain}>
														<h3 style={{ fontSize: 22 }}>{record.title}</h3>
													</div>

													<div className={styles.headerActions}>
														<span className={`${styles.statusTag} ${styles[record.statusType]}`}>
															{record.status}
														</span>
														<button
															type="button"
															className={styles.expandButton}
															onClick={() => toggleExpandedRecord(record.id)}
															aria-expanded={isExpanded}
														>
															{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
															{isExpanded ? <UpOutlined /> : <DownOutlined />}
														</button>
													</div>
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

												{isExpanded ? (
													<>
														<div className={styles.divider} />

														<div className={styles.detailsBlock}>
															<div className={styles.detailVitalsGrid}>
																{record.vitalRows.map((line) => (
																	<p key={`${record.id}-${line.label}`}>
																		<span>{line.label}:</span> {line.value}
																	</p>
																))}
															</div>

															<div className={styles.detailColumn}>
																{record.detailRows.map((line) => (
																	<p key={`${record.id}-${line.label}`}>
																		<span>{line.label}:</span> {line.value}
																	</p>
																))}
															</div>
														</div>
													</>
												) : null}
											</div>
										</div>
									)
								})
							)}
						</div>
					</article>
				</section>
			</main>
		</div>
	)
}

export default ViewMedicalRecords
