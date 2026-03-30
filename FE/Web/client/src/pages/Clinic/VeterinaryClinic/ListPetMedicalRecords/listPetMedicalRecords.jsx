import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Button, DatePicker, Empty, Input, Pagination, Select, Spin, Tag, Tooltip, message } from 'antd'
import { CalendarOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { APPOINTMENT_STATUS, getClinicAppointmentsApi } from '../../../../data/Clinic/api/appointmentApi'
import { getClinicPetSpeciesApi } from '../../../../data/Clinic/api/petApi'
import styles from './listPetMedicalRecords.module.css'

const PAGE_SIZE = 8

const normalizeDate = (dateValue) => {
	if (!dateValue) return ''

	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return ''

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}

const formatDisplayDate = (dateValue) => {
	if (!dateValue) return 'Chưa cập nhật'
	return new Date(dateValue).toLocaleDateString('vi-VN')
}

const formatDisplayTime = (timeValue) => (timeValue || '').slice(0, 5)

const formatEnumLabel = (value) => {
	if (!value) return 'Không xác định'

	return String(value)
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatSpeciesLabel = (species, breed) => {
	const speciesLabel = formatEnumLabel(species)
	const breedLabel = formatEnumLabel(breed)

	if (!breed || breedLabel === 'Không Xác Định') {
		return speciesLabel
	}

	return `${speciesLabel} (${breedLabel})`
}

const pickRevisitDate = (item) => {
	return item?.medical?.followUpDate || item?.followUpDate || item?.revisitDate || item?.appointmentDate || ''
}

const sortByTimeAsc = (a, b) => {
	const timeA = formatDisplayTime(a?.appointmentTime)
	const timeB = formatDisplayTime(b?.appointmentTime)

	if (!timeA && !timeB) return 0
	if (!timeA) return 1
	if (!timeB) return -1

	return timeA.localeCompare(timeB)
}

export default function ListPetMedicalRecords() {
	const navigate = useNavigate()
	const location = useLocation()
	const isVeterinarianPortal = location.pathname.startsWith('/veterinarian')
	const routePrefix = isVeterinarianPortal ? '/veterinarian' : '/clinic'
	const [loading, setLoading] = useState(false)
	const [loadingSpecies, setLoadingSpecies] = useState(false)
	const [searchText, setSearchText] = useState('')
	const [selectedSpecies, setSelectedSpecies] = useState('ALL')
	const [selectedDate, setSelectedDate] = useState(dayjs())
	const [currentPage, setCurrentPage] = useState(1)
	const [petRows, setPetRows] = useState([])
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

	const fetchMedicalRecordPets = useCallback(async () => {
		try {
			setLoading(true)

			const response = await getClinicAppointmentsApi({
				page: 1,
				limit: 500,
				date: selectedDate.format('YYYY-MM-DD'),
			})

			const items = Array.isArray(response?.items) ? response.items : []
			const activeItems = items.filter((item) => item?.status !== APPOINTMENT_STATUS.CANCELLED)
			const groupedByPet = new Map()

			activeItems.forEach((item) => {
				const petId = item?.pet?.id
				if (!petId) return

				const currentGroup = groupedByPet.get(petId) || []
				currentGroup.push(item)
				groupedByPet.set(petId, currentGroup)
			})

			const mappedRows = Array.from(groupedByPet.entries()).map(([petId, appointments]) => {
				const sortedAppointments = [...appointments].sort(sortByTimeAsc)
				const firstAppointment = sortedAppointments[0] || {}
				const pet = firstAppointment?.pet || {}
				const owner = pet?.owner || {}

				return {
					key: String(petId),
					appointmentId: firstAppointment?.id || '',
					medicalId: firstAppointment?.medical?.id || '',
					petId: String(petId),
					name: pet?.name || 'Không rõ tên',
					avatar: pet?.avatar || '',
					breed: pet?.breed || '',
					species: pet?.species || '',
					speciesLabel: formatSpeciesLabel(pet?.species, pet?.breed),
					dateOfBirth: pet?.dateOfBirth || '',
					gender: pet?.gender,
					weight: pet?.weight,
					ownerName: owner?.fullName || 'Không rõ chủ nuôi',
					ownerPhone: owner?.phone || 'Chưa cập nhật',
					appointmentSummary: sortedAppointments
						.map((appointment) => {
							const time = formatDisplayTime(appointment?.appointmentTime)
							return time || '--:--'
						})
						.join(', '),
					revisitDateRaw: pickRevisitDate(firstAppointment),
					revisitDateLabel: formatDisplayDate(pickRevisitDate(firstAppointment)),
					totalAppointments: sortedAppointments.length,
					dateKey: normalizeDate(firstAppointment?.appointmentDate),
				}
			})

			setPetRows(mappedRows)
			setSelectedSpecies((current) => {
				if (current === 'ALL') return current
				const existsInBackend = speciesList.includes(current)
				const existsInRows = mappedRows.some((row) => row.species === current)
				return existsInBackend || existsInRows ? current : 'ALL'
			})
		} catch (error) {
			setPetRows([])
			message.error(error.message || 'Không thể tải danh sách sổ y tế điện tử')
		} finally {
			setLoading(false)
		}
	}, [selectedDate, speciesList])

	useEffect(() => {
		fetchSpecies()
	}, [fetchSpecies])

	useEffect(() => {
		fetchMedicalRecordPets()
	}, [fetchMedicalRecordPets])

	const speciesOptions = useMemo(() => {
		const dataSpecies = [...new Set(petRows.map((item) => item.species).filter(Boolean))]
		const availableSpecies = speciesList.length > 0 ? speciesList : dataSpecies

		return [
			{ label: 'Tất cả loài', value: 'ALL' },
			...availableSpecies.map((item) => ({ label: formatEnumLabel(item), value: item })),
		]
	}, [petRows, speciesList])

	const filteredRows = useMemo(() => {
		const keyword = searchText.trim().toLowerCase()

		return petRows.filter((row) => {
			if (selectedSpecies !== 'ALL' && row.species !== selectedSpecies) {
				return false
			}

			if (keyword) {
				const searchable = [row.petId, row.name, row.ownerName].join(' ').toLowerCase()
				if (!searchable.includes(keyword)) {
					return false
				}
			}

			return true
		})
	}, [petRows, searchText, selectedSpecies])

	const paginatedRows = useMemo(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE
		return filteredRows.slice(startIndex, startIndex + PAGE_SIZE)
	}, [currentPage, filteredRows])

	useEffect(() => {
		setCurrentPage(1)
	}, [searchText, selectedSpecies, selectedDate])

	const onOpenMedicalRecord = (row) => {
		if (!row?.petId) {
			message.warning('Không tìm thấy thú cưng để mở sổ y tế')
			return
		}

		const searchParams = new URLSearchParams({
			petId: row.petId,
		})

		if (row.medicalId) {
			searchParams.set('medicalId', row.medicalId)
		}

		navigate(`${routePrefix}/medical-records/view?${searchParams.toString()}`, {
			state: {
				record: row,
			},
		})
	}

	return (
		<div className={styles.content}>
			<header className={styles.topHeader}>
				<h1>Hồ sơ y tế điện tử của thú cưng</h1>
			</header>

			<section className={styles.mainPanel}>
				<div className={styles.toolbar}>
					<Input
						className={styles.searchBox}
						placeholder="Tìm theo ID, tên thú cưng hoặc tên chủ nuôi..."
						prefix={<SearchOutlined />}
						value={searchText}
						onChange={(event) => setSearchText(event.target.value)}
						allowClear
					/>

					<Select
						className={styles.filterSelect}
						value={selectedSpecies}
						onChange={setSelectedSpecies}
						options={speciesOptions}
						loading={loadingSpecies}
					/>

					<DatePicker
						className={styles.datePicker}
						value={selectedDate}
						onChange={(value) => setSelectedDate(value || dayjs())}
						format="DD/MM/YYYY"
						allowClear={false}
						suffixIcon={<CalendarOutlined />}
					/>
				</div>

				{loading ? (
					<div className={styles.loadingWrap}>
						<Spin size="large" />
					</div>
				) : filteredRows.length === 0 ? (
					<div className={styles.emptyWrap}>
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
					<div className={styles.tableWrap}>
						<table>
							<thead>
								<tr>
									<th>ID & THÚ CƯNG</th>
									<th>LOÀI</th>
									<th>CHỦ NUÔI</th>
									<th>NGÀY KHÁM</th>
									<th>NGÀY TÁI KHÁM</th>
									<th>THAO TÁC</th>
								</tr>
							</thead>
							<tbody>
								{paginatedRows.map((row) => (
									<tr key={row.key}>
										<td>
											<div className={styles.petCell}>
												<div className={styles.petAvatar} aria-hidden="true">
													{row.avatar ? <img src={row.avatar} alt={row.name} /> : row.name.charAt(0).toUpperCase()}
												</div>
												<div className={styles.infoBlock}>
													<strong>{row.name}</strong>
													<p>#{row.petId}</p>
												</div>
											</div>
										</td>
										<td>{row.speciesLabel}</td>
										<td>
											<div className={styles.infoBlock}>
												<strong>{row.ownerName}</strong>
												<p>{row.ownerPhone}</p>
											</div>
										</td>
										<td>
											<div className={styles.infoBlock}>
												<strong>{row.appointmentSummary}</strong>
												<p>{`${row.totalAppointments} lịch hẹn`}</p>
											</div>
										</td>
										<td>
											<Tag style={{marginLeft: 15}}color="blue">{row.revisitDateLabel}</Tag>
										</td>
										<td>
											<div className={styles.actionBtns}>
												<Tooltip title="Xem sổ y tế">
													<Button type="text" icon={<EyeOutlined />} onClick={() => onOpenMedicalRecord(row)} />
												</Tooltip>
												{/* <Tooltip title="Cập nhật sổ y tế">
													<Button type="text" icon={<EditOutlined />} onClick={() => onOpenMedicalRecord(row)} />
												</Tooltip> */}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className={styles.paginationWrap}>
							<Pagination
								current={currentPage}
								total={filteredRows.length}
								pageSize={PAGE_SIZE}
								onChange={(page) => setCurrentPage(page)}
								showSizeChanger={false}
							/>
						</div>
					</div>
				)}
			</section>
		</div>
	)
}
