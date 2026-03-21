import {
	FaPaw,
	FaCalendarAlt,
	FaBookMedical,
	FaChartBar,
	FaUserMd,
	FaFileMedicalAlt,
	FaCog,
	FaRegBell,
	FaInfoCircle,
	FaBirthdayCake,
	FaMars,
	FaChevronDown,
} from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './viewPetAppointment.module.css'

const menuItems = [
	{ key: 'appointments', label: 'Lịch hẹn', icon: FaCalendarAlt, path: '/clinic/appointments' },
	{ key: 'records', label: 'Sổ y tế điện tử', icon: FaBookMedical, path: '/clinic/medical-records' },
	{ key: 'revenue', label: 'Doanh thu', icon: FaChartBar, path: '/clinic/revenue' },
	{ key: 'doctors', label: 'Bác sĩ', icon: FaUserMd, path: '/clinic/doctors' },
	{ key: 'forms', label: 'Xem phiếu khám', icon: FaFileMedicalAlt, path: '/clinic/exam-slips' },
]

export default function ViewPetAppointment() {
	const navigate = useNavigate()
	const location = useLocation()

	const goToMenu = (path) => {
		navigate(path)
	}

	const isActiveMenu = (path) => location.pathname === path || location.pathname === '/clinic/view-pet-appointment'

	return (
		<div className={styles.page}>
			<aside className={styles.sidebar}>
				<div>
					<div className={styles.brandBox}>
						<div className={styles.brandIcon}>
							<FaPaw />
						</div>
						<div>
							<h2>PetCar</h2>
							<p>Quản lý phòng khám</p>
						</div>
					</div>

					<nav className={styles.menu}>
						{menuItems.map((item) => {
							const Icon = item.icon
							const active = item.key === 'appointments' && isActiveMenu(item.path)

							return (
								<button
									key={item.key}
									type="button"
									className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
									onClick={() => goToMenu(item.path)}
								>
									<Icon />
									<span>{item.label}</span>
								</button>
							)
						})}
					</nav>
				</div>

				<div className={styles.profileBox}>
					<div className={styles.profileInfo}>
						<div className={styles.profileAvatar}>BS</div>
						<div>
							<h4>BS. Hữu Thắng</h4>
							<p>Quản trị viên</p>
						</div>
					</div>
					<button type="button" className={styles.settingBtn} aria-label="Cài đặt">
						<FaCog />
					</button>
				</div>
			</aside>

			<main className={styles.content}>
				<header className={styles.topBar}>
					<h1>Thông tin thú cưng</h1>
					<button type="button" className={styles.notifyBtn} aria-label="Thông báo">
						<FaRegBell />
					</button>
				</header>

				<section className={styles.petSummary}>
					<div className={styles.petAvatar} aria-hidden="true" />
					<div className={styles.petMeta}>
						<div className={styles.petNameRow}>
							<h2>Lu Lu</h2>
							<span className={styles.statusDot} />
						</div>
						<p>Mèo Anh lông ngắn · 3 tuổi · 15 kg</p>
						<div className={styles.petSubInfo}>
							<span>
								<FaBirthdayCake /> 15/05/2021
							</span>
							<span>
								<FaMars /> Đực
							</span>
						</div>
					</div>
				</section>

				<section className={styles.formWrap}>
					<div className={styles.formTitle}>
						<FaInfoCircle />
						<h3>Thông tin thú cưng</h3>
					</div>

					<div className={styles.formGrid}>
						<div className={styles.field}>
							<label htmlFor="petName">Tên thú cưng</label>
							<input id="petName" type="text" value="Lu Lu" readOnly />
						</div>

						<div className={styles.field}>
							<label htmlFor="petType">Loài</label>
							<div className={styles.selectWrap}>
								<input id="petType" type="text" value="Mèo nhà" readOnly />
								<FaChevronDown />
							</div>
						</div>

						<div className={styles.field}>
							<label htmlFor="petBreed">Giống</label>
							<input id="petBreed" type="text" value="Mèo Anh lông ngắn" readOnly />
						</div>

						<div className={styles.field}>
							<label>Giới tính</label>
							<div className={styles.genderRow}>
								<label className={`${styles.genderOption} ${styles.genderOptionActive}`}>
									<input type="radio" name="gender" checked readOnly />
									<span>Đực</span>
								</label>
								<label className={styles.genderOption}>
									<input type="radio" name="gender" readOnly />
									<span>Cái</span>
								</label>
							</div>
						</div>

						<div className={styles.field}>
							<label htmlFor="petAge">Ngày sinh / Tuổi</label>
							<input id="petAge" type="text" value="3 tuổi" readOnly />
						</div>

						<div className={styles.field}>
							<label htmlFor="petWeight">Cân nặng (kg)</label>
							<input id="petWeight" type="text" value="15 kg" readOnly />
						</div>
					</div>

					<div className={styles.field}>
						<label htmlFor="petMarks">Màu lông / Đặc điểm nhận dạng</label>
						<textarea id="petMarks" value="Có đốm đen ở tai" readOnly />
					</div>

					<div className={`${styles.field} ${styles.ownerField}`}>
						<label htmlFor="ownerName">Tên chủ thú cưng</label>
						<input id="ownerName" type="text" value="Trương Công Thành" readOnly />
					</div>

					<div className={styles.actions}>
						<button type="button" className={styles.cancelBtn} onClick={() => navigate('/clinic/appointments')}>
							Hủy
						</button>
						<button type="button" className={styles.doneBtn} onClick={() => navigate('/clinic/appointments')}>
							Xong
						</button>
					</div>
				</section>
			</main>
		</div>
	)
}
