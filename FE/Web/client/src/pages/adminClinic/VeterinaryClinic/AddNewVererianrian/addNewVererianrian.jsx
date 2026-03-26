import {
	FaBell,
	FaCamera,
	FaEnvelope,
	FaSave,
	FaSearch,
	FaUserAlt,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import styles from './addNewVererianrian.module.css'

export default function AddNewVererianrian() {
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
				<h1>Thêm bác sĩ</h1>
				<p>Điền thông tin cá nhân của bạn để nhận dịch vụ tốt nhất</p>

				<article className={styles.formCard}>
					<div className={styles.avatarWrap}>
						<div className={styles.avatar}>
							<FaUserAlt />
						</div>
						<button type="button" className={styles.avatarButton} aria-label="Cập nhật ảnh đại diện">
							<FaCamera />
						</button>
					</div>

					<h2>Trương Công Thành</h2>

					<div className={styles.formGrid}>
						<label className={styles.field}>
							<span>Tên</span>
							<div className={styles.inputWrap}>
								<FaUserAlt className={styles.fieldIcon} />
								<input type="text" value="Trương Công Thành" readOnly />
							</div>
						</label>

						<label className={styles.field}>
							<span>Mã phòng khám</span>
							<div className={styles.inputWrap}>
								<input type="text" value="" readOnly />
							</div>
						</label>

						<label className={styles.field}>
							<span>Email</span>
							<div className={styles.inputWrap}>
								<FaEnvelope className={styles.fieldIcon} />
								<input type="text" value="nguyenvanthanh@email.com" readOnly />
							</div>
						</label>

						<label className={styles.field}>
							<span>Mật khẩu</span>
							<div className={styles.inputWrap}>
								<input type="text" value="0901234567" readOnly />
							</div>
						</label>

						<label className={`${styles.field} ${styles.fullRow}`}>
							<span>Chuyên khoa</span>
							<div className={styles.inputWrap}>
								<input type="text" value="Khoa nội" readOnly />
							</div>
						</label>
					</div>

					<footer className={styles.formActions}>
						<button
							type="button"
							className={styles.cancelButton}
							onClick={() => navigate('/admin/clinic/veterinarians/information')}
						>
							Hủy
						</button>
						<button
							type="button"
							className={styles.submitButton}
							onClick={() => navigate('/admin/clinic/veterinarians/information')}
						>
							<FaSave /> Lưu thay đổi
						</button>
					</footer>
				</article>
			</section>
		</div>
	)
}
