import {
	FaBookMedical,
	FaCalendarAlt,
	FaChartBar,
	FaCog,
	FaDog,
	FaEye,
	FaFileMedicalAlt,
	FaPaw,
	FaPencilAlt,
	FaSearch,
	FaSlidersH,
	FaUserMd,
} from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './listPetMedicalRecords.module.css'

const menuItems = [
	{ key: 'appointments', label: 'Lịch hẹn', icon: FaCalendarAlt, path: '/clinic/appointments' },
	{ key: 'records', label: 'Sổ y tế điện tử', icon: FaBookMedical, path: '/clinic/medical-records' },
	{ key: 'revenue', label: 'Doanh thu', icon: FaChartBar, path: '/clinic/revenue' },
	{ key: 'doctors', label: 'Bác sĩ', icon: FaUserMd, path: '/clinic/doctors' },
	{ key: 'forms', label: 'Xem phiếu khám', icon: FaFileMedicalAlt, path: '/clinic/exam-slips' },
]

const petRows = [
	{
		name: 'Milo',
		id: '#PET-0842',
		species: 'Chó (Golden)',
		owner: 'Nguyễn Văn An',
		phone: '090 123 4567',
		lastVisitDate: '12/10/2023',
		lastVisitNote: 'Tiêm ngừa định kỳ',
		status: 'Khỏe mạnh',
		statusType: 'healthy',
		avatarTone: 'toneGold',
	},
	{
		name: 'Luna',
		id: '#PET-1159',
		species: 'Mèo (Mướp)',
		owner: 'Trần Thị Bích',
		phone: '098 765 4321',
		lastVisitDate: '18/10/2023',
		lastVisitNote: 'Viêm tai ngoài',
		status: 'Đang điều trị',
		statusType: 'treating',
		avatarTone: 'toneBlue',
	},
	{
		name: 'Cooper',
		id: '#PET-0932',
		species: 'Chó (Poodle)',
		owner: 'Lê Hoàng Nam',
		phone: '093 333 9999',
		lastVisitDate: '20/10/2023',
		lastVisitNote: 'Xét nghiệm máu',
		status: 'Tái khám',
		statusType: 'revisit',
		avatarTone: 'toneYellow',
	},
	{
		name: 'Simba',
		id: '#PET-2204',
		species: 'Mèo (Anh)',
		owner: 'Phạm Minh Tuấn',
		phone: '091 222 8888',
		lastVisitDate: '21/10/2023',
		lastVisitNote: 'Phẫu thuật triệt sản',
		status: 'Nội trú',
		statusType: 'inpatient',
		avatarTone: 'toneGreen',
	},
	{
		name: 'Simba',
		id: '#PET-2204',
		species: 'Mèo (Anh)',
		owner: 'Phạm Minh Tuấn',
		phone: '091 222 8888',
		lastVisitDate: '21/10/2023',
		lastVisitNote: 'Phẫu thuật triệt sản',
		status: 'Nội trú',
		statusType: 'inpatient',
		avatarTone: 'toneGreen',
	},
	{
		name: 'Simba',
		id: '#PET-2204',
		species: 'Mèo (Anh)',
		owner: 'Phạm Minh Tuấn',
		phone: '091 222 8888',
		lastVisitDate: '21/10/2023',
		lastVisitNote: 'Phẫu thuật triệt sản',
		status: 'Nội trú',
		statusType: 'inpatient',
		avatarTone: 'toneGreen',
	},
	{
		name: 'Simba',
		id: '#PET-2204',
		species: 'Mèo (Anh)',
		owner: 'Phạm Minh Tuấn',
		phone: '091 222 8888',
		lastVisitDate: '21/10/2023',
		lastVisitNote: 'Phẫu thuật triệt sản',
		status: 'Nội trú',
		statusType: 'inpatient',
		avatarTone: 'toneGreen',
	},
]

const pageItems = ['1', '2', '3']

export default function ListPetMedicalRecords() {
	const navigate = useNavigate()
	const location = useLocation()

	const isActiveMenu = (path) => location.pathname === path

	const onOpenMedicalRecord = () => {
		navigate('/clinic/view-pet-appointment')
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
									onClick={() => navigate(item.path)}
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
				<header className={styles.topHeader}>
					<h1>Hồ sơ y tế điện tử của thú cưng</h1>
				</header>

				<section className={styles.mainPanel}>
					<div className={styles.titleBox}>
						<h2>Hồ sơ bệnh án điện tử</h2>
						<p>Quản lý và tra cứu thông tin sức khỏe thú cưng trong hệ thống</p>
					</div>

					<div className={styles.toolbar}>
						<div className={styles.searchBox}>
							<FaSearch />
							<input
								type="text"
								value=""
								readOnly
								placeholder="Tìm theo tên thú cưng, ID hoặc tên chủ nuôi..."
							/>
						</div>
						<button type="button" className={styles.filterBtn}>
							Tất cả loài
						</button>
						<button type="button" className={styles.filterBtn}>
							Mọi trạng thái
						</button>
						<button type="button" className={styles.advancedBtn}>
							<FaSlidersH />
							<span>Lọc nâng cao</span>
						</button>
					</div>

					<div className={styles.tableWrap}>
						<table>
							<thead>
								<tr>
									<th>ID & THÚ CƯNG</th>
									<th>LOÀI</th>
									<th>CHỦ NUÔI</th>
									<th>LẦN KHÁM CUỐI</th>
									<th>TRẠNG THÁI</th>
									<th>THAO TÁC</th>
								</tr>
							</thead>
							<tbody>
								{petRows.map((row, index) => (
									<tr key={`${row.id}-${index}`}>
										<td>
											<div className={styles.petCell}>
												<div className={`${styles.petAvatar} ${styles[row.avatarTone]}`} aria-hidden="true" />
												<div>
													<h3>{row.name}</h3>
													<p>{row.id}</p>
												</div>
											</div>
										</td>
										<td>
											<div className={styles.infoWithIcon}>
												<FaDog />
												<span>{row.species}</span>
											</div>
										</td>
										<td>
											<div className={styles.infoBlock}>
												<strong>{row.owner}</strong>
												<p>{row.phone}</p>
											</div>
										</td>
										<td>
											<div className={styles.infoBlock}>
												<strong>{row.lastVisitDate}</strong>
												<p>{row.lastVisitNote}</p>
											</div>
										</td>
										<td>
											<span className={`${styles.statusTag} ${styles[`status${row.statusType}`]}`}>{row.status}</span>
										</td>
										<td>
											<div className={styles.actionBtns}>
												<button type="button" onClick={onOpenMedicalRecord} aria-label="Xem chi tiết hồ sơ">
													<FaEye />
												</button>
												<button type="button" onClick={onOpenMedicalRecord} aria-label="Chỉnh sửa hồ sơ">
													<FaPencilAlt />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className={styles.pagination}>
							<button type="button" aria-label="Trang trước">
								‹
							</button>
							{pageItems.map((item, index) => (
								<button
									key={item}
									type="button"
									className={index === 0 ? styles.activePage : ''}
									aria-label={`Trang ${item}`}
								>
									{item}
								</button>
							))}
							<button type="button" aria-label="Trang sau">
								›
							</button>
						</div>
					</div>
				</section>
			</main>
		</div>
	)
}
