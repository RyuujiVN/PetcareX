import {
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons'
import { Spin, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { FaCakeCandles, FaDog, FaMars } from 'react-icons/fa6'
import { MdHealthAndSafety } from 'react-icons/md'
import { useTranslation } from 'react-i18next'
import { useLocation, useSearchParams } from 'react-router-dom'
import i18n from '../../../i18n'
import { getAdminInstance } from '../../../services/apiClient'
import {
    getMedicalByIdApi,
    getMedicalByPetIClinicdApi,
    getMedicalOrdersByMedicalIdApi,
    getMedicinesByMedicalIdApi,
} from '../../../services/medicalService'
import { getBreedLabel, getPetByIdApi } from '../../../services/petService'
import { formatDateDDMMYYYY } from '../../../utils/dateTimeFormat'
import { getMedicineUnitLabel, getServiceLabel } from '../../../utils/enumLabel'
import styles from './viewPetMedicalRecords.module.css'

const tVet = (key, options = {}) => i18n.t(key, { ns: 'vererianrian', ...options })

const buildDefaultPet = () => ({
	name: tVet('medicalRecords.detail.pet.nameFallback'),
	avatar: '',
	breedText: tVet('medicalRecords.detail.pet.breedFallback'),
	birthday: tVet('medicalRecords.detail.pet.birthdayFallback'),
	rawBirthday: '',
	ageText: tVet('medicalRecords.detail.pet.ageFallback'),
	gender: tVet('medicalRecords.detail.pet.genderFallback'),
	weight: tVet('medicalRecords.detail.pet.weightFallback'),
})

const formatDate = (value) => {
	return formatDateDDMMYYYY(value, tVet('medicalRecords.detail.states.notUpdated'))
}

const resolveExamDate = (record) =>
	formatDate(
		record?.appointment?.appointmentDate ||
			record?.appointmentDate ||
			record?.examDate ||
			record?.visitDate ||
			record?.createdAt,
	)

const formatFollowUpDate = (value) => {
	const resolved = formatDate(value)
	return resolved === tVet('medicalRecords.detail.states.notUpdated')
		? tVet('medicalRecords.detail.states.none')
		: resolved
}

const resolveRecordTitle = (name, fallback = tVet('medicalRecords.detail.record.titleFallback')) => {
	if (!name) return fallback
	return getServiceLabel(name, name) || fallback
}

const formatVitalValue = (value, suffix = '') => {
	if (value === null || value === undefined || value === '') return tVet('medicalRecords.detail.states.notUpdated')
	return suffix ? `${value} ${suffix}` : String(value)
}

const formatBloodPressure = (systolic, diastolic) => {
	if (!systolic && !diastolic) return tVet('medicalRecords.detail.states.notUpdated')
	if (systolic && diastolic) return `${systolic}/${diastolic} mmHg`
	return `${systolic || diastolic} mmHg`
}

const formatGender = (gender) => {
	if (typeof gender === 'boolean') return gender ? tVet('medicalRecords.detail.pet.male') : tVet('medicalRecords.detail.pet.female')
	if (!gender) return tVet('medicalRecords.detail.pet.genderFallback')
	const normalizedGender = String(gender).trim().toLowerCase()
	if (normalizedGender === 'male') return tVet('medicalRecords.detail.pet.male')
	if (normalizedGender === 'female') return tVet('medicalRecords.detail.pet.female')
	return String(gender)
}

const getAgeText = (birthday) => {
	if (!birthday) return tVet('medicalRecords.detail.pet.ageFallback')
	const birthDate = new Date(birthday)
	if (Number.isNaN(birthDate.getTime())) return tVet('medicalRecords.detail.pet.ageFallback')

	const now = new Date()
	let totalMonths =
		(now.getFullYear() - birthDate.getFullYear()) * 12 +
		(now.getMonth() - birthDate.getMonth())

	if (now.getDate() < birthDate.getDate()) {
		totalMonths -= 1
	}

	if (totalMonths < 0) return tVet('medicalRecords.detail.pet.ageFallback')
	if (totalMonths < 24) return tVet('medicalRecords.detail.pet.ageMonths', { count: totalMonths })
	return tVet('medicalRecords.detail.pet.ageYears', { count: Math.floor(totalMonths / 12) })
}

const toPetSummary = (pet) => {
	if (!pet) return buildDefaultPet()

	return {
		name: pet?.name || tVet('medicalRecords.detail.pet.nameFallback'),
		avatar: pet?.avatar || '',
		breedText: getBreedLabel(pet?.breed || pet?.breedName, pet?.species) || tVet('medicalRecords.detail.pet.breedFallback'),
		rawBirthday: pet?.dateOfBirth || '',
		birthday: formatDate(pet?.dateOfBirth),
		ageText: getAgeText(pet?.dateOfBirth),
		gender: formatGender(pet?.gender),
		weight: pet?.weight ? `${pet.weight} kg` : tVet('medicalRecords.detail.pet.weightFallback'),
	}
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

const toTimelineRecord = (record, _medicalOrders = [], medicines = []) => {
	const done = Boolean(record?.conclusion)
	const medicalOrders = Array.isArray(_medicalOrders) ? _medicalOrders : []

	const orderSummary =
		medicalOrders.length > 0
			? medicalOrders
					.map(
						(order) =>
							order?.medicalOrder?.nameVn ||
							order?.medicalOrder?.nameEng ||
							order?.medicalOrder?.name ||
							tVet('medicalRecords.detail.record.orderFallback'),
					)
					.join(', ')
			: tVet('medicalRecords.detail.record.none')

	const medicineSummary =
		medicines.length > 0
			? medicines.map((medicine) => {
					const medicineName = medicine.medicine?.name || tVet('medicalRecords.detail.record.medicineFallback')
					const unitLabel = resolveMedicineUnitLabel(medicine)
					const quantity = medicine.quantity
						? ` (${medicine.quantity}${unitLabel ? ` ${unitLabel}` : ''})`
						: ''

					return `${medicineName}${quantity}`
				})
				.join(', ')
			: tVet('medicalRecords.detail.record.none')

	const vitalRows = [
		{ label: tVet('medicalRecords.detail.labels.weight'), value: formatVitalValue(record?.weight, 'kg') },
		{ label: tVet('medicalRecords.detail.labels.temperature'), value: formatVitalValue(record?.temperature, '°C') },
		{ label: tVet('medicalRecords.detail.labels.heartRate'), value: formatVitalValue(record?.heartRate, 'l/p/m') },
		{ label: tVet('medicalRecords.detail.labels.bloodPressure'), value: formatBloodPressure(record?.systolic, record?.diastolic) },
	]

	const detailRows = [
		{ label: tVet('medicalRecords.detail.labels.symptoms'), value: record?.symptoms || tVet('medicalRecords.detail.states.notUpdated') },
		{ label: tVet('medicalRecords.detail.labels.diagnosis'), value: record?.diagnosis || tVet('medicalRecords.detail.states.notUpdated') },
		{ label: tVet('medicalRecords.detail.labels.conclusion'), value: record?.conclusion || tVet('medicalRecords.detail.states.notUpdated') },
		{ label: tVet('medicalRecords.detail.labels.doctorAdvice'), value: record?.note || tVet('medicalRecords.detail.states.notUpdated') },
		{ label: tVet('medicalRecords.detail.labels.orders'), value: orderSummary },
		{ label: tVet('medicalRecords.detail.labels.medicines'), value: medicineSummary },
	]

	return {
		id: String(record?.id || Math.random()),
		title: resolveRecordTitle(record?.name),
		status: done ? tVet('medicalRecords.detail.status.done') : tVet('medicalRecords.detail.status.pending'),
		statusType: done ? 'done' : 'pending',
		examDate: resolveExamDate(record),
		leftInfo: [
			{ label: tVet('medicalRecords.detail.labels.examDate'), value: resolveExamDate(record) },
		],
		rightInfo: record?.followUpDate
			? [{ label: tVet('medicalRecords.detail.labels.followUpDate'), value: formatFollowUpDate(record?.followUpDate) }]
			: [],
		vitalRows,
		detailRows,
	}
}

export default function ViewPetMedicalRecords() {
	const { i18n: i18nInstance } = useTranslation('vererianrian')
	const location = useLocation()
	const [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [timeline, setTimeline] = useState([])
	const [petSummary, setPetSummary] = useState(() => buildDefaultPet())
	const [expandedRecords, setExpandedRecords] = useState(() => new Set())

	const selectedRecord = location?.state?.record
	const medicalId = searchParams.get('medicalId')
	const petId = searchParams.get('petId')
	const currentLanguage = i18nInstance.resolvedLanguage || i18nInstance.language

	const loadMedicalTimeline = useCallback(async () => {
		try {
			setLoading(true)

			// Fetch pet detail from API if petId is available
			if (petId) {
				try {
					const petDetail = await getPetByIdApi(getAdminInstance(), petId)
					if (petDetail) {
						setPetSummary(toPetSummary(petDetail))
					}
				} catch {
					// fallback to record data below
				}
			}

			let records = []
			if (medicalId) {
				const detail = await getMedicalByIdApi(getAdminInstance(), medicalId)
				records = detail ? [detail] : []
			} else if (petId) {
				const byPet = await getMedicalByPetIClinicdApi(getAdminInstance(), petId, 1, 200)
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

			if (records.length === 0) {
				setTimeline([])
				if (selectedRecord) {
					setPetSummary(
						toPetSummary({
							name: selectedRecord?.petName,
							avatar: selectedRecord?.petAvatar,
							breed: selectedRecord?.petBreed || selectedRecord?.petSpecies,
							dateOfBirth: selectedRecord?.petDateOfBirth,
							gender: selectedRecord?.petGender,
							weight: selectedRecord?.petWeight,
						}),
					)
				}
				return
			}

			records.sort((a, b) => {
				const aTime = new Date(a?.createdAt || 0).getTime()
				const bTime = new Date(b?.createdAt || 0).getTime()
				return bTime - aTime
			})

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

			setTimeline(
				enrichedRecords.map(({ record, medicalOrders, medicines }) =>
					toTimelineRecord(record, medicalOrders, medicines),
				),
			)
			setExpandedRecords(new Set())

			// Use pet info from API if already fetched, otherwise fallback to record data
			if (!petId) {
				const firstPet = records[0]?.pet
				if (firstPet) {
					setPetSummary(toPetSummary(firstPet))
				}
			}
		} catch (error) {
			setTimeline([])
			setPetSummary(buildDefaultPet())
			message.error(error?.message || tVet('medicalRecords.detail.messages.loadError'))
		} finally {
			setLoading(false)
		}
	}, [medicalId, petId, selectedRecord, currentLanguage])

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
		loadMedicalTimeline()
	}, [loadMedicalTimeline])

	const petSubtitle = `${petSummary.breedText} • ${petSummary.weight}`

	return (
		<div className={styles.pageRoot}>
			<section className={styles.petSection}>
				<div className={styles.petMainInfo}>
					{petSummary.avatar ? (
						<img src={petSummary.avatar} alt={petSummary.name} className={styles.petAvatar} />
					) : (
						<div className={styles.petAvatarFallback}>
							<FaDog />
						</div>
					)}

					<div>
						<h2>{petSummary.name}</h2>
						<p className={styles.petMeta}>{petSubtitle}</p>
						<div className={styles.petSubMeta}>
							<span>
								<FaCakeCandles /> {petSummary.birthday}
							</span>
							<span style={{ marginLeft: 8 }}>
								<FaMars /> {petSummary.gender}
							</span>
						</div>
					</div>
				</div>
			</section>

			<section className={styles.timelinePanel}>
				<h3>
					<MdHealthAndSafety /> {tVet('medicalRecords.detail.title')}
				</h3>

				{loading ? (
					<div className={styles.loadingWrap}>
						<Spin size="large" />
					</div>
				) : timeline.length === 0 ? (
					<div className={styles.emptyState}>{tVet('medicalRecords.detail.states.empty')}</div>
				) : (
					<div className={styles.timelineWrap}>
						{timeline.map((item) => {
							const isExpanded = expandedRecords.has(item.id)

							return (
								<div key={item.id} className={styles.timelineItem}>
									<div className={styles.timelineMarker}>
										<MdHealthAndSafety />
									</div>

									<div className={styles.timelineCard}>
										<div className={styles.cardHeader}>
											<div className={styles.headerMain}>
												<h4 className={styles.cardTitle}>{item.title}</h4>
											</div>

											<div className={styles.headerActions}>
												<span className={`${styles.statusTag} ${styles[item.statusType]}`}>
													{item.status}
												</span>
												<button
													type="button"
													className={styles.expandButton}
													onClick={() => toggleExpandedRecord(item.id)}
													aria-expanded={isExpanded}
												>
														{isExpanded ? tVet('medicalRecords.detail.actions.collapse') : tVet('medicalRecords.detail.actions.expand')}
													{isExpanded ? <UpOutlined /> : <DownOutlined />}
												</button>
											</div>
										</div>

										<div
											className={`${styles.recordMetaGrid} ${item.rightInfo.length === 0 ? styles.recordMetaGridSingle : ''}`}
										>
											<div>
												{item.leftInfo.map((line) => (
													<p key={`${item.id}-${line.label}-left`}>
														<strong>{line.label}:</strong> {line.value}
													</p>
												))}
											</div>
											<div>
												{item.rightInfo.map((line) => (
													<p key={`${item.id}-${line.label}-right`}>
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
														{item.vitalRows.map((detail) => (
															<p key={`${item.id}-${detail.label}`}>
																<span>{detail.label}:</span> {detail.value}
															</p>
														))}
													</div>
													<div className={styles.detailColumn}>
														{item.detailRows.map((detail) => (
															<p key={`${item.id}-${detail.label}`}>
																<span>{detail.label}:</span> {detail.value}
															</p>
														))}
													</div>
												</div>
											</>
										) : null}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</section>
		</div>
	)
}
