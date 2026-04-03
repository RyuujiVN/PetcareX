import {
	CalendarOutlined,
	ExperimentOutlined,
	FileDoneOutlined,
	HeartOutlined,
	MedicineBoxOutlined,
	PrinterOutlined,
	SmileOutlined,
	UserOutlined,
	WarningOutlined,
} from '@ant-design/icons'
import {
	Button,
	Card,
	Col,
	Divider,
	Input,
	Modal,
	Row,
	Spin,
	Table,
	Tag,
	Typography,
	message,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
	APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
	APPOINTMENT_STATUS,
	getClinicAppointmentByIdApi,
} from '../../../../data/Clinic/api/appointmentApi'
import { INVOICE_STATUS, upsertPaidInvoiceByMedicalApi } from '../../../../data/Clinic/api/invoiceApi'
import {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../../data/Clinic/api/medicalApi'
import { getClinicPetByIdApi } from '../../../../data/Clinic/api/petApi'
import { getUserByIdApi } from '../../../../data/Clinic/api/user'
import { getMedicineUnitLabel, getPetBreedLabel, getPetSpeciesLabel, getServiceLabel } from '../../../../utils/enumLabel'
import styles from './petMedicalRecords.module.css'

const FALLBACK_TEXT = 'Không'
const CONTACT_FALLBACK_TEXT = 'Chưa cập nhật được'
const { TextArea } = Input

const formatDateLabel = (value, fallback = FALLBACK_TEXT) => {
	if (!value) return fallback
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return fallback
	return date.toLocaleDateString('vi-VN')
}

const buildExamCode = (medicalId) => {
	if (!medicalId) return '#PC-TEMP'
	return `#PC-${String(medicalId).slice(0, 8).toUpperCase()}`
}

const parseConclusionSummary = (conclusionText, fallback = FALLBACK_TEXT) => {
	const raw = String(conclusionText || '').trim()
	if (!raw) return fallback

	const summaryMatch = raw.match(/K(?:e|ế)t\s*lu(?:a|ậ)n\s*:\s*([^\n]+)/i)
	return summaryMatch?.[1]?.trim() || raw
}

const normalizeCollection = (payload) => {
	if (Array.isArray(payload)) return payload
	if (Array.isArray(payload?.items)) return payload.items
	if (Array.isArray(payload?.data)) return payload.data
	return []
}

const toDayStamp = (value) => {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

const toDateTime = (appointmentDate, appointmentTime) => {
	if (!appointmentDate) return null
	const datePart = toDayStamp(appointmentDate)
	if (!datePart) return null
	const timePart = (appointmentTime || '00:00').slice(0, 5)
	const candidate = new Date(`${datePart}T${timePart}:00`)
	return Number.isNaN(candidate.getTime()) ? null : candidate
}

const formatFieldValue = (value, fallback = FALLBACK_TEXT) => {
	if (value === null || value === undefined) return fallback
	if (typeof value === 'string' && !value.trim()) return fallback
	return String(value)
}

const resolveMedicineLabel = (item) => {
	const medicineName = item?.medicine?.name || FALLBACK_TEXT
	const strength = item?.medicine?.strength || item?.medicine?.dosage || item?.medicine?.concentration || ''
	const unitValue = item?.medicine?.unit || item?.medicine?.medicineUnit || item?.medicine?.unitType || ''
	const unitLabel = unitValue ? getMedicineUnitLabel(unitValue, unitValue) : ''
	const meta = strength && unitLabel ? `${strength} - ${unitLabel}` : strength || unitLabel

	return meta ? `${medicineName} (${meta})` : medicineName
}

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

const selectMedicalRecordByAppointment = (records, appointment) => {
	if (!Array.isArray(records) || records.length === 0) return null

	const appointmentDay = toDayStamp(appointment?.appointmentDate)
	const appointmentDateTime = toDateTime(appointment?.appointmentDate, appointment?.appointmentTime)
	const appointmentClinicId = appointment?.clinic?.id || appointment?.clinicId
	const appointmentPetName = String(appointment?.pet?.name || '').trim().toLowerCase()

	const ranked = records
		.map((record) => {
			let score = 0

			if (appointmentDay && toDayStamp(record?.createdAt) === appointmentDay) {
				score += 100
			}

			if (appointmentClinicId && String(record?.clinicId || record?.clinic?.id || '') === String(appointmentClinicId)) {
				score += 60
			}

			const recordPetName = String(record?.petName || record?.pet?.name || '').trim().toLowerCase()
			if (appointmentPetName && recordPetName && appointmentPetName === recordPetName) {
				score += 30
			}

			const recordCreatedAt = new Date(record?.createdAt || 0)
			const recordCreatedTime = recordCreatedAt.getTime()
			if (appointmentDateTime && Number.isFinite(recordCreatedTime) && recordCreatedTime > 0) {
				const diffHours = Math.abs(recordCreatedTime - appointmentDateTime.getTime()) / (1000 * 60 * 60)
				score += Math.max(0, 25 - diffHours)
			}

			return {
				record,
				score,
				createdAt: recordCreatedTime,
			}
		})
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score
			return b.createdAt - a.createdAt
		})

	return ranked[0]?.record || null
}

function ReadonlyField({ label, value }) {
	return (
		<div className={styles.readonlyField}>
			<p className={styles.fieldLabel}>{label}:</p>
			<Input value={value || FALLBACK_TEXT} readOnly />
		</div>
	)
}

function ReadonlyTextAreaField({ label, value, rows = 3 }) {
	return (
		<div className={styles.readonlyField}>
			<p className={styles.fieldLabel}>{label}:</p>
			<TextArea value={value || FALLBACK_TEXT} rows={rows} readOnly />
		</div>
	)
}

export default function PetMedicalRecords() {
	const navigate = useNavigate()
	const location = useLocation()
	const { appointmentId } = useParams()
	const isVeterinarianPortal = location.pathname.startsWith('/veterinarian')
	const routePrefix = isVeterinarianPortal ? '/veterinarian' : '/clinic'

	const stateRecord = location?.state?.record || null
	const [loading, setLoading] = useState(false)
	const [appointment, setAppointment] = useState(stateRecord)
	const [medicalRecord, setMedicalRecord] = useState(null)
	const [petDetail, setPetDetail] = useState(null)
	const [ownerDetail, setOwnerDetail] = useState(null)
	const [medicalOrders, setMedicalOrders] = useState([])
	const [medicines, setMedicines] = useState([])
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
	const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

	const loadExamDetail = useCallback(async () => {
		if (!appointmentId) return

		try {
			setLoading(true)

			let resolvedAppointment = stateRecord
			if (!resolvedAppointment || String(resolvedAppointment?.id) !== String(appointmentId)) {
				resolvedAppointment = await getClinicAppointmentByIdApi(appointmentId)
			}

			setAppointment(resolvedAppointment || null)

			const resolvedPetId =
				resolvedAppointment?.petId ||
				resolvedAppointment?.pet?.id ||
				stateRecord?.petId ||
				''

			if (!resolvedPetId) {
				setMedicalRecord(null)
				setPetDetail(null)
				setOwnerDetail(null)
				setMedicalOrders([])
				setMedicines([])
				return
			}

			const medicalPayload = await getMedicalByPetId(resolvedPetId, 1, 200)
			const medicalRecords = normalizeCollection(medicalPayload)
			const matchedMedical = selectMedicalRecordByAppointment(medicalRecords, resolvedAppointment)
			const detailedMedical = matchedMedical?.id
				? await getMedicalById(matchedMedical.id).catch(() => matchedMedical)
				: null
			const finalMedical = detailedMedical || matchedMedical || null
			const petIdForDetail = finalMedical?.petId || finalMedical?.pet?.id || matchedMedical?.petId || matchedMedical?.pet?.id || resolvedPetId

			setMedicalRecord(finalMedical)

			if (!finalMedical?.id) {
				const petPayload = petIdForDetail
					? await getClinicPetByIdApi(petIdForDetail).catch(() => null)
					: null
				const ownerId =
					petPayload?.ownerId ||
					petPayload?.owner?.id ||
					resolvedAppointment?.ownerId ||
					resolvedAppointment?.pet?.owner?.id
				const ownerPayload = ownerId
					? await getUserByIdApi(ownerId)
						.then((response) => response?.data || null)
						.catch(() => null)
					: null

				setPetDetail(petPayload || null)
				setOwnerDetail(ownerPayload || null)
				setMedicalOrders([])
				setMedicines([])
				return
			}

			const [ordersPayload, medicinesPayload, petPayload] = await Promise.all([
				getMedicalOrdersByMedicalId(finalMedical.id).catch(() => []),
				getMedicinesByMedicalId(finalMedical.id).catch(() => []),
				petIdForDetail ? getClinicPetByIdApi(petIdForDetail).catch(() => null) : null,
			])
			const ownerId =
				petPayload?.ownerId ||
				petPayload?.owner?.id ||
				finalMedical?.customerId ||
				finalMedical?.pet?.owner?.id ||
				resolvedAppointment?.ownerId ||
				resolvedAppointment?.pet?.owner?.id
			const ownerPayload = ownerId
				? await getUserByIdApi(ownerId)
					.then((response) => response?.data || null)
					.catch(() => null)
				: null

			setPetDetail(petPayload || null)
			setOwnerDetail(ownerPayload || null)
			setMedicalOrders(Array.isArray(ordersPayload) ? ordersPayload : [])
			setMedicines(Array.isArray(medicinesPayload) ? medicinesPayload : [])
		} catch (error) {
			message.error(error?.message || 'Không thể tải dữ liệu phiếu khám')
			setMedicalRecord(null)
			setPetDetail(null)
			setOwnerDetail(null)
			setMedicalOrders([])
			setMedicines([])
		} finally {
			setLoading(false)
		}
	}, [appointmentId, stateRecord])

	useEffect(() => {
		loadExamDetail()
	}, [loadExamDetail])

	const pet = useMemo(
		() => petDetail || medicalRecord?.pet || appointment?.pet || {},
		[appointment?.pet, medicalRecord?.pet, petDetail],
	)
	const owner = useMemo(() => ownerDetail || pet?.owner || {}, [ownerDetail, pet])

	const ownerName = medicalRecord?.customerName || owner?.fullName || appointment?.ownerName || FALLBACK_TEXT
	const ownerEmail = medicalRecord?.email || owner?.email || appointment?.ownerEmail || FALLBACK_TEXT
	const ownerPhone = medicalRecord?.phone || owner?.phone || appointment?.ownerPhone || CONTACT_FALLBACK_TEXT
	const ownerAddress = medicalRecord?.address || owner?.address || appointment?.ownerAddress || CONTACT_FALLBACK_TEXT
	const petName = medicalRecord?.petName || pet?.name || appointment?.petName || FALLBACK_TEXT
	const speciesCode = medicalRecord?.species || pet?.species
	const speciesLabel = getPetSpeciesLabel(speciesCode, FALLBACK_TEXT)
	const breedLabel = getPetBreedLabel(medicalRecord?.breed || pet?.breed, speciesCode, FALLBACK_TEXT)
	const weightText = formatFieldValue(medicalRecord?.weight ?? pet?.weight)
	const examName = getServiceLabel(medicalRecord?.name || appointment?.service, FALLBACK_TEXT)
	const followUpDateText = formatDateLabel(medicalRecord?.followUpDate)
	const temperatureText = formatFieldValue(medicalRecord?.temperature)
	const heartRateText = formatFieldValue(medicalRecord?.heartRate)
	const bloodPressureText =
		medicalRecord?.systolic !== null &&
		medicalRecord?.systolic !== undefined &&
		medicalRecord?.diastolic !== null &&
		medicalRecord?.diastolic !== undefined
			? `${medicalRecord.systolic}/${medicalRecord.diastolic}`
			: FALLBACK_TEXT
	const conclusionSummary = parseConclusionSummary(medicalRecord?.conclusion)

	const orderColumns = [
		{
			title: 'STT',
			dataIndex: 'index',
			width: 70,
			render: (_, __, index) => index + 1,
		},
		{
			title: 'LOẠI XÉT NGHIỆM / CHẨN ĐOÁN HÌNH ẢNH',
			dataIndex: 'medicalOrder',
			render: (medicalOrder) => medicalOrder?.nameVn || medicalOrder?.nameEng || FALLBACK_TEXT,
		},
		{
			title: 'GHI CHÚ YÊU CẦU',
			dataIndex: 'note',
			render: (value) => value || FALLBACK_TEXT,
		},
		{
			title: 'TRẠNG THÁI',
			key: 'status',
			width: 150,
			render: () => <Tag color="blue">Đã chỉ định</Tag>,
		},
	]

	const medicineColumns = [
		{
			title: 'TÊN THUỐC / HÀM LƯỢNG',
			dataIndex: 'medicine',
			render: (_, item) => resolveMedicineLabel(item),
		},
		{
			title: 'LIỀU DÙNG',
			dataIndex: 'quantity',
			render: (value) => formatFieldValue(value),
		},
		{
			title: 'TẦN SUẤT',
			dataIndex: 'note',
			render: (value) => formatFieldValue(value),
		},
		{
			title: 'GHI CHÚ',
			dataIndex: 'medicine',
			render: (medicine) => formatFieldValue(medicine?.note),
		},
	]

	const billData = useMemo(() => {
		if (!medicalRecord?.id) return EMPTY_BILL_DATA

		const medicineItems = medicines.map((item) => {
			const unitPrice = Number(item?.priceAtTime || 0)
			const quantity = Number(item?.quantity || 0)
			const amount = unitPrice * quantity
			return {
				name: `${resolveMedicineLabel(item)}${quantity > 0 ? ` x${quantity}` : ''}`,
				amount: toCurrencyVnd(amount),
				rawAmount: amount,
			}
		})

		const testItems = medicalOrders.map((item) => {
			const amount = Number(item?.priceAtTime || 0)
			return {
				name: item?.medicalOrder?.nameVn || item?.medicalOrder?.nameEng || 'Chỉ định xét nghiệm',
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
			message.warning('Chưa có phiếu khám để thanh toán')
			return
		}
		setIsPaymentModalOpen(true)
	}

	const closePaymentModal = () => {
		if (isConfirmingPayment) return
		setIsPaymentModalOpen(false)
	}

	const handleConfirmPayment = async () => {
		if (!appointmentId) {
			message.error('Không tìm thấy lịch khám để xác nhận thanh toán')
			return
		}

		if (!medicalRecord?.id) {
			message.error('Không tìm thấy hồ sơ bệnh án để thanh toán')
			return
		}

		try {
			setIsConfirmingPayment(true)

			const petOwnerId =
				pet?.ownerId ||
				pet?.owner?.id ||
				owner?.id ||
				appointment?.ownerId ||
				appointment?.pet?.owner?.id ||
				''

			await upsertPaidInvoiceByMedicalApi({
				medicalRecordId: medicalRecord.id,
				petOwnerId,
				note: 'Thanh toán tại phòng khám',
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
			message.success('Thanh toán thành công')
			navigate(`${routePrefix}/appointments`)
		} catch (error) {
			message.error(error?.message || 'Không thể xác nhận thanh toán')
		} finally {
			setIsConfirmingPayment(false)
		}
	}

	return (
		<div className={styles.pageRoot}>
			<div className={styles.pageWrap}>
				<header className={styles.formHeader}>
					<div className={styles.brandRow}>
						<div className={styles.brandIcon}>
							<SmileOutlined />
						</div>
						<div>
							<Typography.Title level={3} className={styles.titleText}>
								Hệ thống thú y chuyên nghiệp
							</Typography.Title>
						</div>
					</div>

					<div className={styles.headerMeta}>
						<p>PHIẾU KHÁM BỆNH & CHỈ ĐỊNH</p>
						<span>Mã hồ sơ: {buildExamCode(medicalRecord?.id)}</span>
						<span>Ngày khám: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)}</span>
					</div>
				</header>

				<Spin spinning={loading}>
					<Card className={styles.sectionCard}>
						<Row gutter={[16, 8]}>
							<Col xs={24} md={12} className={styles.fieldCol}>
								<ReadonlyField label="TÊN PHIẾU KHÁM" value={examName} />
							</Col>
							<Col xs={24} md={12} className={styles.fieldCol}>
								<ReadonlyField label="NGÀY TÁI KHÁM" value={followUpDateText} />
							</Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><UserOutlined /> Thông tin khách hàng & Thú cưng</span>}>
						<Row gutter={[16, 8]}>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="TÊN KHÁCH HÀNG" value={ownerName} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="EMAIL" value={ownerEmail} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="SĐT" value={ownerPhone} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="ĐỊA CHỈ" value={ownerAddress} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="TÊN THÚ CƯNG" value={petName} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="LOÀI" value={speciesLabel} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="GIỐNG LOÀI" value={breedLabel} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="CÂN NẶNG (KG)" value={weightText} /></Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><HeartOutlined /> Chỉ số sinh tồn</span>}>
						<Row gutter={[16, 8]}>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="NHIỆT ĐỘ (°C)" value={temperatureText} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="NHỊP TIM (L/P/M)" value={heartRateText} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label="HUYẾT ÁP (MMHG)" value={bloodPressureText} /></Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><WarningOutlined /> Thông tin lâm sàng</span>}>
						<ReadonlyTextAreaField label="TRIỆU CHỨNG & TÌNH TRẠNG" value={medicalRecord?.symptoms} rows={3} />
						<ReadonlyTextAreaField label="CHẨN ĐOÁN SƠ BỘ" value={medicalRecord?.diagnosis} rows={2} />
						<ReadonlyTextAreaField label="KẾT LUẬN" value={conclusionSummary} rows={3} />
					</Card>

					<Card className={styles.sectionCard} title={<span><ExperimentOutlined /> Phiếu chỉ định xét nghiệm/X-Quang</span>}>
						<Table
							rowKey={(row, index) => row?.id || `order-${index}`}
							columns={orderColumns}
							dataSource={medicalOrders}
							pagination={false}
							locale={{ emptyText: 'Chưa có chỉ định xét nghiệm' }}
						/>
					</Card>

					<Card className={styles.sectionCard} title={<span><MedicineBoxOutlined /> Đơn thuốc chỉ định</span>}>
						<Table
							rowKey={(row, index) => row?.id || `medicine-${index}`}
							columns={medicineColumns}
							dataSource={medicines}
							pagination={false}
							locale={{ emptyText: 'Chưa có đơn thuốc' }}
						/>

						<Divider className={styles.noteDivider} />
						<ReadonlyTextAreaField label="LỜI DẶN BÁC SĨ" value={medicalRecord?.note || FALLBACK_TEXT} rows={3} />

						<div className={styles.doctorSign}>
							<p>
								<CalendarOutlined /> Ngày tạo: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)}
							</p>
							<strong>BÁC SĨ ĐIỀU TRỊ</strong>
							<span>{medicalRecord?.veterinarian?.fullName || appointment?.veterinarianName || FALLBACK_TEXT}</span>
						</div>
					</Card>

					<div className={styles.actionRow}>
						<Button className={`${styles.actionBtn} ${styles.printBtn}`} icon={<PrinterOutlined />} onClick={handlePrintInvoice}>
							In hóa đơn
						</Button>
						<Button type="primary" className={`${styles.actionBtn} ${styles.payBtn}`} icon={<CalendarOutlined />} onClick={openPaymentModal}>
							Thanh toán
						</Button>
					</div>

					<Modal
						open={isPaymentModalOpen}
						onCancel={closePaymentModal}
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
								<span>Tóm tắt hóa đơn</span>
							</h3>

							<p className={styles.billCode}>MÃ HÓA ĐƠN: {billData.code}</p>

							<div className={styles.modalSectionTitle}>THUỐC ĐÃ KÊ ĐƠN</div>
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
										<span>Không có dữ liệu thuốc</span>
										<strong>0 VND</strong>
									</div>
								)}
							</div>

							<div className={styles.modalSectionTitle}>XÉT NGHIỆM & CHẨN ĐOÁN</div>
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
										<span>Không có dữ liệu chỉ định</span>
										<strong>0 VND</strong>
									</div>
								)}
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

							<button
								type="button"
								className={styles.confirmButton}
								onClick={handleConfirmPayment}
								disabled={isConfirmingPayment}
							>
								<CalendarOutlined />
								<span>{isConfirmingPayment ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}</span>
							</button>
						</div>
					</Modal>
				</Spin>
			</div>
		</div>
	)
}
