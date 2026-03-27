import { CloseOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './petDiagnosis.module.css'

export default function PetDiagnosis() {
	const navigate = useNavigate()

	const handleClose = () => {
		if (window.history.length > 1) {
			navigate(-1)
			return
		}

		navigate('/petProfile')
	}

	return (
		<div className={styles.pageWrap}>
			<section className={styles.reportCard}>
				<button
					type="button"
					className={styles.closeButton}
					onClick={handleClose}
					aria-label="Đóng báo cáo"
				>
					<CloseOutlined />
				</button>

				<h1 className={styles.title}>AI Báo cáo chẩn đoán sơ bộ cho Max (Chó)</h1>

				<div className={styles.content}>
					<div className={styles.block}>
						<h2 className={styles.blockTitle}>1. Các triệu chứng đầu vào và phân tích:</h2>
						<ul className={styles.symptomList}>
							<li>Nôn mửa</li>
							<li>Tiêu chảy</li>
							<li>Chán ăn</li>
							<li>Sụt cân</li>
							<li>Rụng lông</li>
						</ul>
						<p className={styles.paragraph}>
							Hệ thống AI đã thực hiện phân tích dựa trên 5 triệu chứng chính này. Kết hợp nôn mửa
							và tiêu chảy cho thấy các vấn đề nghiêm trọng về đường tiêu hóa, có thể dẫn đến mất
							nước và chán ăn. Sụt cân là dấu hiệu của suy kiệt cơ thể, trong khi rụng lông có thể
							liên quan đến suy dinh dưỡng hoặc do các vấn đề sức khỏe khác.
						</p>
					</div>

					<div className={styles.block}>
						<h2 className={styles.blockTitle}>2. Dự đoán các bệnh có thể xảy ra (Xếp hạng theo xác suất):</h2>
						<ul className={styles.predictionList}>
							<li>
								<span role="img" aria-label="stethoscope">🩺</span> Viêm ruột mạn tính (IBD): Xác suất
								60%. Phổ biến. Mức độ: <span className={styles.highRisk}>Nguy hiểm</span>
							</li>
							<li>
								<span role="img" aria-label="microbe">🦠</span> Nhiễm ký sinh trùng đường ruột: Xác suất
								25%. Phổ biến. Mức độ: <span className={styles.mediumRisk}>Trung bình</span>
							</li>
							<li>
								<span role="img" aria-label="blue-circle">🔵</span> Các nguyên nhân khác: Xác suất 15%.
								Hiếm. Mức độ: Biến đổi.
							</li>
						</ul>
					</div>

					<div className={styles.block}>
						<h2 className={styles.blockTitle}>3. Vùng cơ thể ảnh hưởng:</h2>
						<div className={styles.impactList}>
							<p>Hệ tiêu hóa: 70%</p>
							<p>Gastrointestinal</p>
							<p>Da &amp; Lông: 30%</p>
						</div>
					</div>

					<div className={styles.block}>
						<h2 className={styles.blockTitle}>4. Thông báo quan trọng:</h2>
						<p className={styles.paragraph}>
							Dự đoán của AI CHỈ mang tính chất THAM KHẢO sơ bộ, không thay thế cho chẩn đoán y tế.
							Bác sĩ cần khám trực tiếp để đưa ra kết luận và phác đồ điều trị chính xác cho thú cưng.
						</p>
					</div>
				</div>
			</section>
		</div>
	)
}
