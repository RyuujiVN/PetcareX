import { useNavigate } from 'react-router-dom'
import {
	FaHeartbeat,
	FaPaw,
	FaPills,
	FaPlusCircle,
	FaRegTrashAlt,
	FaStethoscope,
	FaThermometerHalf,
	FaTint,
	FaUserMd,
	FaVial,
} from 'react-icons/fa'
import styles from './petMedicalRecords.module.css'

const testRows = [
	{
		order: 1,
		test: 'Tổng phân tích tế bào máu (CBC)',
		note: 'Kiểm tra bạch cầu',
		status: 'Chờ kết quả',
	},
	{
		order: 2,
		test: 'Chụp X-Quang lồng ngực',
		note: '2 tư thế',
		status: 'Chờ kết quả',
	},
]

const medicineRows = [
	{
		medicine: 'Amoxicillin 250mg',
		form: 'Viên nén',
		dosage: '1/2 viên',
		frequency: 'Sáng - Tối (Sau ăn)',
		note: 'Uống trong 7 ngày',
	},
	{
		medicine: 'Nutri-Plus Gel',
		form: 'Tuýp 120g',
		dosage: '2cm gel',
		frequency: 'Sáng - Trưa - Tối',
		note: 'Hỗ trợ dinh dưỡng',
	},
]

function Field({ label, value, placeholder = '', isSelect = false }) {
	return (
		<label className={styles.fieldGroup}>
			<span>{label}</span>
			{isSelect ? (
				<select value={value} readOnly>
					<option>{value}</option>
				</select>
			) : (
				<input value={value} placeholder={placeholder} readOnly />
			)}
		</label>
	)
}

export default function PetMedicalRecords() {
	const navigate = useNavigate()

	return (
		<div className={styles.page}>
			<div className={styles.pageWrap}>
				<header className={styles.headerCard}>
					<div className={styles.brandBox}>
						<div className={styles.brandIcon}>
							<FaPaw />
						</div>
						<div>
							<h1>PETCAR</h1>
							<p>Hệ thống thú y chuyên nghiệp</p>
						</div>
					</div>

					<div className={styles.headerMeta}>
						<h2>PHIẾU KHÁM BỆNH &amp; CHỈ ĐỊNH</h2>
						<p>Mã hồ sơ: #PC-20231024-001</p>
						<p>Ngày khám: 24/10/2023</p>
					</div>
				</header>

				<section className={styles.card}>
					<div className={styles.twoColumns}>
						<Field label="TÊN PHIẾU KHÁM" value="HIHI" />
						<Field label="NGÀY TÁI KHÁM" value="" placeholder="dd/mm/yyyy" />
					</div>
				</section>

				<section className={styles.card}>
					<h3>
						<FaUserMd /> Thông tin khách hàng &amp; Thú cưng
					</h3>

					<div className={styles.threeColumns}>
						<Field label="TÊN KHÁCH HÀNG" value="Trương Công Thành" />
						<Field label="EMAIL" value="example@gmail.com" />
						<Field label="SĐT" value="0901 234 567" />
						<Field label="TÊN THÚ CƯNG" value="Lulu" />
						<Field label="GIỐNG LOÀI" value="Mèo Anh lông ngắn" isSelect />
						<Field label="CÂN NẶNG (KG)" value="5.5" />
					</div>
				</section>

				<section className={styles.card}>
					<h3>
						<FaStethoscope /> Chỉ số sinh tồn
					</h3>

					<div className={styles.vitalsGrid}>
						<article className={styles.vitalItem}>
							<div className={styles.vitalTitle}>
								<FaThermometerHalf /> NHIỆT ĐỘ (°C)
							</div>
							<strong>38.5</strong>
						</article>

						<article className={styles.vitalItem}>
							<div className={styles.vitalTitle}>
								<FaHeartbeat /> NHỊP TIM (B/P/O)
							</div>
							<strong>110</strong>
						</article>

						<article className={styles.vitalItem}>
							<div className={styles.vitalTitle}>
								<FaTint /> HUYẾT ÁP (MMHG)
							</div>
							<strong>120/80</strong>
						</article>
					</div>
				</section>

				<section className={styles.card}>
					<h3>
						<FaStethoscope /> Thông tin lâm sàng
					</h3>

					<label className={styles.fieldGroup}>
						<span>TRIỆU CHỨNG &amp; TÌNH TRẠNG</span>
						<textarea value="Bỏ ăn, mệt mỏi, nôn mửa..." readOnly />
					</label>

					<label className={styles.fieldGroup}>
						<span>CHẨN ĐOÁN SƠ BỘ</span>
						<input value="Nghi nhiễm Parvo..." readOnly />
					</label>
				</section>

				<section className={styles.card}>
					<div className={styles.sectionHeader}>
						<h3>
							<FaVial /> Phiếu chỉ định xét nghiệm/X-Quang
						</h3>
						<button type="button" className={styles.linkButton}>
							<FaPlusCircle /> Thêm chỉ định
						</button>
					</div>

					<div className={styles.tableWrap}>
						<table>
							<thead>
								<tr>
									<th>STT</th>
									<th>LOẠI XÉT NGHIỆM / CHẨN ĐOÁN HÌNH ẢNH</th>
									<th>GHI CHÚ YÊU CẦU</th>
									<th>TRẠNG THÁI</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{testRows.map((item) => (
									<tr key={item.order}>
										<td>{item.order}</td>
										<td>{item.test}</td>
										<td>{item.note}</td>
										<td>
											<span className={styles.waitingTag}>{item.status}</span>
										</td>
										<td className={styles.iconCell}>
											<button type="button" aria-label="Xóa chỉ định">
												<FaRegTrashAlt />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className={styles.card}>
					<div className={styles.sectionHeader}>
						<h3>
							<FaPills /> Đơn thuốc chỉ định
						</h3>
						<button type="button" className={styles.linkButton}>
							<FaPlusCircle /> Thêm thuốc
						</button>
					</div>

					<div className={styles.tableWrap}>
						<table>
							<thead>
								<tr>
									<th>TÊN THUỐC / HÀM LƯỢNG</th>
									<th>LIỀU DÙNG</th>
									<th>TẦN SUẤT</th>
									<th>GHI CHÚ</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{medicineRows.map((item) => (
									<tr key={item.medicine}>
										<td>
											<strong>{item.medicine}</strong>
											<p>{item.form}</p>
										</td>
										<td>{item.dosage}</td>
										<td>{item.frequency}</td>
										<td>{item.note}</td>
										<td className={styles.iconCell}>
											<button type="button" aria-label="Xóa thuốc">
												<FaRegTrashAlt />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<footer className={styles.footerCard}>
					<div className={styles.noteBox}>
						<h4>Lời dặn bác sĩ:</h4>
						<p>
							Theo dõi nhiệt độ tại nhà mỗi 4 tiếng. Nếu có dấu hiệu co giật hoặc nôn ra máu, vui lòng đưa bé
							đến cấp cứu ngay lập tức.
						</p>
					</div>

					<div className={styles.signatureBlock}>
						<p>Đà Nẵng, ngày 24 tháng 10 năm 2024</p>
						<h5>BÁC SĨ ĐIỀU TRỊ</h5>
						<strong>BS. Đặng Hoàng Nam</strong>
					</div>
				</footer>

				<div className={styles.actionRow}>
					<button
						type="button"
						className={styles.cancelBtn}
						onClick={() => navigate('/admin/clinic/medical-records')}
					>
						Hủy
					</button>
					<button
						type="button"
						className={styles.saveBtn}
						onClick={() => navigate('/admin/clinic/medical-records')}
					>
						LƯU HỒ SƠ
					</button>
				</div>
			</div>
		</div>
	)
}
