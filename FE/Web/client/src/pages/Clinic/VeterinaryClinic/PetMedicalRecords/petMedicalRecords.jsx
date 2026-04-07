import {
    CalendarOutlined,
    ExperimentOutlined,
    FileDoneOutlined,
    HeartOutlined,
    MedicineBoxOutlined,
    PrinterOutlined,
    UserOutlined,
    WarningOutlined
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
    message
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getAdminInstance } from '../../../../services/apiClient'
import {
    APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
    APPOINTMENT_STATUS,
    getAppointmentByIdApi,
} from '../../../../services/appointmentService'
import { getClinicByIdApi } from '../../../../services/clinicService'
import { INVOICE_STATUS, upsertPaidInvoiceByMedicalApi } from '../../../../services/invoiceService'
import {
    getMedicalByIdApi,
    getMedicalByPetIdApi,
    getMedicalOrdersByMedicalIdApi,
    getMedicinesByMedicalIdApi,
} from '../../../../services/medicalService'
import { getPetByIdApi } from '../../../../services/petService'
import { getUserByIdApi, getUserProfileApi } from '../../../../services/userService'
import { getCurrentAdminClinicId } from '../../../../utils/clinicIdentity'
import { getMedicineUnitLabel, getPetBreedLabel, getPetSpeciesLabel, getServiceLabel } from '../../../../utils/enumLabel'
import { formatClinicOpenHours, getClinicInfoContent } from '../../../../utils/storage/clinicInfoStorage'
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

const toCleanText = (value) => {
	if (value === null || value === undefined) return ''
	return String(value).trim()
}

const pickClinicValue = (candidates = [], blockedValues = []) => {
	const blockedSet = new Set(blockedValues.map((item) => toCleanText(item).toLowerCase()).filter(Boolean))

	for (const candidate of candidates) {
		const text = toCleanText(candidate)
		if (!text) continue
		if (blockedSet.has(text.toLowerCase())) continue
		return text
	}

	return ''
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

const escapeHtml = (value) =>
	String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')

const buildPrintRowsMarkup = (rows = []) => {
	if (!Array.isArray(rows) || rows.length === 0) {
		return '<tr><td colspan="2" class="empty-row">Không có dữ liệu</td></tr>'
	}

	return rows
		.map(
			(row) =>
				`<tr><td>${escapeHtml(row?.name || FALLBACK_TEXT)}</td><td class="price">${escapeHtml(row?.amount || '0 VND')}</td></tr>`,
		)
		.join('')
}

const printViaHiddenIframe = (html) => {
	const iframe = document.createElement('iframe')
	iframe.style.position = 'fixed'
	iframe.style.right = '0'
	iframe.style.bottom = '0'
	iframe.style.width = '0'
	iframe.style.height = '0'
	iframe.style.border = '0'
	iframe.setAttribute('aria-hidden', 'true')

	document.body.appendChild(iframe)

	const cleanup = () => {
		if (iframe.parentNode) {
			iframe.parentNode.removeChild(iframe)
		}
	}

	const frameWindow = iframe.contentWindow
	if (!frameWindow) {
		cleanup()
		return false
	}

	const frameDocument = frameWindow.document
	frameDocument.open()
	frameDocument.write(html)
	frameDocument.close()

	setTimeout(() => {
		try {
			frameWindow.focus()
			frameWindow.print()
		} finally {
			setTimeout(cleanup, 1000)
		}
	}, 80)

	return true
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
	const [clinicProfile, setClinicProfile] = useState(null)
	const [clinicDetail, setClinicDetail] = useState(null)
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
				resolvedAppointment = await getAppointmentByIdApi(getAdminInstance(), appointmentId)
			}

			const clinicIdFromAuth = getCurrentAdminClinicId()
			const clinicIdFromAppointment =
				resolvedAppointment?.clinic?.id ||
				resolvedAppointment?.clinicId ||
				stateRecord?.clinic?.id ||
				stateRecord?.clinicId ||
				''
			const preferredClinicId = clinicIdFromAppointment || clinicIdFromAuth || ''

			const [profilePayload, initialClinicPayload] = await Promise.all([
				getUserProfileApi(getAdminInstance()).catch(() => null),
				preferredClinicId ? getClinicByIdApi(getAdminInstance(), preferredClinicId).catch(() => null) : Promise.resolve(null),
			])

			const normalizedProfile = profilePayload?.data || profilePayload || null
			const clinicIdFromProfile = getCurrentAdminClinicId(normalizedProfile)
			const finalClinicId = preferredClinicId || clinicIdFromProfile || ''

			let resolvedClinicPayload = initialClinicPayload?.data || initialClinicPayload || null
			if (!resolvedClinicPayload && finalClinicId && String(finalClinicId) !== String(preferredClinicId)) {
				const retryClinicPayload = await getClinicByIdApi(getAdminInstance(), finalClinicId).catch(() => null)
				resolvedClinicPayload = retryClinicPayload?.data || retryClinicPayload || null
			}

			setClinicProfile(normalizedProfile)
			setClinicDetail(resolvedClinicPayload || normalizedProfile?.clinicInfo || normalizedProfile?.clinic || null)

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

			const medicalPayload = await getMedicalByPetIdApi(getAdminInstance(), resolvedPetId, 1, 200)
			const medicalRecords = normalizeCollection(medicalPayload)
			const matchedMedical = selectMedicalRecordByAppointment(medicalRecords, resolvedAppointment)
			const detailedMedical = matchedMedical?.id
				? await getMedicalByIdApi(getAdminInstance(), matchedMedical.id).catch(() => matchedMedical)
				: null
			const finalMedical = detailedMedical || matchedMedical || null
			const petIdForDetail = finalMedical?.petId || finalMedical?.pet?.id || matchedMedical?.petId || matchedMedical?.pet?.id || resolvedPetId

			setMedicalRecord(finalMedical)

			if (!finalMedical?.id) {
				const petPayload = petIdForDetail
					? await getPetByIdApi(getAdminInstance(), petIdForDetail).catch(() => null)
					: null
				const ownerId =
					petPayload?.ownerId ||
					petPayload?.owner?.id ||
					resolvedAppointment?.ownerId ||
					resolvedAppointment?.pet?.owner?.id
				const ownerPayload = ownerId
					? await getUserByIdApi(getAdminInstance(), ownerId)
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
				getMedicalOrdersByMedicalIdApi(getAdminInstance(), finalMedical.id).catch(() => []),
				getMedicinesByMedicalIdApi(getAdminInstance(), finalMedical.id).catch(() => []),
				petIdForDetail ? getPetByIdApi(getAdminInstance(), petIdForDetail).catch(() => null) : null,
			])
			const ownerId =
				petPayload?.ownerId ||
				petPayload?.owner?.id ||
				finalMedical?.customerId ||
				finalMedical?.pet?.owner?.id ||
				resolvedAppointment?.ownerId ||
				resolvedAppointment?.pet?.owner?.id
			const ownerPayload = ownerId
				? await getUserByIdApi(getAdminInstance(), ownerId)
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
			setClinicDetail(null)
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

	const clinicPresentation = useMemo(() => {
		const clinicId = appointment?.clinic?.id || appointment?.clinicId || clinicDetail?.id
		const clinicInfo = getClinicInfoContent(clinicId, clinicDetail || appointment?.clinic || null)
		const profileClinic = clinicProfile?.clinicInfo || clinicProfile?.clinic || null
		const openHoursFromClinicApi = formatClinicOpenHours({
			openingTime: clinicDetail?.openingTime || appointment?.clinic?.openingTime || '',
			closingTime: clinicDetail?.closingTime || appointment?.clinic?.closingTime || '',
			openingDays: clinicDetail?.openingDays || appointment?.clinic?.openingDays || '',
		})
		const openHoursFromProfile = formatClinicOpenHours({
			openingTime: profileClinic?.openingTime || '',
			closingTime: profileClinic?.closingTime || '',
			openingDays: profileClinic?.openingDays || '',
		})

		return {
			name:
				pickClinicValue([
					clinicInfo?.name,
					clinicDetail?.name,
					profileClinic?.name,
					clinicProfile?.clinicName,
					appointment?.clinic?.name,
				], ['Phòng khám thú y']) || 'Phòng khám thú y',
			address:
				pickClinicValue(
					[
						clinicInfo?.address,
						clinicDetail?.address,
						profileClinic?.address,
						appointment?.clinic?.address,
						clinicProfile?.address,
					],
					[CONTACT_FALLBACK_TEXT],
				) || CONTACT_FALLBACK_TEXT,
			phone:
				pickClinicValue(
					[
						clinicInfo?.phone,
						clinicDetail?.phone,
						clinicDetail?.phoneNumber,
						profileClinic?.phone,
						profileClinic?.phoneNumber,
						appointment?.clinic?.phone,
						appointment?.clinic?.phoneNumber,
						clinicProfile?.phone,
					],
					[CONTACT_FALLBACK_TEXT],
				) || CONTACT_FALLBACK_TEXT,
			openHours:
				pickClinicValue(
					[
						clinicInfo?.timeDisplay,
						openHoursFromClinicApi,
						openHoursFromProfile,
						appointment?.clinic?.timeDisplay,
					],
					['Chưa cập nhật được'],
				) || 'Chưa cập nhật được',
		}
	}, [
		appointment?.clinic,
		appointment?.clinicId,
		clinicDetail?.address,
		clinicDetail?.closingTime,
		clinicDetail?.id,
		clinicDetail?.name,
		clinicDetail?.openingDays,
		clinicDetail?.openingTime,
		clinicDetail?.phoneNumber,
		clinicDetail?.phone,
		clinicProfile?.address,
		clinicProfile?.clinic,
		clinicProfile?.clinicInfo,
		clinicProfile?.clinicName,
		clinicProfile?.phone,
	])

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
		if (!medicalRecord?.id) {
			message.warning('Chưa có phiếu khám để in hóa đơn')
			return
		}

		const invoiceCode = billData.code
		const examCode = buildExamCode(medicalRecord?.id)
		const examDate = formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)
		const examTime = formatFieldValue(appointment?.appointmentTime || '', 'Không')

		const medicineRows = buildPrintRowsMarkup(billData.medicineItems)
		const testRows = buildPrintRowsMarkup(billData.testItems)

		const html = `<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8" />
	<title>Hóa đơn ${escapeHtml(invoiceCode)}</title>
	<style>
		@page { size: A4; margin: 14mm; }
		* { box-sizing: border-box; }
		body { margin: 0; font-family: "Segoe UI", "Be Vietnam Pro", sans-serif; color: #1f2d44; background: #f3f6fb; }
		.sheet { width: 100%; background: #fff; border: 1px solid #d8e1ee; border-radius: 14px; overflow: hidden; }
			.header { padding: 20px 24px; background: linear-gradient(120deg, #eef4ff 0%, #f9fbff 42%, #fff 100%); border-bottom: 1px solid #dce6f3; display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 14px; align-items: start; }
			.brand { min-width: 0; }
			.brand h1 { margin: 0; font-size: 18px; color: #1b3e75; line-height: 1.32; overflow-wrap: break-word; word-break: normal; }
			.brandInfo { margin-top: 8px; }
			.brandLine { margin: 0 0 4px; display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: #5b7598; line-height: 1.45; }
			.brandLine:last-child { margin-bottom: 0; }
			.brandLabel { flex: 0 0 52px; font-weight: 600; }
			.brandValue { flex: 1; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
			.meta { text-align: right; min-width: 0; }
			.meta h2 { margin: 0; font-size: 21px; color: #234b86; letter-spacing: 0.4px; line-height: 1.2; white-space: nowrap; }
			.meta p { margin: 6px 0 0; font-size: 13px; color: #637c9f; overflow-wrap: anywhere; }
		.body { padding: 20px 24px 24px; }
		.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
		.box { border: 1px solid #dfe7f2; border-radius: 12px; padding: 12px 14px; }
		.box h3 { margin: 0 0 8px; font-size: 13px; color: #5b7496; text-transform: uppercase; letter-spacing: 0.35px; }
			.row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; font-size: 13px; margin-top: 4px; }
		.label { color: #5e779a; font-weight: 600; }
			.value { color: #1f2e46; font-weight: 700; text-align: right; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
		.section { margin-top: 16px; }
		.sectionTitle { margin: 0 0 8px; font-size: 14px; font-weight: 800; color: #2a4e84; }
		table { width: 100%; border-collapse: collapse; border: 1px solid #e0e7f2; border-radius: 10px; overflow: hidden; }
		th { text-align: left; font-size: 12px; letter-spacing: 0.25px; background: #f3f7fd; color: #4e698d; padding: 10px 12px; }
		td { padding: 10px 12px; font-size: 13px; border-top: 1px solid #edf1f7; }
		.price { text-align: right; font-weight: 700; color: #1f3557; white-space: nowrap; }
		.empty-row { text-align: center; color: #6f84a4; font-style: italic; }
		.summary { margin-top: 14px; margin-left: auto; width: min(320px, 100%); border: 1px solid #dbe5f2; border-radius: 10px; padding: 10px 12px; background: #f9fbff; }
		.summary .line { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; margin: 4px 0; }
		.summary .total { padding-top: 8px; border-top: 1px dashed #c8d7ea; margin-top: 6px; font-size: 16px; font-weight: 800; color: #1e3f73; }
		.footer { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
		.note { border: 1px solid #dfe7f2; border-radius: 10px; padding: 10px 12px; min-height: 78px; font-size: 13px; line-height: 1.45; color: #2a3d5d; }
		.sign { text-align: right; font-size: 13px; color: #37557f; }
		.sign strong { display: block; margin-top: 36px; font-size: 15px; color: #1e375d; }
		@media (max-width: 760px) {
			.header { grid-template-columns: minmax(0, 1fr) 290px; }
			.grid { grid-template-columns: 1fr; }
			.footer { grid-template-columns: 1fr; }
		}
		@media print {
			body { background: #fff; }
			.sheet { border: none; border-radius: 0; }
		}
	</style>
</head>
<body>
	<article class="sheet">
		<header class="header">
			<div class="brand">
				<h1>${escapeHtml(clinicPresentation.name)}</h1>
				<div class="brandInfo">
					<p class="brandLine"><span class="brandLabel">Địa chỉ:</span><span class="brandValue">${escapeHtml(clinicPresentation.address)}</span></p>
					<p class="brandLine"><span class="brandLabel">SĐT:</span><span class="brandValue">${escapeHtml(clinicPresentation.phone)}</span></p>
					<p class="brandLine"><span class="brandLabel">Giờ mở:</span><span class="brandValue">${escapeHtml(clinicPresentation.openHours)}</span></p>
				</div>
			</div>
			<div class="meta">
				<h2>HÓA ĐƠN KHÁM BỆNH</h2>
				<p>Mã hóa đơn: ${escapeHtml(invoiceCode)}</p>
				<p>Mã hồ sơ: ${escapeHtml(examCode)}</p>
				<p>Ngày khám: ${escapeHtml(examDate)} ${escapeHtml(examTime !== 'Không' ? `- ${examTime}` : '')}</p>
			</div>
		</header>
		<section class="body">
			<div class="grid">
				<div class="box">
					<h3>Khách hàng</h3>
					<div class="row"><span class="label">Tên</span><span class="value">${escapeHtml(ownerName)}</span></div>
					<div class="row"><span class="label">SĐT</span><span class="value">${escapeHtml(ownerPhone)}</span></div>
					<div class="row"><span class="label">Địa chỉ</span><span class="value">${escapeHtml(ownerAddress)}</span></div>
				</div>
				<div class="box">
					<h3>Thú cưng</h3>
					<div class="row"><span class="label">Tên</span><span class="value">${escapeHtml(petName)}</span></div>
					<div class="row"><span class="label">Loài / Giống</span><span class="value">${escapeHtml(`${speciesLabel} / ${breedLabel}`)}</span></div>
					<div class="row"><span class="label">Cân nặng</span><span class="value">${escapeHtml(weightText)} kg</span></div>
				</div>
			</div>

			<div class="section">
				<h3 class="sectionTitle">Thuốc đã kê</h3>
				<table>
					<thead><tr><th>Nội dung</th><th class="price">Thành tiền</th></tr></thead>
					<tbody>${medicineRows}</tbody>
				</table>
			</div>

			<div class="section">
				<h3 class="sectionTitle">Xét nghiệm & chỉ định</h3>
				<table>
					<thead><tr><th>Nội dung</th><th class="price">Thành tiền</th></tr></thead>
					<tbody>${testRows}</tbody>
				</table>
			</div>

			<div class="summary">
				<div class="line"><span>Tạm tính</span><strong>${escapeHtml(billData.provisionalTotal)}</strong></div>
				<div class="line total"><span>Tổng cộng</span><strong>${escapeHtml(billData.grandTotal)}</strong></div>
			</div>

			<div class="footer">
				<div class="note">
					<strong>Lời dặn bác sĩ:</strong><br/>
					${escapeHtml(formatFieldValue(medicalRecord?.note))}
				</div>
				<div class="sign">
					Ngày in: ${escapeHtml(formatDateLabel(new Date().toISOString()))}<br/>
					Bác sĩ điều trị
					<strong>${escapeHtml(medicalRecord?.veterinarian?.fullName || appointment?.veterinarianName || FALLBACK_TEXT)}</strong>
				</div>
			</div>
		</section>
	</article>
</body>
</html>`

		const printed = printViaHiddenIframe(html)
		if (!printed) {
			message.error('Không thể khởi tạo chế độ in. Vui lòng thử lại.')
		}
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

			await upsertPaidInvoiceByMedicalApi(getAdminInstance(), {
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
					<div className={styles.headerMeta}>
						<p>PHIẾU KHÁM BỆNH & CHỈ ĐỊNH</p>
						<span style={{marginRight: 135}}>Mã hồ sơ: {buildExamCode(medicalRecord?.id)}</span>
						<span style={{marginRight: 155}}>Ngày khám: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)}</span>
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
							<div className={styles.modalClinicMeta}>
								<span>{clinicPresentation.name}</span>
								<span>Khách hàng: {ownerName}</span>
								<span>Thú cưng: {petName}</span>
							</div>

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
