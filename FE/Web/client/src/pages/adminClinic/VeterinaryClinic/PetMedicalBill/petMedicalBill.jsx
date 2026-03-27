import { useState } from 'react'
import { Button, Modal, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
	CalendarOutlined,
	FileDoneOutlined,
	MedicineBoxOutlined,
	PrinterOutlined,
	SearchOutlined,
} from '@ant-design/icons'
import styles from './petMedicalBill.module.css'

const billData = {
	code: 'HD-4924',
	medicineItems: [
		{ name: 'Antibiotic - A1 (10 viên)', amount: '150.000đ' },
		{ name: 'Painkiller - P5 (5 ống)', amount: '85.000đ' },
	],
	testItems: [
		{ name: 'Chụp X-Quang bụng', amount: '450.000đ' },
		{ name: 'Xét nghiệm máu tổng quát', amount: '320.000đ' },
	],
	provisionalTotal: '1.005.000đ',
	grandTotal: '1.055.250đ',
}

export default function PetMedicalBill() {
	const navigate = useNavigate()
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

	const handlePrintInvoice = () => {
		window.print()
	}

	const openPaymentModal = () => {
		setIsPaymentModalOpen(true)
	}

	const closePaymentModal = () => {
		setIsPaymentModalOpen(false)
	}

	const handleConfirmPayment = () => {
		setIsPaymentModalOpen(false)
		message.success('Thanh toán thành công')
		navigate('/admin/clinic/exam-slips')
	}

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<div className={styles.searchBox}>
					<SearchOutlined />
					<span>Tìm kiếm thú cưng, khách hàng...</span>
				</div>
			</header>

			<section className={styles.contentWrap}>
				<div className={styles.pageTitleBlock}>
					<h1>Hóa đơn bệnh án</h1>
					<p>Thú cưng: Mèo Anh lông ngắn</p>
				</div>

				<article className={styles.card}>
					<section className={styles.sectionBlock}>
						<h2>
							<MedicineBoxOutlined />
							<span>Dấu hiệu sinh tồn</span>
						</h2>

						<div className={styles.vitalGrid}>
							<div className={styles.vitalField}>
								<label>Nhiệt độ (°C)</label>
								<div className={styles.readonlyValue}>38.5</div>
							</div>

							<div className={styles.vitalField}>
								<label>Nhịp tim (bpm)</label>
								<div className={styles.readonlyValue}>110</div>
							</div>

							<div className={styles.vitalField}>
								<label>Huyết áp (mmHg)</label>
								<div className={styles.readonlyValue}>120/80</div>
							</div>
						</div>
					</section>

					<section className={styles.sectionBlock}>
						<h2>
							<FileDoneOutlined />
							<span>Thông tin lâm sàng</span>
						</h2>

						<div className={styles.textGroup}>
							<label>Triệu chứng lâm sàng</label>
							<div className={styles.multilineValue}>
								Lucky bỏ ăn 2 ngày, có dấu hiệu nôn mửa nhẹ vào sáng nay. Bụng hơi chướng.
							</div>
						</div>

						<div className={styles.textGroup}>
							<label>Chẩn đoán xác định</label>
							<div className={styles.multilineValue}>Viêm dạ dày cấp tính do thức ăn lạ.</div>
						</div>
					</section>

					<div className={styles.actionRow}>
						<Button type="primary" className={styles.actionButton} icon={<PrinterOutlined />} onClick={handlePrintInvoice}>
							In hóa đơn
						</Button>

						<Button
							type="primary"
							className={styles.actionButton}
							icon={<CalendarOutlined />}
							onClick={openPaymentModal}
						>
							Thanh toán
						</Button>
					</div>
				</article>
			</section>

			<Modal
				open={isPaymentModalOpen}
				onCancel={closePaymentModal}
				footer={null}
				centered
				width={560}
				className={styles.paymentModal}
				destroyOnClose
			>
				<div className={styles.modalBody}>
					<h3>
						<FileDoneOutlined />
						<span>Tóm tắt hóa đơn</span>
					</h3>

					<p className={styles.billCode}>MÃ HÓA ĐƠN: {billData.code}</p>

					<div className={styles.modalSectionTitle}>THUỐC ĐÃ KÊ ĐƠN</div>
					<div className={styles.modalList}>
						{billData.medicineItems.map((item) => (
							<div className={styles.modalRow} key={item.name}>
								<span>{item.name}</span>
								<strong>{item.amount}</strong>
							</div>
						))}
					</div>

					<div className={styles.modalSectionTitle}>XÉT NGHIỆM &amp; CHẨN ĐOÁN</div>
					<div className={styles.modalList}>
						{billData.testItems.map((item) => (
							<div className={styles.modalRow} key={item.name}>
								<span>{item.name}</span>
								<strong>{item.amount}</strong>
							</div>
						))}
					</div>

					<div className={styles.divider} />

					<div className={styles.modalRow}>
						<span className={styles.provisionalLabel}>Tạm tính:</span>
						<strong>{billData.provisionalTotal}</strong>
					</div>

					<div className={styles.modalRowTotal}>
						<span>Tổng cộng:</span>
						<strong>{billData.grandTotal}</strong>
					</div>

					<button type="button" className={styles.confirmButton} onClick={handleConfirmPayment}>
						<CalendarOutlined />
						<span>Xác nhận thanh toán</span>
					</button>
				</div>
			</Modal>
		</div>
	)
}
