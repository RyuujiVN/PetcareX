import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Modal, Spin, message } from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
	CalendarOutlined,
	FileDoneOutlined,
	MedicineBoxOutlined,
	PrinterOutlined,
} from '@ant-design/icons'
import styles from './petMedicalBill.module.css'
import {
	APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
	APPOINTMENT_STATUS,
	getClinicAppointmentByIdApi,
} from '../../../../data/Clinic/api/appointmentApi'
import { INVOICE_STATUS, upsertPaidInvoiceByMedicalApi } from '../../../../data/Clinic/api/invoiceApi'
import {
	getLatestMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../../data/Clinic/api/medicalApi'

const EMPTY_BILL_DATA = {
	code: 'HD-TEMP',
	medicineItems: [],
	testItems: [],
	provisionalTotal: '0 VND',
	grandTotal: '0 VND',
}

const toCurrencyVnd = (value) => {
	const amount = Number(value || 0)
	if (!Number.isFinite(amount) || amount <= 0) return '0 VND'
	return `${amount.toLocaleString('vi-VN')} VND`
}

const buildInvoiceCode = (medicalRecordId) => {
	if (!medicalRecordId) return 'HD-TEMP'
	return `HD-${String(medicalRecordId).slice(0, 6).toUpperCase()}`
}

const normalizeRows = (payload) => (Array.isArray(payload) ? payload : [])

export default function PetMedicalBill() {
	const navigate = useNavigate()
	const location = useLocation()
	const { appointmentId } = useParams()
	const isVeterinarianPortal = location.pathname.startsWith('/veterinarian')
	const routePrefix = isVeterinarianPortal ? '/veterinarian' : '/clinic'

	const stateMedicalRecord = location?.state?.medicalRecord || null
	const stateAppointment = location?.state?.appointment || null

	const [loading, setLoading] = useState(false)
	const [appointment, setAppointment] = useState(stateAppointment)
	const [medicalRecord, setMedicalRecord] = useState(stateMedicalRecord)
	const [medicalOrders, setMedicalOrders] = useState(normalizeRows(location?.state?.medicalOrders))
	const [medicines, setMedicines] = useState(normalizeRows(location?.state?.medicines))
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
	const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

	const loadBillData = useCallback(async () => {
		if (!appointmentId) return

		try {
			setLoading(true)

			let resolvedAppointment = stateAppointment
			if (!resolvedAppointment || String(resolvedAppointment?.id) !== String(appointmentId)) {
				resolvedAppointment = await getClinicAppointmentByIdApi(appointmentId)
			}
			setAppointment(resolvedAppointment || null)

			let resolvedMedical = stateMedicalRecord
			const petId = resolvedAppointment?.pet?.id || resolvedAppointment?.petId || ''
			if (!resolvedMedical?.id && petId) {
				resolvedMedical = await getLatestMedicalByPetId(petId)
			}
			setMedicalRecord(resolvedMedical || null)

			if (!resolvedMedical?.id) {
				setMedicalOrders([])
				setMedicines([])
				return
			}

			if (medicalOrders.length === 0 || medicines.length === 0) {
				const [ordersPayload, medicinesPayload] = await Promise.all([
					getMedicalOrdersByMedicalId(resolvedMedical.id).catch(() => []),
					getMedicinesByMedicalId(resolvedMedical.id).catch(() => []),
				])

				setMedicalOrders(normalizeRows(ordersPayload))
				setMedicines(normalizeRows(medicinesPayload))
			}
		} catch (error) {
			message.error(error?.message || 'Khong the tai du lieu hoa don')
			setMedicalOrders([])
			setMedicines([])
		} finally {
			setLoading(false)
		}
	}, [appointmentId, medicines.length, medicalOrders.length, stateAppointment, stateMedicalRecord])

	useEffect(() => {
		loadBillData()
	}, [loadBillData])

	const billData = useMemo(() => {
		if (!medicalRecord?.id) return EMPTY_BILL_DATA

		const medicineItems = medicines.map((item) => {
			const unitPrice = Number(item?.priceAtTime || 0)
			const quantity = Number(item?.quantity || 0)
			const amount = unitPrice * quantity
			return {
				name: `${item?.medicine?.name || 'Thuoc'}${quantity > 0 ? ` (${quantity})` : ''}`,
				amount: toCurrencyVnd(amount),
				rawAmount: amount,
			}
		})

		const testItems = medicalOrders.map((item) => {
			const amount = Number(item?.priceAtTime || 0)
			return {
				name: item?.medicalOrder?.nameVn || item?.medicalOrder?.nameEng || 'Chi dinh xet nghiem',
				amount: toCurrencyVnd(amount),
				rawAmount: amount,
			}
		})

		const subtotal = [...medicineItems, ...testItems].reduce((sum, row) => sum + Number(row.rawAmount || 0), 0)

		return {
			code: buildInvoiceCode(medicalRecord.id),
			medicineItems,
			testItems,
			provisionalTotal: toCurrencyVnd(subtotal),
			grandTotal: toCurrencyVnd(subtotal),
		}
	}, [medicalOrders, medicalRecord?.id, medicines])

	const handlePrintInvoice = () => {
		window.print()
	}

	const openPaymentModal = () => {
		if (!medicalRecord?.id) {
			message.warning('Chua co phieu kham de thanh toan')
			return
		}
		setIsPaymentModalOpen(true)
	}

	const closePaymentModal = () => {
		setIsPaymentModalOpen(false)
	}

	const handleConfirmPayment = async () => {
		if (!appointmentId) {
			message.error('Khong tim thay lich kham de xac nhan thanh toan')
			return
		}

		if (!medicalRecord?.id) {
			message.error('Khong tim thay ho so benh an de thanh toan')
			return
		}

		try {
			setIsConfirmingPayment(true)

			const petOwnerId = appointment?.pet?.owner?.id || appointment?.ownerId || ''
			await upsertPaidInvoiceByMedicalApi({
				medicalRecordId: medicalRecord.id,
				petOwnerId,
				note: 'Thanh toan tai phong kham',
			})

			localStorage.setItem(
				APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
				JSON.stringify({
					appointmentId,
					status: APPOINTMENT_STATUS.COMPLETED,
					paymentStatus: INVOICE_STATUS.PAID,
					updatedAt: Date.now(),
				}),
			)

			setIsPaymentModalOpen(false)
			message.success('Thanh toan thanh cong')
			navigate(`${routePrefix}/appointments`)
		} catch (error) {
			message.error(error.message || 'Khong the xac nhan thanh toan')
		} finally {
			setIsConfirmingPayment(false)
		}
	}

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<h1 style={{ fontSize: 25, fontWeight: 'bold' }}>Hoa don benh an</h1>
			</header>

			<section className={styles.contentWrap}>
				<article className={styles.card}>
					{loading ? (
						<div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
							<Spin size="large" />
						</div>
					) : null}

					<section className={styles.sectionBlock}>
						<h2>
							<MedicineBoxOutlined />
							<span>Dau hieu sinh ton</span>
						</h2>

						<div className={styles.vitalGrid}>
							<div className={styles.vitalField}>
								<label>Nhiet do (DEG C)</label>
								<div className={styles.readonlyValue}>{medicalRecord?.temperature || '-'}</div>
							</div>

							<div className={styles.vitalField}>
								<label>Nhip tim (bpm)</label>
								<div className={styles.readonlyValue}>{medicalRecord?.heartRate || '-'}</div>
							</div>

							<div className={styles.vitalField}>
								<label>Huyet ap (mmHg)</label>
								<div className={styles.readonlyValue}>
									{medicalRecord?.systolic && medicalRecord?.diastolic
										? `${medicalRecord.systolic}/${medicalRecord.diastolic}`
										: '-'}
								</div>
							</div>
						</div>
					</section>

					<section className={styles.sectionBlock}>
						<h2>
							<FileDoneOutlined />
							<span>Thong tin lam sang</span>
						</h2>

						<div className={styles.textGroup}>
							<label>Trieu chung lam sang</label>
							<div className={styles.multilineValue}>{medicalRecord?.symptoms || 'Chua cap nhat'}</div>
						</div>

						<div className={styles.textGroup}>
							<label>Chan doan xac dinh</label>
							<div className={styles.multilineValue}>{medicalRecord?.diagnosis || 'Chua cap nhat'}</div>
						</div>
					</section>

					<div className={styles.actionRow}>
						<Button
							style={{ fontSize: 16 }}
							type="primary"
							className={styles.actionButton}
							icon={<PrinterOutlined />}
							onClick={handlePrintInvoice}
						>
							In hoa don
						</Button>

						<Button
							style={{ fontSize: 16 }}
							type="primary"
							className={styles.actionButton}
							icon={<CalendarOutlined />}
							onClick={openPaymentModal}
						>
							Thanh toan
						</Button>
					</div>
				</article>
			</section>

			<Modal
				open={isPaymentModalOpen}
				onCancel={isConfirmingPayment ? undefined : closePaymentModal}
				footer={null}
				centered
				width={560}
				className={styles.paymentModal}
				destroyOnClose
				closable={!isConfirmingPayment}
				maskClosable={!isConfirmingPayment}
			>
				<div className={styles.modalBody}>
					<h3>
						<FileDoneOutlined />
						<span>Tom tat hoa don</span>
					</h3>

					<p className={styles.billCode}>MA HOA DON: {billData.code}</p>

					<div className={styles.modalSectionTitle}>THUOC DA KE DON</div>
					<div className={styles.modalList}>
						{billData.medicineItems.length > 0 ? (
							billData.medicineItems.map((item) => (
								<div className={styles.modalRow} key={item.name}>
									<span>{item.name}</span>
									<strong>{item.amount}</strong>
								</div>
							))
						) : (
							<div className={styles.modalRow}>
								<span>Khong co du lieu thuoc</span>
								<strong>0 VND</strong>
							</div>
						)}
					</div>

					<div className={styles.modalSectionTitle}>XET NGHIEM &amp; CHAN DOAN</div>
					<div className={styles.modalList}>
						{billData.testItems.length > 0 ? (
							billData.testItems.map((item) => (
								<div className={styles.modalRow} key={item.name}>
									<span>{item.name}</span>
									<strong>{item.amount}</strong>
								</div>
							))
						) : (
							<div className={styles.modalRow}>
								<span>Khong co du lieu chi dinh</span>
								<strong>0 VND</strong>
							</div>
						)}
					</div>

					<div className={styles.divider} />

					<div className={styles.modalRow}>
						<span className={styles.provisionalLabel}>Tam tinh:</span>
						<strong>{billData.provisionalTotal}</strong>
					</div>

					<div className={styles.modalRowTotal}>
						<span>Tong cong:</span>
						<strong>{billData.grandTotal}</strong>
					</div>

					<button
						type="button"
						className={styles.confirmButton}
						onClick={handleConfirmPayment}
						disabled={isConfirmingPayment}
					>
						<CalendarOutlined />
						<span>{isConfirmingPayment ? 'Dang xac nhan...' : 'Xac nhan thanh toan'}</span>
					</button>
				</div>
			</Modal>
		</div>
	)
}
