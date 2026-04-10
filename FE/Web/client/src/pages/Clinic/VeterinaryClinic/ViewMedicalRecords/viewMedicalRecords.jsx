import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { getAdminInstance } from '../../../../services/apiClient'
import {
    getMedicalByIdApi,
    getMedicalByPetIClinicdApi,
    getMedicalByPetIdApi,
    getMedicalOrdersByMedicalIdApi,
    getMedicinesByMedicalIdApi,
} from '../../../../services/medicalService'
import { getPetByIdApi } from '../../../../services/petService'
import { formatDateDDMMYYYY } from '../../../../utils/dateTimeFormat'
import {
    getMedicalRecordStatusLabel,
    getMedicineUnitLabel,
    getPetBreedLabel,
    getServiceLabel,
} from '../../../../utils/enumLabel'
import styles from './viewMedicalRecords.module.css'

const EMPTY_TIMELINE = []
const EMPTY_REMINDERS = []
const DEFAULT_PET_SUMMARY = {
	name: '',
	avatar: '',
	breedName: '',
	birthday: '',
	gender: '',
}

const mapPetSummaryFromPet = (pet, t, locale, fallbackText) => {
	if (!pet) return null

	return {
		name: pet?.name || fallbackText,
		avatar: pet?.avatar || DEFAULT_PET_SUMMARY.avatar,
		breedName: getPetBreedLabel(pet?.breed || pet?.breedName, pet?.species, fallbackText),
		birthday: formatDate(pet?.dateOfBirth, locale, fallbackText),
		gender: formatGender(pet?.gender, t, fallbackText),
	}
}

const formatGender = (gender, t, fallbackText) => {
	if (typeof gender === 'boolean') return gender ? t('medicalRecords.common.male') : t('medicalRecords.common.female')
	if (!gender) return fallbackText
	const normalizedGender = String(gender).trim().toLowerCase()
	if (normalizedGender === 'male') return t('medicalRecords.common.male')
	if (normalizedGender === 'female') return t('medicalRecords.common.female')
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

const formatDate = (value, _locale, fallbackText) => {
	return formatDateDDMMYYYY(value, fallbackText)
}

const formatFollowUpDate = (value, locale, fallbackText, t) => {
	const resolved = formatDate(value, locale, fallbackText)
	return resolved === fallbackText ? t('medicalRecords.common.none') : resolved
}

const resolveExamDate = (record, locale, fallbackText) =>
	formatDate(
		record?.appointment?.appointmentDate ||
			record?.appointmentDate ||
			record?.examDate ||
			record?.visitDate ||
			record?.createdAt,
		locale,
		fallbackText,
	)

const formatVitalValue = (value, suffix = '') => {
	if (value === null || value === undefined || value === '') return ''
	return suffix ? `${value} ${suffix}` : String(value)
}

const formatBloodPressure = (systolic, diastolic, fallbackText) => {
	if (!systolic && !diastolic) return fallbackText
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

const normalizeMedicalErrorMessage = (error, t) => {
	const rawMessage = error?.message || t('medicalRecords.messages.loadFailed')
	const normalized = rawMessage.trim().toLowerCase()

	if (normalized === 'internal server error') {
		return t('medicalRecords.messages.loadFailedHint')
	}

	return rawMessage
}

const mapMedicalToTimelineRecord = (record, medicalOrders = [], medicines = [], t, locale, fallbackText) => {
	const orderSummary =
		medicalOrders.length > 0
			? medicalOrders
					.map(
						(order) =>
							order?.medicalOrder?.nameVn ||
							order?.medicalOrder?.nameEng ||
							order?.medicalOrder?.name ||
							t('medicalRecords.common.unknownOrder'),
					)
					.join(', ')
				: t('medicalRecords.common.none')

	const medicineSummary =
		medicines.length > 0
			? medicines.map((medicine) => {
					const medicineName = medicine?.medicine?.name || fallbackText
					const unitLabel = resolveMedicineUnitLabel(medicine)
					const quantity = medicine?.quantity
						? ` (${medicine.quantity}${unitLabel ? ` ${unitLabel}` : ''})`
						: ''

					return `${medicineName}${quantity}`
			  })
				.join(', ')
			: t('medicalRecords.common.none')

	const hasConclusion = Boolean(record?.conclusion)
	const status = getMedicalRecordStatusLabel(hasConclusion, { uppercase: true })
	const statusType = hasConclusion ? 'done' : 'pending'

	let markerType = 'checkup'
	if (medicalOrders.length > 0) markerType = 'vaccine'
	if (medicines.length > 0) markerType = 'skin'

	const vitalRows = [
		{ label: t('medicalRecords.timeline.vitals.weight'), value: formatVitalValue(record?.weight, 'kg') || fallbackText },
		{ label: t('medicalRecords.timeline.vitals.temperature'), value: formatVitalValue(record?.temperature, '°C') || fallbackText },
		{ label: t('medicalRecords.timeline.vitals.heartRate'), value: formatVitalValue(record?.heartRate, 'l/p/m') || fallbackText },
		{ label: t('medicalRecords.timeline.vitals.bloodPressure'), value: formatBloodPressure(record?.systolic, record?.diastolic, fallbackText) },
	]

	const detailRows = [
		{ label: t('medicalRecords.timeline.detail.symptoms'), value: record?.symptoms || fallbackText },
		{ label: t('medicalRecords.timeline.detail.diagnosis'), value: record?.diagnosis || fallbackText },
		{ label: t('medicalRecords.timeline.detail.conclusion'), value: record?.conclusion || fallbackText },
		{ label: t('medicalRecords.timeline.detail.note'), value: record?.note || fallbackText },
		{ label: t('medicalRecords.timeline.detail.orders'), value: orderSummary },
		{ label: t('medicalRecords.timeline.detail.medicines'), value: medicineSummary },
	]

	return {
		id: record?.id || `record-${Date.now()}`,
		markerType,
		title: getServiceLabel(record?.name, record?.name || t('medicalRecords.timeline.examSlip')),
		status,
		statusType,
		leftInfo: [
			{ label: t('medicalRecords.timeline.left.clinicName'), value: record?.clinic?.name || fallbackText },
			{ label: t('medicalRecords.timeline.left.examDate'), value: resolveExamDate(record, locale, fallbackText) },
		],
		rightInfo: [
			{
				label: t('medicalRecords.timeline.right.veterinarianName'),
				value: record?.veterinarian?.fullName || fallbackText,
			},
			{ label: t('medicalRecords.timeline.right.followUpDate'), value: formatFollowUpDate(record?.followUpDate, locale, fallbackText, t) },
		],
		vitalRows,
		detailRows,
	}
}

const mapMedicalToReminder = (record, t, locale, fallbackText) => {
	if (record?.followUpDate) {
		return {
			id: `reminder-follow-up-${record.id}`,
			type: 'follow-up',
			title: t('medicalRecords.reminder.followUpTitle', { petName: record?.pet?.name || record?.petName || t('medicalRecords.common.pet') }),
			subtitle: formatDate(record.followUpDate, locale, fallbackText),
		}
	}

	return {
		id: `reminder-medical-${record?.id || Date.now()}`,
		type: 'vaccine',
		title: record?.name || t('medicalRecords.reminder.defaultTitle'),
		subtitle: t('medicalRecords.reminder.createdDate', { date: formatDate(record?.createdAt, locale, fallbackText) }),
	}
}

function ViewMedicalRecords() {
	const { t, i18n } = useTranslation('clinic')
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
	const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN'
	const fallbackText = t('medicalRecords.common.fallback')
	const emptyTimelineHint = t('medicalRecords.timeline.emptyHint')
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
				const byPet = await getMedicalByPetIClinicdApi(getAdminInstance(), resolvedPetId)
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
				const summaryFromState = mapPetSummaryFromPet(petDetail || selectedRecord, t, locale, fallbackText)
				if (summaryFromState) {
					setPetSummary(summaryFromState)
				}
			}

			if (records.length === 0) {
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				setExpandedRecords(new Set())
				if (!selectedRecord) {
					setPetSummary({ ...DEFAULT_PET_SUMMARY, name: fallbackText, breedName: fallbackText, birthday: fallbackText, gender: fallbackText })
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
					mapMedicalToTimelineRecord(record, medicalOrders, medicines, t, locale, fallbackText),
				),
			)
			setExpandedRecords(new Set())

			setReminders(enrichedRecords.slice(0, 3).map(({ record }) => mapMedicalToReminder(record, t, locale, fallbackText)))

			const firstRecord = enrichedRecords[0]?.record
			const fallbackPet = selectedRecord || {}
			const resolvedPet = petDetail || firstRecord?.pet || fallbackPet
			setPetSummary({
				name:
					resolvedPet?.name ||
					firstRecord?.pet?.name ||
					firstRecord?.petName ||
					fallbackPet?.name ||
					fallbackText,
				avatar: resolvedPet?.avatar || firstRecord?.pet?.avatar || fallbackPet?.avatar || DEFAULT_PET_SUMMARY.avatar,
				breedName: getPetBreedLabel(
					resolvedPet?.breed || firstRecord?.pet?.breed || firstRecord?.pet?.breedName || fallbackPet?.breed,
					resolvedPet?.species || firstRecord?.pet?.species || fallbackPet?.species,
					fallbackText,
				),
				birthday: formatDate(resolvedPet?.dateOfBirth || firstRecord?.pet?.dateOfBirth || fallbackPet?.dateOfBirth, locale, fallbackText),
				gender: formatGender(resolvedPet?.gender ?? firstRecord?.pet?.gender ?? fallbackPet?.gender, t, fallbackText),
			})
		} catch (error) {
			message.error(normalizeMedicalErrorMessage(error, t))
			setTimelineRecords(EMPTY_TIMELINE)
			setReminders(EMPTY_REMINDERS)
			setExpandedRecords(new Set())
			setPetSummary({ ...DEFAULT_PET_SUMMARY, name: fallbackText, breedName: fallbackText, birthday: fallbackText, gender: fallbackText })
		} finally {
			setLoading(false)
		}
	}, [fallbackText, locale, medicalId, petId, selectedRecord, t])

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
				<h1>{t('medicalRecords.view.pageTitle')}</h1>
				<div className={styles.topHeaderActionSpacer} aria-hidden="true" />
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
							<MdHealthAndSafety /> {t('medicalRecords.view.timelineTitle')} {loading ? t('medicalRecords.view.loadingSuffix') : ''}
						</h2>
						<div className={styles.timelineWrapper}>
							{timelineRecords.length === 0 ? (
								<p className={styles.emptyStateText}>{emptyTimelineHint}</p>
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
															{isExpanded ? t('medicalRecords.view.collapse') : t('medicalRecords.view.expand')}
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
