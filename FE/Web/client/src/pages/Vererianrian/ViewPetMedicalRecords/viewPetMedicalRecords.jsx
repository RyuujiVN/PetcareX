import {
	DownOutlined,
	UpOutlined,
} from '@ant-design/icons'
import { Spin, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { FaCakeCandles, FaDog, FaMars } from 'react-icons/fa6'
import { MdHealthAndSafety } from 'react-icons/md'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../data/Vererianrian/api/medicalApi'
import { getVeterinarianPetByIdApi } from '../../../data/Vererianrian/api/petApi'
import { getBreedLabel } from '../../../data/client/api/petApi'
import { getMedicalRecordStatusLabel, getMedicineUnitLabel, getServiceLabel } from '../../../utils/enumLabel'
import styles from './viewPetMedicalRecords.module.css'

const DEFAULT_PET = {
	name: 'Chưa có dữ liệu thú cưng',
	avatar: '',
	breedText: 'Chưa cập nhật giống',
	birthday: 'Chưa cập nhật',
	rawBirthday: '',
	ageText: 'Chưa cập nhật tuổi',
	gender: 'Chưa cập nhật',
	weight: 'Chưa cập nhật',
}

const formatDate = (value) => {
	if (!value) return 'Chưa cập nhật'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
	return date.toLocaleDateString('vi-VN')
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
	return resolved === 'Chưa cập nhật' ? 'Không' : resolved
}

const resolveRecordTitle = (name, fallback = 'Phiếu khám') => {
	if (!name) return fallback
	return getServiceLabel(name, name) || fallback
}

const formatVitalValue = (value, suffix = '') => {
	if (value === null || value === undefined || value === '') return 'Chưa cập nhật'
	return suffix ? `${value} ${suffix}` : String(value)
}

const formatBloodPressure = (systolic, diastolic) => {
	if (!systolic && !diastolic) return 'Chưa cập nhật'
	if (systolic && diastolic) return `${systolic}/${diastolic} mmHg`
	return `${systolic || diastolic} mmHg`
}

const formatGender = (gender) => {
	if (typeof gender === 'boolean') return gender ? 'Đực' : 'Cái'
	if (!gender) return 'Chưa cập nhật'
	const normalizedGender = String(gender).trim().toLowerCase()
	if (normalizedGender === 'male') return 'Đực'
	if (normalizedGender === 'female') return 'Cái'
	return String(gender)
}

const getAgeText = (birthday) => {
	if (!birthday) return 'Chưa cập nhật tuổi'
	const birthDate = new Date(birthday)
	if (Number.isNaN(birthDate.getTime())) return 'Chưa cập nhật tuổi'

	const now = new Date()
	let totalMonths =
		(now.getFullYear() - birthDate.getFullYear()) * 12 +
		(now.getMonth() - birthDate.getMonth())

	if (now.getDate() < birthDate.getDate()) {
		totalMonths -= 1
	}

	if (totalMonths < 0) return 'Chưa cập nhật tuổi'
	if (totalMonths < 24) return `${totalMonths} tháng`
	return `${Math.floor(totalMonths / 12)} tuổi`
}

const toPetSummary = (pet) => {
	if (!pet) return DEFAULT_PET

	return {
		name: pet?.name || DEFAULT_PET.name,
		avatar: pet?.avatar || '',
		breedText: getBreedLabel(pet?.breed || pet?.breedName, pet?.species) || 'Chưa cập nhật giống',
		rawBirthday: pet?.dateOfBirth || '',
		birthday: formatDate(pet?.dateOfBirth),
		ageText: getAgeText(pet?.dateOfBirth),
		gender: formatGender(pet?.gender),
		weight: pet?.weight ? `${pet.weight} kg` : DEFAULT_PET.weight,
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

	const medicineSummary =
		medicines.length > 0
			? medicines.map((medicine, index) => {
					const medicineName = medicine.medicine?.name || 'Thuốc chưa xác định'
					const unitLabel = resolveMedicineUnitLabel(medicine)
					const quantity = medicine.quantity
						? ` (${medicine.quantity}${unitLabel ? ` ${unitLabel}` : ''})`
						: ''

					return (
						<div key={index}>
							{medicineName}{quantity}
						</div>
					)
				})
			: 'Chưa kê thuốc'

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
		{ label: 'Thuốc', value: medicineSummary },
		{ label: 'Lời dặn bác sĩ', value: record?.note || 'Chưa cập nhật' },
	]

	return {
		id: String(record?.id || Math.random()),
		title: resolveRecordTitle(record?.name),
		status: getMedicalRecordStatusLabel(done, { uppercase: true }),
		statusType: done ? 'done' : 'pending',
		examDate: resolveExamDate(record),
		leftInfo: [
			{ label: 'Tên phòng khám', value: record?.clinic?.name || 'Chưa cập nhật' },
			{ label: 'Ngày tạo hồ sơ', value: formatDate(record?.createdAt) },
		],
		rightInfo: [
			{ label: 'Tên bác sĩ', value: record?.veterinarian?.fullName || 'Chưa cập nhật' },
			{ label: 'Ngày tái khám', value: formatFollowUpDate(record?.followUpDate) },
		],
		vitalRows,
		detailRows,
	}
}

export default function ViewPetMedicalRecords() {
	const location = useLocation()
	const [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [timeline, setTimeline] = useState([])
	const [petSummary, setPetSummary] = useState(DEFAULT_PET)
	const [expandedRecords, setExpandedRecords] = useState(() => new Set())

	const selectedRecord = location?.state?.record
	const medicalId = searchParams.get('medicalId')
	const petId = searchParams.get('petId')

	const loadMedicalTimeline = useCallback(async () => {
		try {
			setLoading(true)

			// Fetch pet detail from API if petId is available
			if (petId) {
				try {
					const petDetail = await getVeterinarianPetByIdApi(petId)
					if (petDetail) {
						setPetSummary(toPetSummary(petDetail))
					}
				} catch {
					// fallback to record data below
				}
			}

			let records = []
			if (medicalId) {
				const detail = await getMedicalById(medicalId)
				records = detail ? [detail] : []
			} else if (petId) {
				const byPet = await getMedicalByPetId(petId, 1, 200)
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
			setPetSummary(DEFAULT_PET)
			message.error(error?.message || 'Không thể tải hồ sơ chi tiết')
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
		loadMedicalTimeline()
	}, [loadMedicalTimeline])

	const petSubtitle = `${petSummary.breedText} • ${petSummary.weight}`

	return (
		<div className={styles.pageRoot}>
			<header className={styles.pageHeader}>
				<h1>Hồ sơ y tế điện tử</h1>
			</header>

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
					<MdHealthAndSafety /> Dòng thời gian sức khỏe
				</h3>

				{loading ? (
					<div className={styles.loadingWrap}>
						<Spin size="large" />
					</div>
				) : timeline.length === 0 ? (
					<div className={styles.emptyState}>Không có dữ liệu hồ sơ bệnh án để hiển thị.</div>
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
													{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
													{isExpanded ? <UpOutlined /> : <DownOutlined />}
												</button>
											</div>
										</div>

										<div className={styles.recordMetaGrid}>
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
