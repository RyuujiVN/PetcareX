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
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getAdminInstance } from '../../../../services/apiClient'
import {
	APPOINTMENT_PAYMENT_STATUS_MAP_STORAGE_KEY,
    APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
    APPOINTMENT_STATUS,
    getAppointmentByIdApi,
} from '../../../../services/appointmentService'
import { getClinicByIdApi } from '../../../../services/clinicService'
import { INVOICE_STATUS, upsertPaidInvoiceByMedicalApi } from '../../../../services/invoiceService'
import {
    getMedicalByIdApi,
    getMedicalByPetIClinicdApi,
    getMedicalByPetIdApi,
    getMedicalOrdersByMedicalIdApi,
    getMedicinesByMedicalIdApi,
} from '../../../../services/medicalService'
import { getPetByIdApi } from '../../../../services/petService'
import { getUserByIdApi, getUserProfileApi } from '../../../../services/userService'
import { getCurrentAdminClinicId } from '../../../../utils/clinicIdentity'
import { formatDateDDMMYYYY, formatTimeHHMM } from '../../../../utils/dateTimeFormat'
import { getMedicineUnitLabel, getPetBreedLabel, getPetSpeciesLabel, getServiceLabel } from '../../../../utils/enumLabel'
import { formatClinicOpenHours, getClinicInfoContent } from '../../../../utils/storage/clinicInfoStorage'
import styles from './petMedicalRecords.module.css'

const FALLBACK_TEXT = '-'
const CONTACT_FALLBACK_TEXT = '-'
const { TextArea } = Input

const formatDateLabel = (value, _locale = 'vi-VN', fallback = FALLBACK_TEXT) => {
	return formatDateDDMMYYYY(value, fallback)
}

const buildExamCode = (medicalId) => {
	if (!medicalId) return '#PC-TEMP'
	return `#PC-${String(medicalId).slice(0, 8).toUpperCase()}`
}

const parseConclusionSummary = (conclusionText, fallback = FALLBACK_TEXT) => {
	const raw = String(conclusionText || '').trim()
	if (!raw) return fallback

	const summaryMatch = raw.match(/(K(?:e|ế)t\s*lu(?:a|ậ)n|Conclusion)\s*:\s*([^\n]+)/i)
	if (summaryMatch?.[2]?.trim()) return summaryMatch[2].trim()
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

const resolveMedicineLabel = (item, fallbackText = FALLBACK_TEXT) => {
	const medicineName = item?.medicine?.name || fallbackText
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

const toCurrencyVnd = (value, locale = 'vi-VN', currencySuffix = 'VND') => {
	const amount = Number(value || 0)
	if (!Number.isFinite(amount) || amount <= 0) return `0 ${currencySuffix}`
	return `${amount.toLocaleString(locale)} ${currencySuffix}`
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

const buildPrintRowsMarkup = (rows = [], emptyLabel = 'No data', fallbackText = FALLBACK_TEXT, zeroAmountLabel = '0 VND') => {
	if (!Array.isArray(rows) || rows.length === 0) {
		return `<tr><td colspan="2" class="empty-row">${escapeHtml(emptyLabel)}</td></tr>`
	}

	return rows
		.map(
			(row) =>
				`<tr><td>${escapeHtml(row?.name || fallbackText)}</td><td class="price">${escapeHtml(row?.amount || zeroAmountLabel)}</td></tr>`,
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
	const { t, i18n } = useTranslation('clinic')
	const navigate = useNavigate()
	const location = useLocation()
	const { appointmentId } = useParams()
	const isVeterinarianPortal = location.pathname.startsWith('/veterinarian')
	const routePrefix = isVeterinarianPortal ? '/veterinarian' : '/clinic'
	const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN'
	const fallbackText = t('medicalRecords.common.fallback')
	const contactFallbackText = t('medicalRecords.common.contactFallback')
	const noDataCurrency = t('medicalRecords.common.zeroVnd')

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

			const medicalPayload = await getMedicalByPetIClinicdApi(getAdminInstance(), resolvedPetId, 1, 200)
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
			message.error(error?.message || t('medicalRecords.messages.loadExamFailed'))
			setMedicalRecord(null)
			setPetDetail(null)
			setOwnerDetail(null)
			setClinicDetail(null)
			setMedicalOrders([])
			setMedicines([])
		} finally {
			setLoading(false)
		}
	}, [appointmentId, stateRecord, t])

	useEffect(() => {
		loadExamDetail()
	}, [loadExamDetail])

	const pet = useMemo(
		() => petDetail || medicalRecord?.pet || appointment?.pet || {},
		[appointment?.pet, medicalRecord?.pet, petDetail],
	)
	const owner = useMemo(() => ownerDetail || pet?.owner || {}, [ownerDetail, pet])

	const ownerName = medicalRecord?.customerName || owner?.fullName || appointment?.ownerName || fallbackText
	const ownerEmail = medicalRecord?.email || owner?.email || appointment?.ownerEmail || fallbackText
	const ownerPhone = medicalRecord?.phone || owner?.phone || appointment?.ownerPhone || contactFallbackText
	const ownerAddress = medicalRecord?.address || owner?.address || appointment?.ownerAddress || contactFallbackText
	const petName = medicalRecord?.petName || pet?.name || appointment?.petName || fallbackText
	const speciesCode = medicalRecord?.species || pet?.species
	const speciesLabel = getPetSpeciesLabel(speciesCode, fallbackText)
	const breedLabel = getPetBreedLabel(medicalRecord?.breed || pet?.breed, speciesCode, fallbackText)
	const weightText = formatFieldValue(medicalRecord?.weight ?? pet?.weight, fallbackText)
	const examName = getServiceLabel(medicalRecord?.name || appointment?.service, fallbackText)
	const followUpDateText = formatDateLabel(medicalRecord?.followUpDate, locale, fallbackText)
	const temperatureText = formatFieldValue(medicalRecord?.temperature, fallbackText)
	const heartRateText = formatFieldValue(medicalRecord?.heartRate, fallbackText)
	const bloodPressureText =
		medicalRecord?.systolic !== null &&
		medicalRecord?.systolic !== undefined &&
		medicalRecord?.diastolic !== null &&
		medicalRecord?.diastolic !== undefined
			? `${medicalRecord.systolic}/${medicalRecord.diastolic}`
			: fallbackText
	const conclusionSummary = parseConclusionSummary(medicalRecord?.conclusion, fallbackText)

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
				], [t('medicalRecords.clinic.defaultName')]) || t('medicalRecords.clinic.defaultName'),
			address:
				pickClinicValue(
					[
						clinicInfo?.address,
						clinicDetail?.address,
						profileClinic?.address,
						appointment?.clinic?.address,
						clinicProfile?.address,
					],
					[contactFallbackText],
				) || contactFallbackText,
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
					[contactFallbackText],
				) || contactFallbackText,
			openHours:
				pickClinicValue(
					[
						clinicInfo?.timeDisplay,
						openHoursFromClinicApi,
						openHoursFromProfile,
						appointment?.clinic?.timeDisplay,
					],
					[contactFallbackText],
				) || contactFallbackText,
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
		contactFallbackText,
		t,
	])

	const orderColumns = [
		{
			title: t('medicalRecords.petExam.table.index'),
			dataIndex: 'index',
			width: 70,
			render: (_, __, index) => index + 1,
		},
		{
			title: t('medicalRecords.petExam.table.orderType'),
			dataIndex: 'medicalOrder',
			render: (medicalOrder) => medicalOrder?.nameVn || medicalOrder?.nameEng || fallbackText,
		},
		{
			title: t('medicalRecords.petExam.table.orderNote'),
			dataIndex: 'note',
			render: (value) => value || fallbackText,
		},
		{
			title: t('medicalRecords.petExam.table.status'),
			key: 'status',
			width: 150,
			render: () => <Tag color="blue">{t('medicalRecords.petExam.table.assigned')}</Tag>,
		},
	]

	const medicineColumns = [
		{
			title: t('medicalRecords.petExam.table.medicineName'),
			dataIndex: 'medicine',
			render: (_, item) => resolveMedicineLabel(item, fallbackText),
		},
		{
			title: t('medicalRecords.petExam.table.dosage'),
			dataIndex: 'quantity',
			render: (value) => formatFieldValue(value, fallbackText),
		},
		{
			title: t('medicalRecords.petExam.table.frequency'),
			dataIndex: 'note',
			render: (value) => formatFieldValue(value, fallbackText),
		},
		{
			title: t('medicalRecords.petExam.table.note'),
			dataIndex: 'medicine',
			render: (medicine) => formatFieldValue(medicine?.note, fallbackText),
		},
	]

	const billData = useMemo(() => {
		if (!medicalRecord?.id) return EMPTY_BILL_DATA

		const medicineItems = medicines.map((item) => {
			const unitPrice = Number(item?.priceAtTime || 0)
			const quantity = Number(item?.quantity || 0)
			const amount = unitPrice * quantity
			return {
				name: `${resolveMedicineLabel(item, fallbackText)}${quantity > 0 ? ` x${quantity}` : ''}`,
				amount: toCurrencyVnd(amount, locale, t('medicalRecords.common.currencyVnd')),
				rawAmount: amount,
			}
		})

		const testItems = medicalOrders.map((item) => {
			const amount = Number(item?.priceAtTime || 0)
			return {
				name: item?.medicalOrder?.nameVn || item?.medicalOrder?.nameEng || t('medicalRecords.petExam.defaultOrderName'),
				amount: toCurrencyVnd(amount, locale, t('medicalRecords.common.currencyVnd')),
				rawAmount: amount,
			}
		})

		const subtotal = [...medicineItems, ...testItems].reduce((sum, row) => sum + Number(row.rawAmount || 0), 0)

		return {
			code: buildInvoiceCode(medicalRecord.id),
			medicineItems,
			testItems,
			provisionalTotal: toCurrencyVnd(subtotal, locale, t('medicalRecords.common.currencyVnd')),
			grandTotal: toCurrencyVnd(subtotal, locale, t('medicalRecords.common.currencyVnd')),
		}
	}, [fallbackText, locale, medicalOrders, medicalRecord?.id, medicines, t])

	const handlePrintInvoice = () => {
		if (!medicalRecord?.id) {
			message.warning(t('medicalRecords.messages.noExamToPrint'))
			return
		}

		const invoiceCode = billData.code
		const examCode = buildExamCode(medicalRecord?.id)
		const examDate = formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate, locale, fallbackText)
		const examTime = formatTimeHHMM(appointment?.appointmentTime, t('medicalRecords.common.none'))

		const medicineRows = buildPrintRowsMarkup(
			billData.medicineItems,
			t('medicalRecords.petExam.invoice.noMedicineData'),
			fallbackText,
			noDataCurrency,
		)
		const testRows = buildPrintRowsMarkup(
			billData.testItems,
			t('medicalRecords.petExam.invoice.noOrderData'),
			fallbackText,
			noDataCurrency,
		)

		const html = `<!DOCTYPE html>
<html lang="${escapeHtml(i18n.language?.startsWith('en') ? 'en' : 'vi')}">
<head>
	<meta charset="UTF-8" />
	<title>${escapeHtml(t('medicalRecords.petExam.invoice.title'))} ${escapeHtml(invoiceCode)}</title>
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
					<p class="brandLine"><span class="brandLabel">${escapeHtml(t('medicalRecords.petExam.invoice.addressLabel'))}:</span><span class="brandValue">${escapeHtml(clinicPresentation.address)}</span></p>
					<p class="brandLine"><span class="brandLabel">${escapeHtml(t('medicalRecords.petExam.invoice.phoneLabel'))}:</span><span class="brandValue">${escapeHtml(clinicPresentation.phone)}</span></p>
					<p class="brandLine"><span class="brandLabel">${escapeHtml(t('medicalRecords.petExam.invoice.openHoursLabel'))}:</span><span class="brandValue">${escapeHtml(clinicPresentation.openHours)}</span></p>
				</div>
			</div>
			<div class="meta">
				<h2>${escapeHtml(t('medicalRecords.petExam.invoice.headerTitle'))}</h2>
				<p>${escapeHtml(t('medicalRecords.petExam.invoice.codeLabel'))}: ${escapeHtml(invoiceCode)}</p>
				<p>${escapeHtml(t('medicalRecords.petExam.invoice.examCodeLabel'))}: ${escapeHtml(examCode)}</p>
				<p>${escapeHtml(t('medicalRecords.petExam.invoice.examDateLabel'))}: ${escapeHtml(examDate)} ${escapeHtml(examTime !== t('medicalRecords.common.none') ? `- ${examTime}` : '')}</p>
			</div>
		</header>
		<section class="body">
			<div class="grid">
				<div class="box">
					<h3>${escapeHtml(t('medicalRecords.petExam.invoice.customerSection'))}</h3>
					<div class="row"><span class="label">${escapeHtml(t('medicalRecords.petExam.invoice.nameLabel'))}</span><span class="value">${escapeHtml(ownerName)}</span></div>
					<div class="row"><span class="label">${escapeHtml(t('medicalRecords.petExam.invoice.phoneLabel'))}</span><span class="value">${escapeHtml(ownerPhone)}</span></div>
					<div class="row"><span class="label">${escapeHtml(t('medicalRecords.petExam.invoice.addressLabel'))}</span><span class="value">${escapeHtml(ownerAddress)}</span></div>
				</div>
				<div class="box">
					<h3>${escapeHtml(t('medicalRecords.petExam.invoice.petSection'))}</h3>
					<div class="row"><span class="label">${escapeHtml(t('medicalRecords.petExam.invoice.nameLabel'))}</span><span class="value">${escapeHtml(petName)}</span></div>
					<div class="row"><span class="label">${escapeHtml(t('medicalRecords.petExam.invoice.speciesBreedLabel'))}</span><span class="value">${escapeHtml(`${speciesLabel} / ${breedLabel}`)}</span></div>
					<div class="row"><span class="label">${escapeHtml(t('medicalRecords.petExam.invoice.weightLabel'))}</span><span class="value">${escapeHtml(weightText)} kg</span></div>
				</div>
			</div>

			<div class="section">
				<h3 class="sectionTitle">${escapeHtml(t('medicalRecords.petExam.invoice.medicineSection'))}</h3>
				<table>
					<thead><tr><th>${escapeHtml(t('medicalRecords.petExam.invoice.contentColumn'))}</th><th class="price">${escapeHtml(t('medicalRecords.petExam.invoice.amountColumn'))}</th></tr></thead>
					<tbody>${medicineRows}</tbody>
				</table>
			</div>

			<div class="section">
				<h3 class="sectionTitle">${escapeHtml(t('medicalRecords.petExam.invoice.orderSection'))}</h3>
				<table>
					<thead><tr><th>${escapeHtml(t('medicalRecords.petExam.invoice.contentColumn'))}</th><th class="price">${escapeHtml(t('medicalRecords.petExam.invoice.amountColumn'))}</th></tr></thead>
					<tbody>${testRows}</tbody>
				</table>
			</div>

			<div class="summary">
				<div class="line"><span>${escapeHtml(t('medicalRecords.petExam.invoice.provisionalTotal'))}</span><strong>${escapeHtml(billData.provisionalTotal)}</strong></div>
				<div class="line total"><span>${escapeHtml(t('medicalRecords.petExam.invoice.grandTotal'))}</span><strong>${escapeHtml(billData.grandTotal)}</strong></div>
			</div>

			<div class="footer">
				<div class="note">
					<strong>${escapeHtml(t('medicalRecords.petExam.invoice.doctorNote'))}:</strong><br/>
					${escapeHtml(formatFieldValue(medicalRecord?.note, fallbackText))}
				</div>
				<div class="sign">
					${escapeHtml(t('medicalRecords.petExam.invoice.printDate'))}: ${escapeHtml(formatDateLabel(new Date().toISOString(), locale, fallbackText))}<br/>
					${escapeHtml(t('medicalRecords.petExam.invoice.attendingVet'))}
					<strong>${escapeHtml(medicalRecord?.veterinarian?.fullName || appointment?.veterinarianName || fallbackText)}</strong>
				</div>
			</div>
		</section>
	</article>
</body>
</html>`

		const printed = printViaHiddenIframe(html)
		if (!printed) {
			message.error(t('medicalRecords.messages.printInitFailed'))
		}
	}

	const openPaymentModal = () => {
		if (!medicalRecord?.id) {
			message.warning(t('medicalRecords.messages.noExamToPay'))
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
			message.error(t('medicalRecords.messages.appointmentNotFoundForPayment'))
			return
		}

		if (!medicalRecord?.id) {
			message.error(t('medicalRecords.messages.medicalNotFoundForPayment'))
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
				note: t('medicalRecords.petExam.payment.noteAtClinic'),
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

			try {
				const rawMap = localStorage.getItem(APPOINTMENT_PAYMENT_STATUS_MAP_STORAGE_KEY)
				const parsedMap = rawMap ? JSON.parse(rawMap) : {}
				const nextMap = {
					...(parsedMap && typeof parsedMap === 'object' ? parsedMap : {}),
					[String(appointmentId)]: INVOICE_STATUS.PAID,
				}
				localStorage.setItem(APPOINTMENT_PAYMENT_STATUS_MAP_STORAGE_KEY, JSON.stringify(nextMap))
			} catch {
			}

			setIsPaymentModalOpen(false)
			message.success(t('medicalRecords.messages.paymentSuccess'))
			navigate(`${routePrefix}/appointments`)
		} catch (error) {
			message.error(error?.message || t('medicalRecords.messages.paymentFailed'))
		} finally {
			setIsConfirmingPayment(false)
		}
	}

	return (
		<div className={styles.pageRoot}>
			<header className={styles.topBar}>
				<h1>{t('medicalRecords.petExam.header.title')}</h1>
				<div className={styles.topBarActionSpacer} aria-hidden="true" />
			</header>
			<div className={styles.pageWrap}>
				<header className={styles.formHeader}>
					<div className={styles.headerMeta}>
						<span>{t('medicalRecords.petExam.header.examCode')}: {buildExamCode(medicalRecord?.id)}</span>
						<span>{t('medicalRecords.petExam.header.examDate')}: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate, locale, fallbackText)}</span>
					</div>
				</header>

				<Spin spinning={loading}>
					<Card className={styles.sectionCard}>
						<Row gutter={[16, 8]}>
							<Col xs={24} md={12} className={styles.fieldCol}>
								<ReadonlyField label={t('medicalRecords.petExam.fields.examName')} value={examName} />
							</Col>
							<Col xs={24} md={12} className={styles.fieldCol}>
								<ReadonlyField label={t('medicalRecords.petExam.fields.followUpDate')} value={followUpDateText} />
							</Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><UserOutlined /> {t('medicalRecords.petExam.sections.customerPetInfo')}</span>}>
						<Row gutter={[16, 8]}>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.customerName')} value={ownerName} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.email')} value={ownerEmail} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.phone')} value={ownerPhone} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.address')} value={ownerAddress} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.petName')} value={petName} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.species')} value={speciesLabel} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.breed')} value={breedLabel} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.weightKg')} value={weightText} /></Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><HeartOutlined /> {t('medicalRecords.petExam.sections.vitals')}</span>}>
						<Row gutter={[16, 8]}>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.temperature')} value={temperatureText} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.heartRate')} value={heartRateText} /></Col>
							<Col xs={24} md={8} className={styles.fieldCol}><ReadonlyField label={t('medicalRecords.petExam.fields.bloodPressure')} value={bloodPressureText} /></Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><WarningOutlined /> {t('medicalRecords.petExam.sections.clinicalInfo')}</span>}>
						<ReadonlyTextAreaField label={t('medicalRecords.petExam.fields.symptoms')} value={medicalRecord?.symptoms} rows={3} />
						<ReadonlyTextAreaField label={t('medicalRecords.petExam.fields.preDiagnosis')} value={medicalRecord?.diagnosis} rows={2} />
						<ReadonlyTextAreaField label={t('medicalRecords.petExam.fields.conclusion')} value={conclusionSummary} rows={3} />
					</Card>

					<Card className={styles.sectionCard} title={<span><ExperimentOutlined /> {t('medicalRecords.petExam.sections.orders')}</span>}>
						<Table
							rowKey={(row, index) => row?.id || `order-${index}`}
							columns={orderColumns}
							dataSource={medicalOrders}
							pagination={false}
							locale={{ emptyText: t('medicalRecords.petExam.empty.noOrders') }}
						/>
					</Card>

					<Card className={styles.sectionCard} title={<span><MedicineBoxOutlined /> {t('medicalRecords.petExam.sections.medicines')}</span>}>
						<Table
							rowKey={(row, index) => row?.id || `medicine-${index}`}
							columns={medicineColumns}
							dataSource={medicines}
							pagination={false}
							locale={{ emptyText: t('medicalRecords.petExam.empty.noMedicines') }}
						/>

						<Divider className={styles.noteDivider} />
						<ReadonlyTextAreaField label={t('medicalRecords.petExam.fields.doctorNote')} value={medicalRecord?.note || fallbackText} rows={3} />

						<div className={styles.doctorSign}>
							<p>
								<CalendarOutlined /> {t('medicalRecords.petExam.fields.createdDate')}: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate, locale, fallbackText)}
							</p>
							<strong>{t('medicalRecords.petExam.fields.attendingVet')}</strong>
							<span>{medicalRecord?.veterinarian?.fullName || appointment?.veterinarianName || fallbackText}</span>
						</div>
					</Card>

					<div className={styles.actionRow}>
						<Button className={`${styles.actionBtn} ${styles.printBtn}`} icon={<PrinterOutlined />} onClick={handlePrintInvoice}>
							{t('medicalRecords.petExam.actions.printInvoice')}
						</Button>
						<Button type="primary" className={`${styles.actionBtn} ${styles.payBtn}`} icon={<CalendarOutlined />} onClick={openPaymentModal}>
							{t('medicalRecords.petExam.actions.pay')}
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
								<span>{t('medicalRecords.petExam.payment.summaryTitle')}</span>
							</h3>

							<p className={styles.billCode}>{t('medicalRecords.petExam.payment.invoiceCode')}: {billData.code}</p>
							<div className={styles.modalClinicMeta}>
								<span>{clinicPresentation.name}</span>
								<span>{t('medicalRecords.petExam.payment.customerLabel')}: {ownerName}</span>
								<span>{t('medicalRecords.petExam.payment.petLabel')}: {petName}</span>
							</div>

							<div className={styles.modalSectionTitle}>{t('medicalRecords.petExam.payment.medicineSection')}</div>
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
										<span>{t('medicalRecords.petExam.payment.noMedicineData')}</span>
										<strong>{noDataCurrency}</strong>
									</div>
								)}
							</div>

							<div className={styles.modalSectionTitle}>{t('medicalRecords.petExam.payment.orderSection')}</div>
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
										<span>{t('medicalRecords.petExam.payment.noOrderData')}</span>
										<strong>{noDataCurrency}</strong>
									</div>
								)}
							</div>

							<div className={styles.divider} />

							<div className={styles.modalRow}>
								<span className={styles.provisionalLabel}>{t('medicalRecords.petExam.payment.provisionalTotal')}:</span>
								<strong>{billData.provisionalTotal}</strong>
							</div>

							<div className={styles.modalRowTotal}>
								<span>{t('medicalRecords.petExam.payment.grandTotal')}:</span>
								<strong>{billData.grandTotal}</strong>
							</div>

							<button
								type="button"
								className={styles.confirmButton}
								onClick={handleConfirmPayment}
								disabled={isConfirmingPayment}
							>
								<CalendarOutlined />
								<span>{isConfirmingPayment ? t('medicalRecords.petExam.payment.confirming') : t('medicalRecords.petExam.payment.confirmButton')}</span>
							</button>
						</div>
					</Modal>
				</Spin>
			</div>
		</div>
	)
}
