import { useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { FaBell, FaMapMarkerAlt, FaPlus } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import useVeterinarians from '../../../../data/adminClinic/api/useVeterinarians'
import { getSpecialtyLabel } from '../../../../constants/veterinaryLabels'
import styles from './vererianrianManagement.module.css'
import { SearchOutlined } from '@ant-design/icons'

const PAGE_SIZE = 12

const filterItems = [
	{ label: 'Tất cả bác sĩ', specialty: '' },
	{ label: getSpecialtyLabel('INTERNAL_MEDICINE', 'vi'), specialty: 'INTERNAL_MEDICINE' },
	{ label: getSpecialtyLabel('SURGERY', 'vi'), specialty: 'SURGERY' },
	{ label: getSpecialtyLabel('ULTRASOUND', 'vi'), specialty: 'ULTRASOUND' },
	{ label: getSpecialtyLabel('VACCINATION_AND_PREVENTION', 'vi'), specialty: 'VACCINATION_AND_PREVENTION' },
]

const defaultDoctorImage =
	'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=960&q=80'

export default function VeterinarianManagement() {
	const navigate = useNavigate()
	const [messageApi, contextHolder] = message.useMessage()
	const [selectedFilter, setSelectedFilter] = useState(filterItems[0].specialty)
	const [searchValue, setSearchValue] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [currentPage, setCurrentPage] = useState(1)

	const { veterinarians, loading, error, pagination, fetchVeterinarians } = useVeterinarians()

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearch(searchValue.trim())
		}, 400)

		return () => window.clearTimeout(timer)
	}, [searchValue])

	useEffect(() => {
		setCurrentPage(1)
	}, [selectedFilter, debouncedSearch])

	useEffect(() => {
		fetchVeterinarians({
			page: currentPage,
			size: PAGE_SIZE,
			search: debouncedSearch,
			specialty: selectedFilter,
		}).catch(() => {})
	}, [currentPage, debouncedSearch, fetchVeterinarians, selectedFilter])

	useEffect(() => {
		const flash = sessionStorage.getItem('veterinarianFlashMessage')
		if (!flash) return

		messageApi.success(flash)
		sessionStorage.removeItem('veterinarianFlashMessage')
	}, [messageApi])

	const doctors = useMemo(() => {
		return veterinarians.map((item) => ({
			userId: item?.userId,
			name: item?.user?.fullName || 'Chưa cập nhật',
			specialty: getSpecialtyLabel(item?.specialty, 'vi'),
			phone: item?.user?.phone || 'Chưa cập nhật',
			email: item?.user?.email || 'Chưa cập nhật',
			statusType: item?.user?.deleted ? 'leave' : 'ready',
			image: item?.user?.avatarUrl || defaultDoctorImage,
			raw: item,
		}))
	}, [veterinarians])

	const handleOpenInformation = (doctor) => {
		sessionStorage.setItem('selectedVeterinarian', JSON.stringify(doctor.raw))
		navigate('/admin/clinic/veterinarians/information', {
			state: { veterinarian: doctor.raw },
		})
	}

	return (
		<div className={styles.page}>
			{contextHolder}
			<header className={styles.topBar}>
				<div className={styles.searchBox}>
					<SearchOutlined />
					<input
						type="text"
						placeholder="Tìm kiếm bác sĩ theo tên, email..."
						value={searchValue}
						onChange={(event) => setSearchValue(event.target.value)}
					/>
				</div>
				<button type="button" className={styles.notificationButton} aria-label="Thông báo">
					<FaBell />
				</button>
			</header>

			<section className={styles.content}>
				<div className={styles.stickyPanel}>
					<div className={styles.titleRow}>
						<div>
							<h1 style={{fontSize: 25, fontWeight: 'bold'}}>Đội ngũ Bác sĩ</h1>
							<p>Quản lý danh sách bác sĩ của phòng khám.</p>
						</div>

						<button
							type="button"
							className={styles.addButton}
							onClick={() => navigate('/admin/clinic/veterinarians/add-new')}
						>
							<FaPlus /> Thêm bác sĩ mới
						</button>
					</div>

					<div className={styles.filterRow}>
						{filterItems.map((item) => (
							<button
								style={{fontSize: 12}}
								key={item.label}
								type="button"
								className={`${styles.filterButton} ${selectedFilter === item.specialty ? styles.filterButtonActive : ''}`}
								onClick={() => setSelectedFilter(item.specialty)}
							>
								{item.label}
							</button>
						))}
					</div>
				</div>

				<div className={styles.cardGrid}>
					{loading && (
						<div className={styles.stateText}>Đang tải danh sách bác sĩ...</div>
					)}

					{!loading && error && <div className={styles.stateText}>{error}</div>}

					{!loading && !error && doctors.length === 0 && (
						<div className={styles.stateText}>Không có bác sĩ phù hợp với bộ lọc hiện tại</div>
					)}

					{!loading &&
						!error &&
						doctors.map((doctor) => (
						<article
							key={doctor.userId || doctor.name}
							className={`${styles.card} ${styles.cardInteractive}`}
							onClick={() => handleOpenInformation(doctor)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault()
									handleOpenInformation(doctor)
								}
							}}
							role="button"
							tabIndex={0}
						>
							<img src={doctor.image} alt={doctor.name} className={styles.cardImage} loading="lazy" />
							<div className={styles.cardBody}>
								<h3 style={{fontSize: 24, fontWeight: 'bold'}}>{doctor.name}</h3>
								<p className={styles.specialty}>{doctor.specialty}</p>

								<div className={styles.infoLine}>
									<span className={styles.metaText}>
										<FaMapMarkerAlt /> {doctor.phone}
									</span>
									<span className={`${styles.statusBadge} ${styles[doctor.statusType]}`}>{doctor.status}</span>
								</div>

								<p className={styles.phone}>
									<FaMapMarkerAlt /> {doctor.email}
								</p>
							</div>
						</article>
						))}
				</div>

				<div className={styles.paginationRow}>
					<button
						type="button"
						className={styles.filterButton}
						onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
						disabled={loading || currentPage <= 1}
					>
						Trang trước
					</button>
					<span className={styles.paginationText}>
						Trang {pagination.currentPage || currentPage}/{pagination.totalPages || 1}
					</span>
					<button
						type="button"
						className={styles.filterButton}
						onClick={() =>
							setCurrentPage((prev) =>
								Math.min(prev + 1, Math.max(pagination.totalPages || 1, 1)),
							)
						}
						disabled={loading || currentPage >= (pagination.totalPages || 1)}
					>
						Trang sau
					</button>
				</div>
			</section>
		</div>
	)
}
