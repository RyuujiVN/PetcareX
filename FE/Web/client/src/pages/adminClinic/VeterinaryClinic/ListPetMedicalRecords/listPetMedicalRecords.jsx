import {
	FaDog,
	FaEye,
	FaPencilAlt,
	FaSearch,
	FaSlidersH,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import styles from './listPetMedicalRecords.module.css'

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

	const onOpenMedicalRecord = () => {
		navigate('/admin/clinic/view-pet-appointment')
	}

	return (
		<div className={styles.content}>
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
		</div>
	)
}
