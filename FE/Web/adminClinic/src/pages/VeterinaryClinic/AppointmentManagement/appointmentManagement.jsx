import {
	FaRegBell,
	FaSearch,
	FaCalendarAlt,
	FaBookMedical,
	FaChartBar,
	FaUserMd,
	FaFileMedicalAlt,
	FaPaw,
	FaStethoscope,
	FaSyringe,
	FaTooth,
	FaCut,
	FaChevronLeft,
	FaChevronRight,
	FaCog,
} from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './appointmentManagement.module.css'

const menuItems = [
	{ key: 'appointments', label: 'Lịch hẹn', icon: FaCalendarAlt, path: '/clinic/appointments' },
	{ key: 'records', label: 'Sổ y tế điện tử', icon: FaBookMedical, path: '/clinic/medical-records' },
	{ key: 'revenue', label: 'Doanh thu', icon: FaChartBar, path: '/clinic/revenue' },
	{ key: 'doctors', label: 'Bác sĩ', icon: FaUserMd, path: '/clinic/doctors' },
	{ key: 'forms', label: 'Xem phiếu khám', icon: FaFileMedicalAlt, path: '/clinic/exam-slips' },
]

const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const calendarDays = [
	['28', '29', '30', '1', '2', '3', '4'],
	['5', '6', '7', '8', '9', '10', '11'],
	['12', '13', '14', '15', '16', '17', '18'],
	['19', '20', '21', '22', '23', '24', '25'],
]

const timeSlots = ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM']

const waitingList = [
	{
		petName: 'Milo (Poodle)',
		owner: 'Chủ: Nguyễn Văn A',
		time: '08:30 AM',
		date: '20/05/2024',
		service: 'Khám tổng quát',
		avatarText: 'M',
		icon: FaStethoscope,
	},
	{
		petName: 'Lu (Mèo Anh)',
		owner: 'Chủ: Trần Thị B',
		time: '09:15 AM',
		date: '20/05/2024',
		service: 'Tiêm ngừa 5 trong 1',
		avatarText: 'L',
		icon: FaSyringe,
	},
]

const inProgressList = [
	{
		petName: 'Bông (Phốc sóc)',
		owner: 'Chủ: Lê Văn C',
		time: '08:00 AM',
		date: '20/05/2024',
		service: 'Vệ sinh & Tỉa lông',
		avatarText: 'B',
		icon: FaCut,
		status: 'Đang thực hiện...',
	},
]

const completedList = [
	{
		petName: 'Vàng (Golden)',
		owner: 'Chủ: Phạm Văn D',
		time: '07:30 AM',
		date: '20/05/2024',
		service: 'Kiểm tra răng miệng',
		avatarText: 'V',
		icon: FaTooth,
		payment: 'ĐÃ THANH TOÁN',
	},
]

function AppointmentCard({ item, variant }) {
	const ServiceIcon = item.icon

	return (
		<article className={`${styles.card} ${variant === 'completed' ? styles.completedCard : ''}`}>
			<div className={styles.cardTop}>
				<div className={styles.petProfile}>
					<div className={styles.avatar}>{item.avatarText}</div>
					<div>
						<h4>{item.petName}</h4>
						<p>{item.owner}</p>
					</div>
				</div>
				<div className={styles.timeTags}>
					<span>{item.time}</span>
					<span>{item.date}</span>
				</div>
			</div>

			<div className={styles.cardBottom}>
				<div className={styles.serviceInfo}>
					<ServiceIcon />
					<span>{item.service}</span>
				</div>

				{item.status && <span className={styles.processText}>{item.status}</span>}
				{item.payment && <span className={styles.paymentText}>{item.payment}</span>}
			</div>
		</article>
	)
}

export default function AppointmentManagement() {
	const navigate = useNavigate()
	const location = useLocation()

	const isActiveMenu = (path) => location.pathname === path

	const goToMenu = (path) => {
		navigate(path)
	}

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
							const active = isActiveMenu(item.path)

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
						<div className={styles.profileAvatar}>T</div>
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
					<div className={styles.searchBox}>
						<FaSearch />
						<input type="text" value="Tìm kiếm thú cưng, khách hàng..." readOnly />
					</div>
					<button type="button" className={styles.notifyBtn} aria-label="Thông báo">
						<FaRegBell />
					</button>
				</header>

				<section className={styles.mainBody}>
					<h1>Bảng quản lý lịch khám</h1>
					<p>Chào mừng BS. Thắng, hôm nay bạn có 12 ca hẹn mới.</p>

					<h3>Chọn ngày & Giờ hẹn</h3>
					<div className={styles.bookingBoard}>
						<div className={styles.calendarBlock}>
							<div className={styles.calendarHeader}>
								<h4>Tháng 5, 2024</h4>
								<div className={styles.calendarActions}>
									<button type="button" aria-label="Tháng trước">
										<FaChevronLeft />
									</button>
									<button type="button" aria-label="Tháng sau">
										<FaChevronRight />
									</button>
								</div>
							</div>

							<div className={styles.calendarGrid}>
								{weekDays.map((day) => (
									<span key={day} className={styles.dayName}>
										{day}
									</span>
								))}

								{calendarDays.flat().map((day) => (
									<button
										key={day}
										type="button"
										className={`${styles.dayCell} ${day === '20' ? styles.activeDay : ''} ${
											day === '28' || day === '29' || day === '30' ? styles.prevMonthDay : ''
										}`}
									>
										{day}
									</button>
								))}
							</div>
						</div>

						<div className={styles.slotBlock}>
							<h4>Khung giờ</h4>
							<div className={styles.slotList}>
								{timeSlots.map((slot, index) => (
									<button
										key={slot}
										type="button"
										className={`${styles.slotBtn} ${index === 0 ? styles.activeSlot : ''}`}
									>
										{slot}
									</button>
								))}
							</div>
						</div>
					</div>

					<section className={styles.groupSection}>
						<div className={styles.groupColumn}>
							<h4>
								<span className={`${styles.dot} ${styles.grayDot}`} />
								Chờ khám
								<strong>5</strong>
							</h4>
							<div className={styles.cardList}>
								{waitingList.map((item) => (
									<AppointmentCard key={item.petName} item={item} variant="waiting" />
								))}
							</div>
						</div>

						<div className={styles.groupColumn}>
							<h4>
								<span className={`${styles.dot} ${styles.greenDot}`} />
								Đang khám
								<strong>3</strong>
							</h4>
							<div className={styles.cardList}>
								{inProgressList.map((item) => (
									<AppointmentCard key={item.petName} item={item} variant="in-progress" />
								))}
							</div>
						</div>

						<div className={styles.groupColumn}>
							<h4>
								<span className={`${styles.dot} ${styles.blueDot}`} />
								Hoàn tất
								<strong>4</strong>
							</h4>
							<div className={styles.cardList}>
								{completedList.map((item) => (
									<AppointmentCard key={item.petName} item={item} variant="completed" />
								))}
							</div>
						</div>
					</section>
				</section>
			</main>
		</div>
	)
}
