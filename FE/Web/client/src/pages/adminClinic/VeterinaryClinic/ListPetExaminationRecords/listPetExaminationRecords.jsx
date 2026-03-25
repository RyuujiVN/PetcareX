import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { BellOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, DatePicker, Empty, Input, Select, Spin, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABEL, getClinicAppointmentsApi } from '../../../../data/adminClinic/api/appointmentApi'
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

const formatEnumLabel = (value) => {
	if (!value) return 'Không xác định'

	return String(value)
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatBreedLabel = (breed, species) => {
	const rawBreed = typeof breed === 'object' && breed !== null ? breed.name || breed.id || '' : breed || ''
	if (!rawBreed) return ''

	const rawValue = String(rawBreed).trim()
	const speciesPrefix = species ? `${String(species).trim()}_` : ''

	if (speciesPrefix && rawValue.startsWith(speciesPrefix)) {
		return formatEnumLabel(rawValue.slice(speciesPrefix.length))
	}

	const matchedPrefix = rawValue.match(/^[A-Z]+_/)
	if (matchedPrefix) {
		return formatEnumLabel(rawValue.slice(matchedPrefix[0].length))
	}

	return formatEnumLabel(rawValue)
}

const getAgeLabel = (dateOfBirth) => {
	if (!dateOfBirth) return 'N/A'

	const birthDate = new Date(dateOfBirth)
	if (Number.isNaN(birthDate.getTime())) return 'N/A'

	const now = new Date()
	let years = now.getFullYear() - birthDate.getFullYear()
	const monthDiff = now.getMonth() - birthDate.getMonth()

	if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
		years -= 1
	}

	if (years <= 0) {
		return 'Dưới 1 năm'
	}

	return `${years} Years`
}

const getStatusLabel = (status) => APPOINTMENT_STATUS_LABEL[status] || status || 'Không xác định'

export default function ListPetExaminationRecords() {
	const navigate = useNavigate()
	const [records, setRecords] = useState([])
	const [loading, setLoading] = useState(false)
	const [selectedDate, setSelectedDate] = useState('')
	const [selectedSpecies, setSelectedSpecies] = useState('ALL')
	const [searchText, setSearchText] = useState('')

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
					const speciesLabel = formatEnumLabel(item?.pet?.species)
					const breedLabel = formatBreedLabel(item?.pet?.breed, item?.pet?.species)

					return {
						id: item?.id,
						appointmentDate: item?.appointmentDate,
						appointmentTime: item?.appointmentTime,
						status: item?.status,
						statusLabel: getStatusLabel(item?.status),
						service: item?.service || 'Không xác định',
						petName: item?.pet?.name || 'Không rõ tên thú cưng',
						petAvatar: item?.pet?.avatar || '',
						species: speciesLabel,
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
				const hasSpecies = mappedItems.some((item) => item.species === current)
				return hasSpecies ? current : 'ALL'
			})
		} catch (error) {
			message.error(error.message || 'Không thể tải danh sách thú cưng khám bệnh')
			setRecords([])
		} finally {
			setLoading(false)
		}
	}, [selectedDate])

	useEffect(() => {
		fetchExaminationRecords()
	}, [fetchExaminationRecords])

	const speciesOptions = useMemo(() => {
		const uniqueSpecies = [...new Set(records.map((item) => item.species).filter(Boolean))]
		return [
			{ label: 'Tất cả loài', value: 'ALL' },
			...uniqueSpecies.map((item) => ({ label: item, value: item })),
		]
	}, [records])

	const visibleRecords = useMemo(() => {
		const keyword = searchText.trim().toLowerCase()

		return records.filter((item) => {
			if (selectedSpecies !== 'ALL' && item.species !== selectedSpecies) {
				return false
			}

			if (selectedDate && item.dateKey !== selectedDate) {
				return false
			}

			if (keyword) {
				const searchable = [item.petName, item.ownerName, item.species, item.breed].join(' ').toLowerCase()
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

		navigate(`/admin/clinic/exam-slips/${record.id}`, {
			state: {
				record,
			},
		})
	}

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<Input
					className={styles.searchBox}
					placeholder="Tìm kiếm thú cưng, khách hàng..."
					prefix={<SearchOutlined />}
					value={searchText}
					onChange={(event) => setSearchText(event.target.value)}
					allowClear
				/>

				<Button type="text" shape="circle" className={styles.notificationBtn} aria-label="Thông báo" icon={<BellOutlined />} />
			</header>

			<section className={styles.content}>
				<div className={styles.titleBlock}>
					<h1>Danh sách thú cưng</h1>
					<p>Các phiếu khám của thú cưng ở phòng khám</p>
				</div>

				<div className={styles.filtersRow}>
					<Select
						className={styles.speciesSelect}
						value={selectedSpecies}
						onChange={setSelectedSpecies}
						options={speciesOptions}
					/>

					<DatePicker
						className={styles.datePicker}
						format="DD/MM/YYYY"
						placeholder="Chọn ngày"
						value={selectedDate ? dayjs(selectedDate, 'YYYY-MM-DD') : null}
						onChange={(_, dateString) => setSelectedDate(Array.isArray(dateString) ? '' : dateString || '')}
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
										<h3>{record.petName}</h3>
										<span className={styles.ageBadge}>{record.ageLabel}</span>
									</div>

									<p className={styles.speciesText}>{record.breed || record.species}</p>
									<p className={styles.ownerText}>Chủ nuôi: {record.ownerName}</p>

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
