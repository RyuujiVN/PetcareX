import { useCallback, useEffect, useState } from 'react'
import { Button, Spin, message } from 'antd'
import {
	ArrowLeftOutlined,
	CalendarOutlined,
	MedicineBoxOutlined,
	UserOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../data/adminVererianrian/api/medicalApi'
import styles from './viewPetMedicalRecords.module.css'

const DEFAULT_PET = {
	name: 'Chưa có dữ liệu thú cưng',
	avatar: '',
	breedText: 'Chưa cập nhật giống',
	birthday: 'Chưa cập nhật',
	gender: 'Chưa cập nhật',
	weight: 'Chưa cập nhật',
}

const formatDate = (value) => {
	if (!value) return 'Chưa cập nhật'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
	return date.toLocaleDateString('vi-VN')
}

const formatGender = (gender) => {
	if (typeof gender === 'boolean') return gender ? 'Đực' : 'Cái'
	if (!gender) return 'Chưa cập nhật'
	const normalizedGender = String(gender).trim().toLowerCase()
	if (normalizedGender === 'male') return 'Đực'
	if (normalizedGender === 'female') return 'Cái'
	return String(gender)
}

const formatEnumLabel = (value) => {
	if (!value) return 'Chưa cập nhật'
	return String(value)
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const getAgeText = (birthday) => {
	if (!birthday) return 'Chưa cập nhật tuổi'
	const birthDate = new Date(birthday)
	if (Number.isNaN(birthDate.getTime())) return 'Chưa cập nhật tuổi'

	const now = new Date()
	let years = now.getFullYear() - birthDate.getFullYear()
	let months = now.getMonth() - birthDate.getMonth()

	if (months < 0) {
		years -= 1
		months += 12
	}

	if (years <= 0) return `${months} tháng`
	return `${years} tuổi`
}

const toPetSummary = (pet) => {
	if (!pet) return DEFAULT_PET

	return {
		name: pet?.name || DEFAULT_PET.name,
		avatar: pet?.avatar || '',
		breedText: formatEnumLabel(pet?.breed || pet?.breedName || pet?.species),
		birthday: formatDate(pet?.dateOfBirth),
		gender: formatGender(pet?.gender),
		weight: pet?.weight ? `${pet.weight} kg` : DEFAULT_PET.weight,
	}
}

const normalizeMedicineCode = (medicalOrders = [], medicines = []) => {
	const firstOrder = medicalOrders[0]
	if (firstOrder?.medicalOrder?.code) return firstOrder.medicalOrder.code
	if (firstOrder?.medicalOrder?.id) return `MO-${firstOrder.medicalOrder.id}`
	if (medicines[0]?.medicine?.id) return `RX-${medicines[0].medicine.id}`
	return 'Chưa cập nhật'
}

const toTimelineRecord = (record, medicalOrders = [], medicines = []) => {
	const done = Boolean(record?.conclusion)

	return {
		id: String(record?.id || Math.random()),
		title: record?.name || 'Phiếu khám',
		status: done ? 'ĐÃ HOÀN THÀNH' : 'CHƯA HOÀN THÀNH',
		statusType: done ? 'done' : 'pending',
		leftInfo: [
			{ label: 'Mã hồ sơ', value: record?.id || 'Chưa cập nhật' },
			{ label: 'Mã phòng khám', value: record?.clinic?.id || 'Chưa cập nhật' },
			{ label: 'Ngày tạo hồ sơ', value: formatDate(record?.createdAt) },
		],
		rightInfo: [
			{ label: 'Tên thú cưng', value: record?.pet?.name || 'Chưa cập nhật' },
			{ label: 'Tên bác sĩ', value: record?.veterinarian?.fullName || 'Chưa cập nhật' },
			{ label: 'Mã đơn thuốc', value: normalizeMedicineCode(medicalOrders, medicines) },
		],
		details: [
			{ label: 'Chẩn đoán', value: record?.diagnosis || 'Chưa cập nhật' },
			{ label: 'Triệu chứng', value: record?.symptoms || 'Chưa cập nhật' },
			{ label: 'Ghi chú', value: record?.note || 'Chưa cập nhật' },
			{ label: 'Ngày tái khám', value: formatDate(record?.followUpDate) },
		],
	}
}

export default function ViewPetMedicalRecords() {
	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()
	const [loading, setLoading] = useState(false)
	const [timeline, setTimeline] = useState([])
	const [petSummary, setPetSummary] = useState(DEFAULT_PET)

	const selectedRecord = location?.state?.record
	const medicalId = searchParams.get('medicalId')
	const petId = searchParams.get('petId')

	const loadMedicalTimeline = useCallback(async () => {
		try {
			setLoading(true)

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
				return aTime - bTime
			})

			const enriched = await Promise.all(
				records.map(async (record) => {
					const [orders, medicines] = await Promise.all([
						getMedicalOrdersByMedicalId(record.id).catch(() => []),
						getMedicinesByMedicalId(record.id).catch(() => []),
					])

					return {
						record,
						orders: Array.isArray(orders) ? orders : [],
						medicines: Array.isArray(medicines) ? medicines : [],
					}
				}),
			)

			setTimeline(
				enriched.map(({ record, orders, medicines }) => toTimelineRecord(record, orders, medicines)),
			)

			const firstPet = enriched[0]?.record?.pet
			if (firstPet) {
				setPetSummary(toPetSummary(firstPet))
			}
		} catch (error) {
			setTimeline([])
			setPetSummary(DEFAULT_PET)
			message.error(error?.message || 'Không thể tải hồ sơ chi tiết')
		} finally {
			setLoading(false)
		}
	}, [medicalId, petId, selectedRecord])

	useEffect(() => {
		loadMedicalTimeline()
	}, [loadMedicalTimeline])

	const petSubtitle = `${petSummary.breedText} · ${getAgeText(
		selectedRecord?.petDateOfBirth || (petSummary.birthday !== 'Chưa cập nhật' ? petSummary.birthday : ''),
	)} · ${petSummary.weight}`

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
							<UserOutlined />
						</div>
					)}

					<div>
						<h2>{petSummary.name}</h2>
						<p className={styles.petMeta}>{petSubtitle}</p>
						<p className={styles.petSubMeta}>
							<CalendarOutlined /> {petSummary.birthday} <span>•</span> {petSummary.gender}
						</p>
					</div>
				</div>

				<Button
					className={styles.backButton}
					onClick={() => navigate('/admin/veterinarian/listRecords')}
				>
					<ArrowLeftOutlined /> Quay lại
				</Button>
			</section>

			<section className={styles.timelinePanel}>
				<h3>
					<MedicineBoxOutlined /> Dòng thời gian sức khỏe
				</h3>

				{loading ? (
					<div className={styles.loadingWrap}>
						<Spin size="large" />
					</div>
				) : timeline.length === 0 ? (
					<div className={styles.emptyState}>Không có dữ liệu hồ sơ bệnh án để hiển thị.</div>
				) : (
					<div className={styles.timelineWrap}>
						{timeline.map((item, index) => (
							<div key={item.id} className={styles.timelineItem}>
								<div className={styles.timelineMarker}>{index + 1}</div>

								<div className={styles.timelineCard}>
									<div className={styles.cardHeader}>
										<h4>{item.title}</h4>
										<span className={`${styles.statusTag} ${styles[item.statusType]}`}>
											{item.status}
										</span>
									</div>

									<div className={styles.metaGrid}>
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

									<div className={styles.divider} />

									<div className={styles.detailsBlock}>
										{item.details.map((detail) => (
											<p key={`${item.id}-${detail.label}`}>
												<span>{detail.label}:</span> {detail.value}
											</p>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	)
}
