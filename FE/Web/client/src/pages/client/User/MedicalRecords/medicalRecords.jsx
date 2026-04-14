import {
	DownOutlined,
	UpOutlined,
} from '@ant-design/icons'
import { Modal, Rate, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
	getMedicalByIdApi,
	getMedicalByPetIdApi,
	getMedicalOrdersByMedicalIdApi,
	getMedicinesByMedicalIdApi,
} from '../../../../services/medicalService'
import { getBreedLabel, getMyPetsApi } from '../../../../services/petService'
import { getClientInstance } from '../../../../services/apiClient'
import { useAuth } from '../../../../hooks/client/AuthContext'
import {
	getAllClinicReviews,
	upsertClinicReview,
} from '../../../../services/clinicReviewService'
import { getMedicalRecordStatusLabel, getMedicineUnitLabel, getServiceLabel } from '../../../../utils/enumLabel'
import styles from './medicalRecords.module.css'

const EMPTY_TIMELINE = []
const EMPTY_REMINDERS = []
const getDefaultPetSummary = (t) => ({
	name: t('pages.medicalRecords.defaultPetSummary.name'),
	avatar: '',
	breedName: t('pages.medicalRecords.defaultPetSummary.breedName'),
	birthday: t('common.states.notUpdated'),
	gender: t('common.states.notUpdated'),
	weight: t('common.states.notUpdated'),
})

const formatGender = (gender, t) => {
	if (typeof gender === 'boolean') return gender ? t('pages.medicalRecords.gender.male') : t('pages.medicalRecords.gender.female')
	if (!gender) return t('common.states.notUpdated')
	const normalizedGender = String(gender).trim().toLowerCase()
	if (normalizedGender === 'male') return t('pages.medicalRecords.gender.male')
	if (normalizedGender === 'female') return t('pages.medicalRecords.gender.female')
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

const formatDate = (value, locale, t) => {
	if (!value) return t('common.states.notUpdated')

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return t('common.states.notUpdated')

	return date.toLocaleDateString(locale)
}

const formatFollowUpDate = (value, locale, t) => {
	const resolved = formatDate(value, locale, t)
	return resolved === t('common.states.notUpdated') ? t('common.states.notAvailable') : resolved
}

const resolveRecordTitle = (name, t, fallback) => {
	const titleFallback = fallback || t('pages.medicalRecords.recordFallbackTitle')
	if (!name) return titleFallback
	return getServiceLabel(name, name) || titleFallback
}

const resolveExamDate = (record, locale, t) =>
	formatDate(
		record?.appointment?.appointmentDate ||
			record?.appointmentDate ||
			record?.examDate ||
			record?.visitDate ||
			record?.createdAt,
		locale,
		t,
	)

const formatVitalValue = (value, t, suffix = '') => {
	if (value === null || value === undefined || value === '') return t('common.states.notUpdated')
	return suffix ? `${value} ${suffix}` : String(value)
}

const formatBloodPressure = (systolic, diastolic, t) => {
	if (!systolic && !diastolic) return t('common.states.notUpdated')
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
	const rawMessage = error?.message || t('pages.medicalRecords.loadFailed')
	const normalized = rawMessage.trim().toLowerCase()

	if (normalized === 'internal server error') {
		return t('pages.medicalRecords.internalServerError')
	}

	return rawMessage
}

const mapMedicalToTimelineRecord = (record, medicalOrders = [], medicines = [], locale, t) => {
	const orderSummary =
		medicalOrders.length > 0
			? medicalOrders
					.map(
						(order) =>
							order?.medicalOrder?.nameVn ||
							order?.medicalOrder?.nameEng ||
							order?.medicalOrder?.name ||
							t('common.states.notAvailable'),
					)
					.join(', ')
			: t('common.states.notAvailable')

	const medicineSummary =
		medicines.length > 0
			? medicines.map((medicine) => {
					const medicineName = medicine.medicine?.name || t('common.states.notAvailable')
					const unitLabel = resolveMedicineUnitLabel(medicine)
					const quantity = medicine.quantity
						? ` (${medicine.quantity}${unitLabel ? ` ${unitLabel}` : ''})`
						: ''

					return `${medicineName}${quantity}`
				})
				.join(', ')
			: t('common.states.notAvailable')

	const hasConclusion = Boolean(record?.conclusion)
	const status = getMedicalRecordStatusLabel(hasConclusion, { uppercase: true })
	const statusType = hasConclusion ? 'done' : 'pending'

	let markerType = 'checkup'
	if (medicalOrders.length > 0) markerType = 'vaccine'
	if (medicines.length > 0) markerType = 'skin'

	const vitalRows = [
		{ label: t('pages.medicalRecords.record.weight'), value: formatVitalValue(record?.weight, t, 'kg') },
		{ label: t('pages.medicalRecords.record.temperature'), value: formatVitalValue(record?.temperature, t, '°C') },
		{ label: t('pages.medicalRecords.record.heartRate'), value: formatVitalValue(record?.heartRate, t, 'l/p/m') },
		{ label: t('pages.medicalRecords.record.bloodPressure'), value: formatBloodPressure(record?.systolic, record?.diastolic, t) },
	]

	const detailRows = [
		{ label: t('pages.medicalRecords.record.symptoms'), value: record?.symptoms || t('common.states.notUpdated') },
		{ label: t('pages.medicalRecords.record.diagnosis'), value: record?.diagnosis || t('common.states.notUpdated') },
		{ label: t('pages.medicalRecords.record.conclusion'), value: record?.conclusion || t('common.states.notUpdated') },
		{ label: t('pages.medicalRecords.record.doctorNote'), value: record?.note || t('common.states.notUpdated') },
		{ label: t('pages.medicalRecords.record.medicalOrders'), value: orderSummary },
		{ label: t('pages.medicalRecords.record.prescription'), value: medicineSummary },
	]

	return {
		id: record?.id || `record-${Date.now()}`,
		medicalRecordId: record?.id || '',
		clinicId: record?.clinic?.id || record?.appointment?.clinic?.id || '',
		clinicName: record?.clinic?.name || t('common.states.notUpdated'),
		markerType,
		title: resolveRecordTitle(record?.name, t),
		status,
		statusType,
		leftInfo: [
			{ label: t('pages.medicalRecords.record.clinicName'), value: record?.clinic?.name || t('common.states.notUpdated') },
			{ label: t('pages.medicalRecords.record.examDate'), value: resolveExamDate(record, locale, t) },
		],
		rightInfo: [
			{
				label: t('pages.medicalRecords.record.doctorName'),
				value: record?.veterinarian?.fullName || t('common.states.notUpdated'),
			},
			{ label: t('pages.medicalRecords.record.followUpDate'), value: formatFollowUpDate(record?.followUpDate, locale, t) },

		],
		vitalRows,
		detailRows,
	}
}

const mapMedicalToReminder = (record, locale, t) => {
	if (record?.followUpDate) {
		return {
			id: `reminder-follow-up-${record.id}`,
			type: 'follow-up',
			title: t('pages.medicalRecords.reminders.followUpTitle', { name: record?.pet?.name || record?.petName || t('pages.medicalRecords.defaultPetName') }),
			subtitle: formatDate(record.followUpDate, locale, t),
		}
	}

	return {
		id: `reminder-medical-${record?.id || Date.now()}`,
		type: 'vaccine',
		title: resolveRecordTitle(record?.name, t, t('pages.medicalRecords.reminders.defaultTitle')),
		subtitle: t('pages.medicalRecords.reminders.examDate', { date: resolveExamDate(record, locale, t) }),
	}
}

function MedicalRecords() {
	const { t, i18n } = useTranslation()
	const { userProfile } = useAuth()
	const dateLocale = i18n.language === 'en' ? 'en-US' : 'vi-VN'
	const defaultPetSummary = useMemo(() => getDefaultPetSummary(t), [t])
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [timelineRecords, setTimelineRecords] = useState(EMPTY_TIMELINE)
	const [reminders, setReminders] = useState(EMPTY_REMINDERS)
	const [petSummary, setPetSummary] = useState(defaultPetSummary)
	const [expandedRecords, setExpandedRecords] = useState(() => new Set())
	const [reviewByMedicalId, setReviewByMedicalId] = useState({})
	const [reviewModalOpen, setReviewModalOpen] = useState(false)
	const [reviewTargetRecord, setReviewTargetRecord] = useState(null)
	const [reviewRating, setReviewRating] = useState(0)
	const [reviewContent, setReviewContent] = useState('')
	const [savingReview, setSavingReview] = useState(false)
	const medicalId = searchParams.get('medicalId')
	const petId = searchParams.get('petId')
	const handleChangePet = () => {
			navigate('/listPetMedicalRecords')
		}

	const refreshReviewMap = useCallback(() => {
		const nextMap = getAllClinicReviews().reduce((acc, item) => {
			if (!item?.medicalRecordId) return acc
			acc[item.medicalRecordId] = item
			return acc
		}, {})

		setReviewByMedicalId(nextMap)
	}, [])
	const loadMedicalData = useCallback(async () => {
		try {
			setLoading(true)

			const myPets = await getMyPetsApi(getClientInstance()).catch(() => [])
			const petList = Array.isArray(myPets) ? myPets : []

			const selectedPet = petId
				? petList.find((item) => String(item?.id) === String(petId))
				: petList[0]

			if (petId && !selectedPet) {
				message.warning(t('pages.medicalRecords.petNotFound'))
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				setPetSummary(defaultPetSummary)
				return
			}

			const resolvedPetId = petId || selectedPet?.id

			let records = []
			if (medicalId) {
				const detail = await getMedicalByIdApi(getClientInstance(), medicalId)
				records = detail ? [detail] : []
			} else if (resolvedPetId) {
				const byPet = await getMedicalByPetIdApi(getClientInstance(), resolvedPetId)
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
						const detail = await getMedicalByIdApi(getClientInstance(), record.id).catch(() => null)
						return detail ? { ...record, ...detail } : record
					}),
				)
			}

			if (records.length === 0 && selectedPet) {
				setPetSummary({
					name: selectedPet?.name || defaultPetSummary.name,
					avatar: selectedPet?.avatar || defaultPetSummary.avatar,
					breedName: getBreedLabel(selectedPet?.breed, selectedPet?.species),
					birthday: formatDate(selectedPet?.dateOfBirth, dateLocale, t),
					gender: formatGender(selectedPet?.gender, t),
					weight: selectedPet?.weight ? `${selectedPet.weight} kg` : defaultPetSummary.weight,
				})
			}

			if (records.length === 0) {
				setTimelineRecords(EMPTY_TIMELINE)
				setReminders(EMPTY_REMINDERS)
				setExpandedRecords(new Set())
				if (!selectedPet) {
					setPetSummary(defaultPetSummary)
				}
				return
			}

			const enrichedRecords = await Promise.all(
				records.map(async (record) => {
					const [medicalOrders, medicines] = await Promise.all([
						getMedicalOrdersByMedicalIdApi(getClientInstance(), record.id).catch(() => []),
						getMedicinesByMedicalIdApi(getClientInstance(), record.id).catch(() => []),
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
					mapMedicalToTimelineRecord(record, medicalOrders, medicines, dateLocale, t),
				),
			)
			setExpandedRecords(new Set())

			setReminders(enrichedRecords.slice(0, 3).map(({ record }) => mapMedicalToReminder(record, dateLocale, t)))

			const firstRecord = enrichedRecords[0]?.record
			setPetSummary({
				name:
					firstRecord?.pet?.name ||
					firstRecord?.petName ||
					selectedPet?.name ||
					defaultPetSummary.name,
				avatar: firstRecord?.pet?.avatar || selectedPet?.avatar || defaultPetSummary.avatar,
				breedName: getBreedLabel(
					firstRecord?.pet?.breed || firstRecord?.pet?.breedName || selectedPet?.breed,
					firstRecord?.pet?.species || selectedPet?.species,
				),
				birthday: formatDate(firstRecord?.pet?.dateOfBirth || selectedPet?.dateOfBirth, dateLocale, t),
				gender: formatGender(firstRecord?.pet?.gender ?? selectedPet?.gender, t),
				weight:
					firstRecord?.pet?.weight || firstRecord?.weight || selectedPet?.weight
						? `${firstRecord?.pet?.weight || firstRecord?.weight || selectedPet?.weight} kg`
						: defaultPetSummary.weight,
			})
		} catch (error) {
			message.error(normalizeMedicalErrorMessage(error, t))
			setTimelineRecords(EMPTY_TIMELINE)
			setReminders(EMPTY_REMINDERS)
			setExpandedRecords(new Set())
			setPetSummary(defaultPetSummary)
		} finally {
			setLoading(false)
		}
	}, [medicalId, petId, t, defaultPetSummary, dateLocale])

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

	useEffect(() => {
		refreshReviewMap()

		const handleStorage = () => {
			refreshReviewMap()
		}

		window.addEventListener('storage', handleStorage)
		return () => window.removeEventListener('storage', handleStorage)
	}, [refreshReviewMap])

	const handleOpenReviewModal = useCallback((record) => {
		if (!record?.medicalRecordId || !record?.clinicId) {
			message.warning(t('pages.medicalRecords.review.missingClinicInfo'))
			return
		}

		const existingReview = reviewByMedicalId[record.medicalRecordId]
		setReviewTargetRecord(record)
		setReviewRating(existingReview?.rating || 0)
		setReviewContent(existingReview?.content || '')
		setReviewModalOpen(true)
	}, [reviewByMedicalId, t])

	const handleSubmitReview = useCallback(async () => {
		if (!reviewTargetRecord?.medicalRecordId || !reviewTargetRecord?.clinicId) {
			return
		}

		if (!reviewRating) {
			message.warning(t('pages.medicalRecords.review.validation.ratingRequired'))
			return
		}

		if (!String(reviewContent || '').trim()) {
			message.warning(t('pages.medicalRecords.review.validation.contentRequired'))
			return
		}

		try {
			setSavingReview(true)
			upsertClinicReview({
				clinicId: reviewTargetRecord.clinicId,
				clinicName: reviewTargetRecord.clinicName,
				medicalRecordId: reviewTargetRecord.medicalRecordId,
				rating: reviewRating,
				content: reviewContent.trim(),
				reviewerId: userProfile?.id || '',
			})
			refreshReviewMap()
			setReviewModalOpen(false)
			setReviewTargetRecord(null)
			setReviewRating(0)
			setReviewContent('')
			message.success(t('pages.medicalRecords.review.submitSuccess'))
		} catch {
			message.error(t('pages.medicalRecords.review.submitFailed'))
		} finally {
			setSavingReview(false)
		}
	}, [refreshReviewMap, reviewContent, reviewRating, reviewTargetRecord, t, userProfile?.id])


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
							<MdHealthAndSafety /> {t('pages.medicalRecords.timelineTitle')} {loading ? `(${t('common.states.loading')})` : ''}
						</h2>
						<div className={styles.timelineWrapper}>
							{timelineRecords.length === 0 ? (
								<p className={styles.emptyStateText}>{t('pages.medicalRecords.emptyTimelineHint')}</p>
							) : (
								timelineRecords.map((record) => {
									const isExpanded = expandedRecords.has(record.id)
									const existingReview = reviewByMedicalId[record.medicalRecordId]

									return (
										<div key={record.id} className={styles.timelineItem}>
											<div className={`${styles.timelineMarker} ${styles[record.markerType]}`}>
												{getMarkerIcon(record.markerType)}
											</div>

											<div className={styles.recordCard}>
												<div className={styles.recordHeader}>
													<div className={styles.headerMain}>
														<h3 style={{fontSize: 22}}>{record.title}</h3>
													</div>

													<div className={styles.headerActions}>
														{record.statusType === 'done' ? (
															<button
																type="button"
																className={`${styles.reviewButton} ${existingReview ? styles.reviewed : ''}`}
																onClick={() => handleOpenReviewModal(record)}
																disabled={Boolean(existingReview)}
															>
																{existingReview
																	? t('pages.medicalRecords.review.ratedButton')
																	: t('pages.medicalRecords.review.actionButton')}
															</button>
														) : (
															<span className={`${styles.statusTag} ${styles[record.statusType]}`}>
																{record.status}
															</span>
														)}
														<button
															type="button"
															className={styles.expandButton}
															onClick={() => toggleExpandedRecord(record.id)}
															aria-expanded={isExpanded}
														>
															{isExpanded ? t('pages.medicalRecords.actions.collapse') : t('pages.medicalRecords.actions.viewDetail')}
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

					<aside className={styles.reminderPanel}>
						<h2 className={styles.panelTitle}>
							<FaBell /> {t('pages.medicalRecords.remindersTitle')}
						</h2>

						<div className={styles.reminderList}>
							{reminders.length === 0 ? (
								<p className={styles.emptyStateText}>{t('pages.medicalRecords.emptyReminders')}</p>
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
							onClick={() => handleBookNow(t('pages.medicalRecords.bookingService'))}
						>
							{t('pages.medicalRecords.bookNow')}
						</button>
					</aside>
				</section>
			</main>

			<Modal
				open={reviewModalOpen}
				onCancel={() => {
					setReviewModalOpen(false)
					setReviewTargetRecord(null)
				}}
				onOk={handleSubmitReview}
				okText={t('pages.medicalRecords.review.submitButton')}
				cancelText={t('common.actions.cancel')}
				confirmLoading={savingReview}
				okButtonProps={{
					disabled: !reviewRating || !String(reviewContent || '').trim(),
				}}
			>
				<div className={styles.reviewModalBody}>
					<p className={styles.reviewModalTitle}>{t('pages.medicalRecords.review.modalTitle')}</p>
					<p className={styles.reviewClinicName}>
						{reviewTargetRecord?.clinicName || t('common.states.unknown')}
					</p>
					<p className={styles.reviewHint}>{t('pages.medicalRecords.review.ratingLabel')}</p>
					<Rate allowHalf value={reviewRating} onChange={setReviewRating} />
					<p className={styles.reviewHint}>{t('pages.medicalRecords.review.contentLabel')}</p>
					<textarea
						className={styles.reviewTextarea}
						value={reviewContent}
						onChange={(event) => setReviewContent(event.target.value)}
						placeholder={t('pages.medicalRecords.review.contentPlaceholder')}
						rows={4}
					/>
				</div>
			</Modal>
		</div>
	)
}

export default MedicalRecords
