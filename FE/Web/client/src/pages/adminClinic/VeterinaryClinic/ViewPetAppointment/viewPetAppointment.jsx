import {
	FaRegBell,
	FaInfoCircle,
	FaBirthdayCake,
	FaMars,
	FaChevronDown,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import styles from './viewPetAppointment.module.css'

export default function ViewPetAppointment() {
	const navigate = useNavigate()

	return (
		<div className={styles.content}>
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
						<button type="button" className={styles.cancelBtn} onClick={() => navigate('/admin/clinic/appointments')}>
							Hủy
						</button>
						<button type="button" className={styles.doneBtn} onClick={() => navigate('/admin/clinic/appointments')}>
							Xong
						</button>
					</div>
				</section>
		</div>
	)
}
