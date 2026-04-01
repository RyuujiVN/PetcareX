import { FileTextOutlined } from '@ant-design/icons'
import { Button, DatePicker, Empty, Select, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APPOINTMENT_STATUS, getClinicAppointmentsApi } from '../../../../data/Clinic/api/appointmentApi'
import { getClinicPetSpeciesApi } from '../../../../data/Clinic/api/petApi'
import {
	getAppointmentStatusLabel,
	getPetBreedLabel,
	getPetSpeciesLabel,
} from '../../../../utils/enumLabel'
import styles from './listPetExaminationRecords.module.css'

const normalizeDate = (dateValue) => {
	if (!dateValue) return ''

	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return ''

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}


const getAgeLabel = (dateOfBirth) => {
	if (!dateOfBirth) return 'Chưa rõ tuổi'

	const birthDate = new Date(dateOfBirth)
	if (Number.isNaN(birthDate.getTime())) return 'Chưa rõ tuổi'

	const now = new Date()
	let years = now.getFullYear() - birthDate.getFullYear()
	const monthDiff = now.getMonth() - birthDate.getMonth()

	if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
		years -= 1
	}

	if (years <= 0) {
		return 'Dưới 1 năm'
	}

	return `${years} tuổi`
}

const getStatusLabel = (status) => getAppointmentStatusLabel(status, status || 'Không xác định')

export default function ListPetExaminationRecords() {
	const navigate = useNavigate()
	const location = useLocation()
	const isVeterinarianPortal = location.pathname.startsWith('/veterinarian')
	const routePrefix = isVeterinarianPortal ? '/veterinarian' : '/clinic'
	const [records, setRecords] = useState([])
	const [loading, setLoading] = useState(false)
	const [loadingSpecies, setLoadingSpecies] = useState(false)
	const [selectedDate, setSelectedDate] = useState('')
	const [selectedSpecies, setSelectedSpecies] = useState('ALL')
	const [searchText, setSearchText] = useState('')
	const [speciesList, setSpeciesList] = useState([])

	const fetchSpecies = useCallback(async () => {
		try {
			setLoadingSpecies(true)
			const response = await getClinicPetSpeciesApi()
			setSpeciesList(Array.isArray(response) ? response : [])
		} catch {
			setSpeciesList([])
		} finally {
			setLoadingSpecies(false)
		}
	}, [])

	const fetchExaminationRecords = useCallback(async () => {
		try {
			setLoading(true)

			const response = await getClinicAppointmentsApi({
				page: 1,
				limit: 300,
				date: selectedDate || undefined,
			})

			const items = Array.isArray(response?.items) ? response.items : []
			const mappedItems = items
				.filter((item) => item?.status !== APPOINTMENT_STATUS.CANCELLED)
				.map((item) => {
					const speciesRaw = item?.pet?.species || ''
					const speciesLabel = getPetSpeciesLabel(speciesRaw, 'Không xác định')
					const breedLabel = getPetBreedLabel(item?.pet?.breed, speciesRaw, '')

					return {
						id: item?.id,
						petId: item?.pet?.id || '',
						ownerId: item?.pet?.owner?.id || '',
						appointmentDate: item?.appointmentDate,
						appointmentTime: item?.appointmentTime,
						status: item?.status,
						statusLabel: getStatusLabel(item?.status),
						service: item?.service || 'Không xác định',
						petName: item?.pet?.name || 'Không rõ tên thú cưng',
						petAvatar: item?.pet?.avatar || '',
						speciesRaw,
						speciesLabel,
						breed: breedLabel,
						ownerName: item?.pet?.owner?.fullName || 'Không rõ chủ nuôi',
						ageLabel: getAgeLabel(item?.pet?.dateOfBirth),
						note: item?.note || 'Không có ghi chú',
						dateKey: normalizeDate(item?.appointmentDate),
					}
				})

			setRecords(mappedItems)
			setSelectedSpecies((current) => {
				if (current === 'ALL') return current
				const existsInBackend = speciesList.includes(current)
				const existsInRecords = mappedItems.some((item) => item.speciesRaw === current)
				return existsInBackend || existsInRecords ? current : 'ALL'
			})
		} catch (error) {
			message.error(error.message || 'Không thể tải danh sách thú cưng khám bệnh')
			setRecords([])
		} finally {
			setLoading(false)
		}
	}, [selectedDate, speciesList])

	useEffect(() => {
		fetchSpecies()
	}, [fetchSpecies])

	useEffect(() => {
		fetchExaminationRecords()
	}, [fetchExaminationRecords])

	const speciesOptions = useMemo(() => {
		const dataSpecies = [...new Set(records.map((item) => item.speciesRaw).filter(Boolean))]
		const availableSpecies = speciesList.length > 0 ? speciesList : dataSpecies

		return [
			{ style: {height: 30, display: 'flex', alignItems: 'center'}, label: 'Tất cả loài', value: 'ALL'},
				...availableSpecies.map((item) => ({ label: getPetSpeciesLabel(item, 'Không xác định'), value: item })),
		]
	}, [records, speciesList])

	const visibleRecords = useMemo(() => {
		const keyword = searchText.trim().toLowerCase()

		return records.filter((item) => {
			if (selectedSpecies !== 'ALL' && item.speciesRaw !== selectedSpecies) {
				return false
			}

			if (selectedDate && item.dateKey !== selectedDate) {
				return false
			}

			if (keyword) {
				const searchable = [item.petName, item.ownerName, item.speciesLabel, item.breed].join(' ').toLowerCase()
				if (!searchable.includes(keyword)) {
					return false
				}
			}

			return true
		})
	}, [records, searchText, selectedDate, selectedSpecies])

	const openRecordDetail = (record) => {
		if (!record?.id) {
			message.warning('Không tìm thấy thông tin phiếu khám để mở')
			return
		}

		navigate(`${routePrefix}/exam-slips/${record.id}`, {
			state: {
				record,
			},
		})
	}

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<div className={styles.titleBlock}>
					<h1 style={{fontSize: 25}}>Danh sách thú cưng</h1>
				</div>
			</header>

			<section className={styles.content}>


				<div className={styles.filtersRow}>
					<Select
						className={styles.speciesSelect}
						value={selectedSpecies}
						onChange={setSelectedSpecies}
						options={speciesOptions}
						loading={loadingSpecies}
					/>

					<DatePicker
						className={styles.datePicker}
						format="DD/MM/YYYY"
						placeholder="Chọn ngày"
						value={selectedDate ? dayjs(selectedDate) : null}
						onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
						allowClear
					/>
				</div>

				{loading ? (
					<div className={styles.loadingState}>
						<Spin size="large" />
					</div>
				) : visibleRecords.length === 0 ? (
					<div className={styles.emptyState}>
						<Empty
							description={
								<>
									<div className={styles.emptyTitle}>Không có thú cưng phù hợp</div>
									<div className={styles.emptyDescription}>Vui lòng đổi ngày hoặc bộ lọc loài để xem dữ liệu khác.</div>
								</>
							}
						/>
					</div>
				) : (
					<div className={styles.cardsGrid}>
						{visibleRecords.map((record) => (
							<article key={record.id} className={styles.petCard}>
								<div className={styles.petImageWrap}>
									{record.petAvatar ? (
										<img src={record.petAvatar} alt={record.petName} className={styles.petImage} />
									) : (
										<div className={styles.petImagePlaceholder}>{record.petName.charAt(0).toUpperCase()}</div>
									)}
								</div>

								<div className={styles.cardBody}>
									<div className={styles.petHeaderRow}>
										<h3 style={{fontSize: 23}}>Tên: {record.petName}</h3>
										<span className={styles.ageBadge}>Tuổi: {record.ageLabel}</span>
									</div>

									<p style={{fontSize: 16}} className={styles.speciesText}>Loài: {record.breed || record.speciesLabel}</p>
									<p style={{fontSize: 16}} className={styles.ownerText}>Chủ nuôi: {record.ownerName}</p>

									<Button type="default" className={styles.viewButton} onClick={() => openRecordDetail(record)}>
										<FileTextOutlined />
										<span>Xem phiếu khám</span>
									</Button>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	)
}
