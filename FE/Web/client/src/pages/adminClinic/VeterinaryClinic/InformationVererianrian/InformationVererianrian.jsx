import {
	FaArrowLeft,
	FaBell,
	FaCalendarAlt,
	FaEdit,
	FaRegAddressCard,
	FaSearch,
	FaStethoscope,
	FaUserAlt,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import styles from './InformationVererianrian.module.css'

export default function InformationVererianrian() {
	const navigate = useNavigate()

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<div className={styles.searchBox}>
					<FaSearch className={styles.searchIcon} />
					<input type="text" placeholder="Tìm kiếm thú cưng, khách hàng..." value="" readOnly />
				</div>
				<button type="button" className={styles.notificationButton} aria-label="Thông báo">
					<FaBell />
				</button>
			</header>

			<section className={styles.content}>
				<article className={styles.profileHead}>
					<div className={styles.avatarWrap}>
						<div className={styles.avatar}>
							<FaUserAlt />
						</div>
					</div>

					<div className={styles.headInfo}>
						<h1>
							Bác sĩ Nguyễn Bình <span>HOẠT ĐỘNG</span>
						</h1>

						<div className={styles.metaLine}>
							<p>
								<FaStethoscope /> GENERAL_EXAMINATION
							</p>
							<p>
								<FaStethoscope /> VETERINARIAN
							</p>
						</div>

						<p className={styles.joinDate}>
							<FaCalendarAlt /> Tham gia: 20/03/2026
						</p>
					</div>

					<div className={styles.actions}>
						<button type="button" className={styles.backButton} onClick={() => navigate('/admin/clinic/veterinarians')}>
							<FaArrowLeft /> Quay lại
						</button>
						<button
							type="button"
							className={styles.editButton}
							onClick={() => navigate('/admin/clinic/veterinarians/add-new')}
						>
							<FaEdit /> Chỉnh sửa hồ sơ
						</button>
					</div>
				</article>

				<article className={styles.infoCard}>
					<div className={styles.cardTitle}>
						<h2>Thông tin cá nhân</h2>
						<FaRegAddressCard />
					</div>

					<div className={styles.infoGrid}>
						<div className={styles.infoItem}>
							<span>HỌ VÀ TÊN</span>
							<strong>Bác sĩ Nguyễn Bình</strong>
						</div>

						<div className={styles.infoItem}>
							<span>SỐ ĐIỆN THOẠI</span>
							<strong>Chưa cập nhật</strong>
						</div>

						<div className={styles.infoItem}>
							<span>EMAIL</span>
							<strong>bacsi1@gmail.com</strong>
						</div>

						<div className={styles.infoItem}>
							<span>ĐỊA CHỈ</span>
							<strong>Chưa cập nhật</strong>
						</div>
					</div>
				</article>
			</section>
		</div>
	)
}
