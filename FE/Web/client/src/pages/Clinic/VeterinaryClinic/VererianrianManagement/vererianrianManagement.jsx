import { SearchOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaEnvelope, FaPhone, FaPlus } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import useVeterinarians from '../../../../hooks/Clinic/useVeterinarians'
import styles from './vererianrianManagement.module.css'

const PAGE_SIZE = 12

const defaultDoctorImage =
	'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=960&q=80'

export default function VeterinarianManagement() {
	const { t } = useTranslation('clinic')
	const navigate = useNavigate()
	const [messageApi, contextHolder] = message.useMessage()
	const filterItems = useMemo(
		() => [
			{ label: t('veterinarians.management.filters.all'), specialty: '' },
			{ label: t('veterinarians.management.filters.internalMedicine'), specialty: 'INTERNAL_MEDICINE' },
			{ label: t('veterinarians.management.filters.surgery'), specialty: 'SURGERY' },
			{ label: t('veterinarians.management.filters.ultrasound'), specialty: 'ULTRASOUND' },
			{ label: t('veterinarians.management.filters.vaccination'), specialty: 'VACCINATION_AND_PREVENTION' },
		],
		[t],
	)
	const [selectedFilter, setSelectedFilter] = useState('')
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
			name: item?.user?.fullName || t('veterinarians.common.notUpdated'),
			specialty: item?.specialty
				? t(`enums.veterinarySpecialty.${item.specialty}`, {
					defaultValue: t('veterinarians.common.notUpdated'),
				})
				: t('veterinarians.common.notUpdated'),
			phone: item?.user?.phone || t('veterinarians.common.notUpdated'),
			email: item?.user?.email || t('veterinarians.common.notUpdated'),
			status: item?.user?.deleted
				? t('veterinarians.management.status.inactive')
				: t('veterinarians.management.status.active'),
			statusType: item?.user?.deleted ? 'leave' : 'ready',
			image: item?.user?.avatarUrl || defaultDoctorImage,
			raw: item,
		}))
	}, [t, veterinarians])

	const handleOpenInformation = (doctor) => {
		sessionStorage.setItem('selectedVeterinarian', JSON.stringify(doctor.raw))
		navigate('/clinic/veterinarians/information', {
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
						placeholder={t('veterinarians.management.searchPlaceholder')}
						value={searchValue}
						onChange={(event) => setSearchValue(event.target.value)}
					/>
				</div>
				<div className={styles.topBarActionSpacer} aria-hidden="true" />
			</header>

			<section className={styles.content}>
				<div className={styles.stickyPanel}>
					<div className={styles.titleRow}>
						<div>
							<h1 style={{fontSize: 25, fontWeight: 'bold'}}>{t('veterinarians.management.title')}</h1>
							<p>{t('veterinarians.management.subtitle')}</p>
						</div>

						<button
							type="button"
							className={styles.addButton}
							onClick={() => navigate('/clinic/veterinarians/add-new')}
						>
							<FaPlus /> {t('veterinarians.management.addButton')}
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
						<div className={styles.stateText}>{t('veterinarians.management.states.loading')}</div>
					)}

					{!loading && error && <div className={styles.stateText}>{error}</div>}

					{!loading && !error && doctors.length === 0 && (
						<div className={styles.stateText}>{t('veterinarians.management.states.empty')}</div>
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
										<FaPhone /> {doctor.phone}
									</span>
									<span className={`${styles.statusInline} ${styles[doctor.statusType]}`}>
										<span className={styles.statusDot} aria-hidden="true" />
										<span>{doctor.status}</span>
									</span>
								</div>

								<p className={styles.phone}>
									<FaEnvelope /> {doctor.email}
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
						{t('veterinarians.management.pagination.prev')}
					</button>
					<span className={styles.paginationText}>
						{t('veterinarians.management.pagination.summary', {
							current: pagination.currentPage || currentPage,
							total: pagination.totalPages || 1,
						})}
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
						{t('veterinarians.management.pagination.next')}
					</button>
				</div>
			</section>
		</div>
	)
}
