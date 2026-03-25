import { FaBell, FaMapMarkerAlt, FaPlus } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import styles from './veterinarianManagement.module.css'

const filterItems = ['Tất cả bác sĩ', 'Nội khoa', 'Ngoại khoa', 'Chẩn đoán hình ảnh', 'Tiêm chủng']

const doctors = [
	{
		name: 'BS. Nguyễn Văn A',
		specialty: 'CHUYÊN KHOA NỘI',
		years: '8 năm kinh nghiệm',
		phone: '0321564789',
		status: 'SẴN SÀNG',
		statusType: 'ready',
		image:
			'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=960&q=80',
	},
	{
		name: 'BS. Trần Thị B',
		specialty: 'CHUYÊN KHOA NGOẠI',
		years: '5 năm kinh nghiệm',
		phone: '0321564789',
		status: 'ĐANG BẬN',
		statusType: 'busy',
		image:
			'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=960&q=80',
	},
	{
		name: 'BS. Lê Văn C',
		specialty: 'CHUYÊN KHOA NỘI',
		years: '10 năm kinh nghiệm',
		phone: '0321564789',
		status: 'SẴN SÀNG',
		statusType: 'ready',
		image:
			'https://images.unsplash.com/photo-1603415526960-f8fbc341c9f6?auto=format&fit=crop&w=960&q=80',
	},
	{
		name: 'BS. Phạm Hoài D',
		specialty: 'CĐ HÌNH ẢNH',
		years: '4 năm kinh nghiệm',
		phone: '0321564789',
		status: 'NGHỈ PHÉP',
		statusType: 'leave',
		image:
			'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=960&q=80',
	},
	{
		name: 'BS. Hoàng Xuân E',
		specialty: 'CHUYÊN KHOA NGOẠI',
		years: '12 năm kinh nghiệm',
		phone: '0321564789',
		status: 'ĐANG BẬN',
		statusType: 'busy',
		image:
			'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=960&q=80',
	},
	{
		name: 'BS. Đặng Thu F',
		specialty: 'CHUYÊN KHOA NỘI',
		years: '3 năm kinh nghiệm',
		phone: '0321564789',
		status: 'SẴN SÀNG',
		statusType: 'ready',
		image:
			'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=960&q=80',
	},
]

export default function VeterinarianManagement() {
	const navigate = useNavigate()

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<div className={styles.searchBox}>
					<input type="text" placeholder="Tìm kiếm thú cưng, khách hàng..." value="" readOnly />
				</div>
				<button type="button" className={styles.notificationButton} aria-label="Thông báo">
					<FaBell />
				</button>
			</header>

			<section className={styles.content}>
				<div className={styles.titleRow}>
					<div>
						<h1>Đội ngũ Bác sĩ</h1>
						<p>Quản lý và theo dõi hiệu suất làm việc của các chuyên gia.</p>
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
					{filterItems.map((item, index) => (
						<button
							key={item}
							type="button"
							className={`${styles.filterButton} ${index === 0 ? styles.filterButtonActive : ''}`}
						>
							{item}
						</button>
					))}
				</div>

				<div className={styles.cardGrid}>
					{doctors.map((doctor) => (
						<article
							key={doctor.name}
							className={`${styles.card} ${styles.cardInteractive}`}
							onClick={() => navigate('/admin/clinic/veterinarians/information')}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault()
									navigate('/admin/clinic/veterinarians/information')
								}
							}}
							role="button"
							tabIndex={0}
						>
							<img src={doctor.image} alt={doctor.name} className={styles.cardImage} loading="lazy" />
							<div className={styles.cardBody}>
								<h3>{doctor.name}</h3>
								<p className={styles.specialty}>{doctor.specialty}</p>

								<div className={styles.infoLine}>
									<span className={styles.metaText}>
										<FaMapMarkerAlt /> {doctor.years}
									</span>
									<span className={`${styles.statusBadge} ${styles[doctor.statusType]}`}>{doctor.status}</span>
								</div>

								<p className={styles.phone}>
									<FaMapMarkerAlt /> {doctor.phone}
								</p>
							</div>
						</article>
					))}
				</div>
			</section>
		</div>
	)
}
