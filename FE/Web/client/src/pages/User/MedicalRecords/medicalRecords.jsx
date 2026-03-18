import {
	FaBell,
	FaCalendarCheck,
	FaCakeCandles,
	FaDog,
	FaMars,
	FaShieldDog,
	FaSyringe,
} from 'react-icons/fa6'
import { MdHealthAndSafety } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import Footer from '../../../components/layout/footer'
import Header from '../../../components/layout/header'
import styles from './medicalRecords.module.css'

const timelineRecords = [
	{
		id: 'record-1',
		markerType: 'vaccine',
		title: 'Tiêm phòng dại định kỳ',
		status: 'ĐÃ HOÀN THÀNH',
		statusType: 'done',
		leftInfo: [
			{ label: 'Mã hồ sơ', value: 'LuLu124' },
			{ label: 'Mã phòng khám', value: '101' },
			{ label: 'Ngày tạo hồ sơ', value: '12/10/2023' },
		],
		rightInfo: [
			{ label: 'Tên thú cưng', value: 'LULU' },
			{ label: 'Tên bác sĩ', value: 'BS. Đặng Hoàng Nam' },
			{ label: 'Mã đơn thuốc', value: 'RX-VAC-088' },
		],
		detailRows: [
			{
				label: 'Chẩn đoán',
				value: 'Khỏe mạnh, đủ điều kiện tiêm chủng.',
			},
			{
				label: 'Triệu chứng',
				value: 'Không có dấu hiệu bất thường.',
			},
			{
				label: 'Ghi chú',
				value: 'Tiêm nhắc lại vắc xin phòng dại. Tình trạng sức khỏe tốt sau tiêm.',
			},
			{
				label: 'Ngày tái khám',
				value: '12/10/2024',
			},
		],
	},
	{
		id: 'record-2',
		markerType: 'checkup',
		title: 'Kiểm tra sức khỏe tổng quát',
		status: 'CHƯA HOÀN THÀNH',
		statusType: 'pending',
		leftInfo: [
			{ label: 'Mã hồ sơ', value: 'LuLu124' },
			{ label: 'Mã phòng khám', value: '101' },
			{ label: 'Ngày tạo hồ sơ', value: '12/10/2023' },
		],
		rightInfo: [
			{ label: 'Tên thú cưng', value: 'LULU' },
			{ label: 'Tên bác sĩ', value: 'BS. Đặng Hoàng Nam' },
			{ label: 'Mã đơn thuốc', value: 'RX-VAC-088' },
		],
		detailRows: [
			{
				label: 'Chẩn đoán',
				value: 'Sức khỏe ổn định. Phát hiện nhẹ viêm lợi.',
			},
			{
				label: 'Triệu chứng',
				value: 'Lợi đỏ nhẹ, có vôi răng.',
			},
			{
				label: 'Ghi chú',
				value: 'Đã lấy cao răng. Khuyên dùng đồ chơi làm sạch răng.',
			},
			{
				label: 'Ngày tái khám',
				value: '15/01/2024',
			},
		],
	},
	{
		id: 'record-3',
		markerType: 'skin',
		title: 'Điều trị viêm da',
		status: 'ĐÃ HOÀN THÀNH',
		statusType: 'done',
		leftInfo: [
			{ label: 'Mã hồ sơ', value: 'LuLu124' },
			{ label: 'Mã phòng khám', value: '101' },
			{ label: 'Ngày tạo hồ sơ', value: '12/10/2023' },
		],
		rightInfo: [
			{ label: 'Tên thú cưng', value: 'LULU' },
			{ label: 'Tên bác sĩ', value: 'BS. Đặng Hoàng Nam' },
			{ label: 'Mã đơn thuốc', value: 'RX-VAC-088' },
		],
		detailRows: [
			{
				label: 'Chẩn đoán',
				value: 'Viêm da cơ địa dị ứng,',
			},
			{
				label: 'Triệu chứng',
				value: 'Mẩn đỏ vùng bụng, ngứa nhiều.',
			},
			{
				label: 'Ghi chú',
				value: 'Kê đơn thuốc bôi ngoài da và sữa tắm chuyên dụng. Theo dõi trong 2 tuần.',
			},
			{
				label: 'Ngày tái khám',
				value: '19/04/2023',
			},
		],
	},
]

const reminders = [
	{
		id: 'reminder-1',
		type: 'vaccine',
		title: 'Tiêm phòng nhắc lại',
		subtitle: 'Trong 5 ngày (12/11/2024)',
	},
	{
		id: 'reminder-2',
		type: 'deworm',
		title: 'Tẩy giun & Sán',
		subtitle: 'Tháng tới (20/12/2024)',
	},
	{
		id: 'reminder-3',
		type: 'follow-up',
		title: 'Tái khám da liễu',
		subtitle: 'Định kỳ 6 tháng',
	},
]

const getMarkerIcon = (markerType) => {
	if (markerType === 'vaccine') return <FaSyringe />
	if (markerType === 'checkup') return <MdHealthAndSafety />
	return <FaDog />
}

const getReminderIcon = (type) => {
	if (type === 'vaccine') return <FaShieldDog />
	if (type === 'deworm') return <MdHealthAndSafety />
	return <FaCalendarCheck />
}

function MedicalRecords() {
	const navigate = useNavigate()

	const handleOpenAppointments = () => {
		navigate('/appointments')
	}

	const handleBookNow = (service) => {
		navigate('/booking', { state: { service } })
	}

	return (
		<div className={styles.pageRoot}>
			<Header />

			<main className={styles.pageContent}>
				<section className={styles.petCard}>
					<img src="/lulu.png" alt="Lu Lu" className={styles.petAvatar} />

					<div className={styles.petInfo}>
						<h1>Lu Lu</h1>
						<p className={styles.petMeta}>Mèo Anh lông ngắn • 3 tuổi • 15 kg</p>
						<div className={styles.petSubMeta}>
							<span>
								<FaCakeCandles /> 15/05/2021
							</span>
							<span>
								<FaMars /> Đực
							</span>
						</div>
					</div>
				</section>

				<section className={styles.mainGrid}>
					<article className={styles.timelinePanel}>
						<h2 className={styles.panelTitle}>
							<MdHealthAndSafety /> Dòng thời gian sức khỏe
						</h2>

						<div className={styles.timelineWrapper}>
							{timelineRecords.map((record) => (
								<div key={record.id} className={styles.timelineItem}>
									<div className={`${styles.timelineMarker} ${styles[record.markerType]}`}>
										{getMarkerIcon(record.markerType)}
									</div>

									<button
										type="button"
										className={styles.recordCard}
										onClick={handleOpenAppointments}
									>
										<div className={styles.recordHeader}>
											<h3>{record.title}</h3>
											<span className={`${styles.statusTag} ${styles[record.statusType]}`}>
												{record.status}
											</span>
										</div>

										<div className={styles.recordMetaGrid}>
											<div>
												{record.leftInfo.map((line) => (
													<p key={`${record.id}-${line.label}-left`}>
														<strong>{line.label}:</strong> {line.value}
													</p>
												))}
											</div>

											<div>
												{record.rightInfo.map((line) => (
													<p key={`${record.id}-${line.label}-right`}>
														<strong>{line.label}:</strong> {line.value}
													</p>
												))}
											</div>
										</div>

										<div className={styles.recordDivider} />

										<div className={styles.recordDetails}>
											{record.detailRows.map((line) => (
												<p key={`${record.id}-${line.label}`}>
													<span>{line.label}:</span> {line.value}
												</p>
											))}
										</div>
									</button>
								</div>
							))}
						</div>
					</article>

					<aside className={styles.reminderPanel}>
						<h2 className={styles.panelTitle}>
							<FaBell /> Nhắc nhở quan trọng
						</h2>

						<div className={styles.reminderList}>
							{reminders.map((reminder) => (
								<button
									key={reminder.id}
									type="button"
									className={`${styles.reminderCard} ${styles[reminder.type]}`}
									onClick={() => handleBookNow(reminder.title)}
								>
									<span className={styles.reminderIcon}>{getReminderIcon(reminder.type)}</span>
									<span>
										<strong>{reminder.title}</strong>
										<small>{reminder.subtitle}</small>
									</span>
								</button>
							))}
						</div>

						<button
							type="button"
							className={styles.bookNowButton}
							onClick={() => handleBookNow('Đặt lịch khám')}
						>
							Đặt lịch ngay
						</button>
					</aside>
				</section>
			</main>

			<Footer />
		</div>
	)
}

export default MedicalRecords
