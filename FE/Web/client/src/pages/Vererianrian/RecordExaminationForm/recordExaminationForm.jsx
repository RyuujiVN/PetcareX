import {
	DeleteOutlined,
	DownOutlined,
	ExperimentOutlined,
	HeartOutlined,
	InfoCircleOutlined,
	MedicineBoxOutlined,
	PlusCircleOutlined,
	SaveOutlined,
	UpOutlined,
	UserOutlined,
	WarningOutlined,
} from '@ant-design/icons'
import {
	Alert,
	Button,
	Card,
	Checkbox,
	Col,
	DatePicker,
	Divider,
	Form,
	Input,
	InputNumber,
	message,
	Modal,
	Row,
	Select,
	Spin,
	Tabs,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ADMIN_AUTH_STORAGE, getAdminAuthItem } from '../../../constants/authStorage'
import { ServiceEnum } from '../../../enum/service.enum'
import i18n from '../../../i18n'
import { getAdminInstance } from '../../../services/apiClient'
import {
	APPOINTMENT_PAYMENT_SYNC_EVENT_KEY,
	APPOINTMENT_STATUS,
	getMyAppointmentsApi,
	updateAppointmentStatusApi,
} from '../../../services/appointmentService'
import { getInvoiceByMedicalRecordIdApi, INVOICE_STATUS } from '../../../services/invoiceService'
import {
	createMedicalMedicineApi,
	createMedicalOrderApi,
	createMedicalRecordApi,
	deleteMedicalOrderApi,
	deleteMedicineApi,
	getMedicalByIdApi,
	getMedicalByPetIClinicdApi,
	getMedicalOrderCatalogApi,
	getMedicalOrdersByMedicalIdApi,
	getMedicineCatalogApi,
	getMedicinesByMedicalIdApi,
	updateMedicalRecordApi
} from '../../../services/medicalService'
import {
	getBreedLabel,
	getBreedsBySpeciesApi,
	getPetByIdApi,
	getPetsByOwnerApi,
	getPetSpeciesApi,
	getSpeciesLabel,
} from '../../../services/petService'
import { getUserListApi, updateUserProfileApi } from '../../../services/userService'
import { formatDateDDMMYYYY } from '../../../utils/dateTimeFormat'
import { getMedicineUnitLabel, getServiceLabel } from '../../../utils/enumLabel'
import styles from './recordExaminationForm.module.css'

const VET_APPOINTMENT_MEDICAL_MAP_STORAGE_KEY = 'veterinarian:appointmentMedicalMap'

const tVet = (key, options = {}) => i18n.t(key, { ns: 'vererianrian', ...options })

const normalizeCollection = (payload) => {

	if (Array.isArray(payload)) return payload
	if (Array.isArray(payload?.items)) return payload.items
	if (Array.isArray(payload?.data)) return payload.data
	return []
}

const getMedicalOrderOptionLabel = (item) => {
	const label = item?.nameVn || item?.name || item?.nameEng || item?.title || item?.code
	if (label) return label
	if (item?.id) return `${tVet('examForm.record.fallbacks.orderUnnamed')} #${String(item.id).slice(0, 6).toUpperCase()}`
	return tVet('examForm.record.fallbacks.notUpdated')
}

const getMedicineOptionLabel = (item) => {
	const name =
		item?.name ||
		item?.nameVn ||
		item?.nameEng ||
		item?.tradeName ||
		item?.code ||
		tVet('examForm.record.fallbacks.notUpdated')
	const strength = item?.strength || item?.concentration || item?.dosage || ''
	const unitValue = item?.unit || item?.medicineUnit || item?.unitType || ''
	const unitLabel = unitValue ? getMedicineUnitLabel(unitValue, unitValue) : ''
	const meta = strength && unitLabel ? `${strength} - ${unitLabel}` : strength || unitLabel

	return meta ? `${name} (${meta})` : name
}

const toNumberOrUndefined = (value) => {
	if (value === null || value === undefined || value === '') return undefined
	const normalized = Number(value)
	return Number.isFinite(normalized) ? normalized : undefined
}

const parseLegacyBloodPressure = (value) => {
	if (value === null || value === undefined || value === '') {
		return {
			systolic: undefined,
			diastolic: undefined,
		}
	}

	if (typeof value === 'number') {
		return {
			systolic: toNumberOrUndefined(value),
			diastolic: undefined,
		}
	}

	const normalized = String(value).trim()
	if (!normalized) {
		return {
			systolic: undefined,
			diastolic: undefined,
		}
	}

	const segments = normalized.split(/[/-]/).map((item) => toNumberOrUndefined(item))
	if (segments.length >= 2) {
		return {
			systolic: segments[0],
			diastolic: segments[1],
		}
	}

	return {
		systolic: toNumberOrUndefined(normalized),
		diastolic: undefined,
	}
}

const normalizePhone = (value) => String(value || '').replace(/\D/g, '')

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const buildErrorMessage = (error, fallback) => {
	const responseMessage = error?.response?.data?.message
	if (Array.isArray(responseMessage) && responseMessage.length > 0) {
		return responseMessage.filter(Boolean).join(' | ')
	}

	return error?.message || fallback
}

const buildConclusionText = (summary) => {
	const normalizedSummary = String(summary || '').trim()
	if (!normalizedSummary) return undefined
	return normalizedSummary
}

const formatDateLabel = (value, fallback = tVet('examForm.record.fallbacks.notUpdated')) => {
	return formatDateDDMMYYYY(value, fallback)
}

const formatFollowUpDateLabel = (value) => formatDateLabel(value, tVet('examForm.record.fallbacks.notAvailable'))

const resolveRecordName = (name, fallback = tVet('examForm.record.fallbacks.recordName')) => {
	if (!name) return fallback
	return getServiceLabel(name, name) || fallback
}

const resolveRecordExamDate = (record) =>
	formatDateLabel(
		record?.appointment?.appointmentDate ||
			record?.appointmentDate ||
			record?.examDate ||
			record?.visitDate ||
			record?.createdAt,
	)

const resolveMedicineUnitLabel = (item) => {
	const unitValue =
		item?.medicine?.unit ||
		item?.medicine?.medicineUnit ||
		item?.medicine?.unitType ||
		item?.unit ||
		item?.unitType ||
		''
	if (!unitValue) return ''
	return getMedicineUnitLabel(unitValue, unitValue)
}

const formatMedicineQuantityLabel = (item) => {
	if (!item?.quantity) return ''
	const unitLabel = resolveMedicineUnitLabel(item)
	return ` (${item.quantity}${unitLabel ? ` ${unitLabel}` : ''})`
}

const formatHistoryMedicineSummary = (medicines) => {
	if (!Array.isArray(medicines) || medicines.length === 0) return tVet('examForm.record.fallbacks.none')

	return medicines
		.map((item) => {
			const medicineName = item?.medicine?.name || item?.medicine?.nameVn || tVet('examForm.record.fallbacks.medicineUnnamed')
			return `${medicineName}${formatMedicineQuantityLabel(item)}`
		})
		.join(', ')
}

const formatHistoryOrderSummary = (orders) => {
	if (!Array.isArray(orders) || orders.length === 0) return tVet('examForm.record.fallbacks.none')

	return orders
		.map(
			(item) =>
				item?.medicalOrder?.nameVn ||
				item?.medicalOrder?.nameEng ||
				item?.medicalOrder?.name ||
				tVet('examForm.record.fallbacks.orderUnnamed'),
		)
		.join(', ')
}

const formatVitalValue = (value, suffix = '') => {
	if (value === null || value === undefined || value === '') return tVet('examForm.record.fallbacks.notUpdated')
	return suffix ? `${value} ${suffix}` : String(value)
}

const formatBloodPressure = (systolic, diastolic) => {
	if (!systolic && !diastolic) return tVet('examForm.record.fallbacks.notUpdated')
	if (systolic && diastolic) return `${systolic}/${diastolic} mmHg`
	return `${systolic || diastolic} mmHg`
}

const formatGenderLabel = (gender) => {
	if (typeof gender === 'boolean') return gender ? tVet('examForm.record.options.male') : tVet('examForm.record.options.female')
	if (!gender) return tVet('examForm.record.fallbacks.notUpdated')
	const normalizedGender = String(gender).trim().toLowerCase()
	if (normalizedGender === 'male') return tVet('examForm.record.options.male')
	if (normalizedGender === 'female') return tVet('examForm.record.options.female')
	return String(gender)
}

const getAgeLabel = (birthday) => {
	if (!birthday) return tVet('examForm.record.fallbacks.ageNotUpdated')
	const birthDate = new Date(birthday)
	if (Number.isNaN(birthDate.getTime())) return tVet('examForm.record.fallbacks.ageNotUpdated')

	const now = new Date()
	let totalMonths =
		(now.getFullYear() - birthDate.getFullYear()) * 12 +
		(now.getMonth() - birthDate.getMonth())

	if (now.getDate() < birthDate.getDate()) {
		totalMonths -= 1
	}

	if (totalMonths < 0) return tVet('examForm.record.fallbacks.ageNotUpdated')
	if (totalMonths < 24) return tVet('examForm.record.age.months', { count: totalMonths })
	return tVet('examForm.record.age.years', { count: Math.floor(totalMonths / 12) })
}

const resolveServiceTypeFromName = (name) => {
	const trimmedName = String(name || '').trim()
	if (!trimmedName) return undefined

	return Object.values(ServiceEnum).find(
		(service) => getServiceLabel(service, '') === trimmedName,
	)
}

const readAppointmentMedicalMap = () => {
	if (typeof window === 'undefined') return {}

	try {
		const raw = window.localStorage.getItem(VET_APPOINTMENT_MEDICAL_MAP_STORAGE_KEY)
		if (!raw) return {}
		const parsed = JSON.parse(raw)
		return parsed && typeof parsed === 'object' ? parsed : {}
	} catch {
		return {}
	}
}

const resolveAppointmentLinkedMedicalId = (appointmentId) => {
	const appointmentKey = String(appointmentId || '').trim()
	if (!appointmentKey) return ''

	const map = readAppointmentMedicalMap()
	const entry = map[appointmentKey]

	if (typeof entry === 'string') return entry
	if (entry && typeof entry === 'object' && entry.medicalId) {
		return String(entry.medicalId)
	}

	return ''
}

const persistAppointmentMedicalLink = (appointmentId, medicalId) => {
	const appointmentKey = String(appointmentId || '').trim()
	const medicalKey = String(medicalId || '').trim()
	if (!appointmentKey || !medicalKey || typeof window === 'undefined') return

	try {
		const map = readAppointmentMedicalMap()
		map[appointmentKey] = {
			medicalId: medicalKey,
			updatedAt: new Date().toISOString(),
		}

		window.localStorage.setItem(
			VET_APPOINTMENT_MEDICAL_MAP_STORAGE_KEY,
			JSON.stringify(map),
		)
	} catch {
		// Ignore localStorage write errors (private mode, quota, etc.).
	}
}

const removeAppointmentMedicalLink = (appointmentId) => {
	const appointmentKey = String(appointmentId || '').trim()
	if (!appointmentKey || typeof window === 'undefined') return

	try {
		const map = readAppointmentMedicalMap()
		if (!(appointmentKey in map)) return
		delete map[appointmentKey]

		window.localStorage.setItem(
			VET_APPOINTMENT_MEDICAL_MAP_STORAGE_KEY,
			JSON.stringify(map),
		)
	} catch {
		// Ignore localStorage write errors (private mode, quota, etc.).
	}
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
	const dayStamp = toDayStamp(appointmentDate)
	if (!dayStamp) return null
	const timeStamp = String(appointmentTime || '00:00').slice(0, 5)
	const candidate = new Date(`${dayStamp}T${timeStamp}:00`)
	return Number.isNaN(candidate.getTime()) ? null : candidate
}

const inferMedicalRecordForCompletedAppointment = (records, appointment) => {
	if (!Array.isArray(records) || records.length === 0 || !appointment) return null

	const appointmentStatus = String(appointment?.status || '').toUpperCase()
	if (appointmentStatus !== APPOINTMENT_STATUS.COMPLETED) return null

	const appointmentDay = toDayStamp(appointment?.appointmentDate)
	if (!appointmentDay) return null

	const appointmentClinicId = String(appointment?.clinicId || appointment?.clinic?.id || '')
	const appointmentPetName = String(
		appointment?.petName || appointment?.petRaw?.name || appointment?.pet?.name || '',
	).trim().toLowerCase()
	const appointmentServiceName = String(
		getServiceLabel(appointment?.service, appointment?.service || appointment?.formName || '') ||
			appointment?.formName ||
			'',
	).trim().toLowerCase()
	const appointmentDateTime = toDateTime(appointment?.appointmentDate, appointment?.appointmentTime)

	const candidates = records.filter((record) => {
		if (toDayStamp(record?.createdAt) !== appointmentDay) return false

		const recordClinicId = String(record?.clinicId || record?.clinic?.id || '')
		if (appointmentClinicId && recordClinicId && appointmentClinicId !== recordClinicId) return false

		const recordPetName = String(record?.petName || record?.pet?.name || '').trim().toLowerCase()
		if (appointmentPetName && recordPetName && appointmentPetName !== recordPetName) return false

		const recordServiceName = String(record?.name || '').trim().toLowerCase()
		if (appointmentServiceName && recordServiceName && appointmentServiceName !== recordServiceName) return false

		return true
	})

	if (candidates.length === 0) return null

	const ranked = candidates
		.map((record) => {
			const createdAt = new Date(record?.createdAt || 0).getTime()
			const diffMs =
				appointmentDateTime && Number.isFinite(createdAt) && createdAt > 0
					? Math.abs(createdAt - appointmentDateTime.getTime())
					: Number.POSITIVE_INFINITY

			return {
				record,
				createdAt,
				diffMs,
			}
		})
		.filter((item) => Boolean(item?.record?.id))

	if (ranked.length === 0) return null

	const strictWindowMs = 12 * 60 * 60 * 1000
	const strictMatches = ranked.filter((item) => Number.isFinite(item.diffMs) && item.diffMs <= strictWindowMs)
	const source = strictMatches.length > 0 ? strictMatches : ranked

	source.sort((a, b) => {
		if (a.diffMs !== b.diffMs) return a.diffMs - b.diffMs
		return b.createdAt - a.createdAt
	})

	return source[0]?.record || null
}

const buildInitialValues = (
	appointment,
	latestMedical,
	editableMedicalRecord,
	editableOrders,
	editableMedicines,
	options = {},
) => {
	const isWalkIn = Boolean(options.isWalkIn)
	const pet = appointment?.petRaw || appointment?.pet || {}
	const owner = pet?.owner || {}
	const latestWeight = toNumberOrUndefined(editableMedicalRecord?.weight ?? latestMedical?.weight)
	const petWeight = toNumberOrUndefined(pet?.weight)
	const serviceLabel = appointment?.service
		? getServiceLabel(appointment.service, appointment.service)
		: appointment?.formName || ''
	const medicalOrders = Array.isArray(editableOrders)
		? editableOrders
				.map((item) => ({
					medicalOrderId: item?.medicalOrderId || item?.medicalOrder?.id || undefined,
					note: item?.note || '',
				}))
				.filter((item) => item.medicalOrderId || item.note)
		: []
	const medicines = Array.isArray(editableMedicines)
		? editableMedicines
				.map((item) => ({
					medicineId: item?.medicineId || item?.medicine?.id || undefined,
					quantity: toNumberOrUndefined(item?.quantity),
					frequency: item?.note || '',
				}))
				.filter((item) => item.medicineId || item.quantity || item.frequency)
		: []

	const resolvedServiceType = isWalkIn
		? resolveServiceTypeFromName(editableMedicalRecord?.name || appointment?.formName)
		: undefined
	const legacyBloodPressure = parseLegacyBloodPressure(
		editableMedicalRecord?.bloodPressure ?? editableMedicalRecord?.blood_pressure,
	)
	const systolicValue = toNumberOrUndefined(editableMedicalRecord?.systolic ?? legacyBloodPressure.systolic)
	const diastolicValue = toNumberOrUndefined(editableMedicalRecord?.diastolic ?? legacyBloodPressure.diastolic)

	// For walk-in reopen, hydrate customer/pet fields from the existing record (BE doesn't store email/phone there).
	const recordPet = editableMedicalRecord?.pet || {}
	const recordOwner = recordPet?.owner || {}

	return {
		formName: isWalkIn ? '' : serviceLabel,
		serviceType: resolvedServiceType,
		enableFollowUpDate: Boolean(editableMedicalRecord?.followUpDate),
		followUpDate: editableMedicalRecord?.followUpDate ? dayjs(editableMedicalRecord.followUpDate) : null,
		customerName: isWalkIn
			? recordOwner?.fullName || ''
			: appointment?.ownerName || owner?.fullName || '',
		email: isWalkIn
			? recordOwner?.email || ''
			: owner?.email || appointment?.ownerEmail || '',
		phone: isWalkIn
			? normalizePhone(recordOwner?.phone || '')
			: normalizePhone(owner?.phone || appointment?.ownerPhone || ''),
		petName: isWalkIn
			? recordPet?.name || editableMedicalRecord?.petName || ''
			: appointment?.petName || pet?.name || '',
		species: isWalkIn ? recordPet?.species || undefined : pet?.species || undefined,
		breed: isWalkIn ? recordPet?.breed || undefined : pet?.breed || undefined,
		weight: latestWeight ?? petWeight,
		temperature: toNumberOrUndefined(editableMedicalRecord?.temperature),
		heartRate: toNumberOrUndefined(editableMedicalRecord?.heartRate),
		systolic: systolicValue,
		diastolic: diastolicValue,
		clinicalSymptoms: editableMedicalRecord?.symptoms || '',
		preliminaryDiagnosis: editableMedicalRecord?.diagnosis || '',
		conclusionSummary: editableMedicalRecord?.conclusion || '',
		note: editableMedicalRecord?.note || '',
		medicalOrders: medicalOrders.length > 0 ? medicalOrders : [
			{
				medicalOrderId: undefined,
				note: '',
			},
		],
		medicines: medicines.length > 0 ? medicines : [
			{
				medicineId: undefined,
				quantity: undefined,
				frequency: '',
			},
		],
	}
}

const toAppointmentViewModel = (item) => {
	const pet = item?.pet || {}
	const owner = pet?.owner || {}

	return {
		appointmentId: item?.id,
		status: item?.status,
		service: item?.service,
		appointmentDate: item?.appointmentDate || null,
		appointmentTime: item?.appointmentTime || '',
		clinicId: item?.clinic?.id || item?.clinicId || '',
		petName: pet?.name,
		ownerName: owner?.fullName,
		ownerId: owner?.id,
		ownerEmail: owner?.email || '',
		ownerPhone: normalizePhone(owner?.phone || ''),
		formName: getServiceLabel(item?.service, item?.service),
		medical: item?.medical || null,
		petRaw: pet,
	}
}

const normalizeRowsPayload = (rows = []) => rows.filter((row) => row && Object.values(row).some(Boolean))

export default function RecordExaminationForm() {
	const { t } = useTranslation('vererianrian')
	const [form] = Form.useForm()
	const navigate = useNavigate()
	const location = useLocation()
	const [searchParams] = useSearchParams()

	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [appointment, setAppointment] = useState(location?.state?.appointment || null)
	const [medicalOrderOptions, setMedicalOrderOptions] = useState([])
	const [medicineOptions, setMedicineOptions] = useState([])
	const [speciesOptions, setSpeciesOptions] = useState([])
	const [breedOptions, setBreedOptions] = useState([])
	const [latestMedicalRecord, setLatestMedicalRecord] = useState(null)
	const [editableMedicalRecord, setEditableMedicalRecord] = useState(null)
	const [editableMedicalOrders, setEditableMedicalOrders] = useState([])
	const [editableMedicines, setEditableMedicines] = useState([])
	const [isLockedByPayment, setIsLockedByPayment] = useState(false)
	const [isResolvingExamState, setIsResolvingExamState] = useState(true)
	const [isDirty, setIsDirty] = useState(false)
	const enableFollowUpDate = Form.useWatch('enableFollowUpDate', form)
	const [historyLoading, setHistoryLoading] = useState(false)
	const [historyRecords, setHistoryRecords] = useState([])
	const [expandedHistoryRecords, setExpandedHistoryRecords] = useState(() => new Set())
	const [historyPet, setHistoryPet] = useState(null)
	const [petDetail, setPetDetail] = useState(null)
	const initialSnapshotRef = useRef('')

	const isWalkIn = String(searchParams.get('mode') || '').toLowerCase() === 'walkin'
	const appointmentId = searchParams.get('appointmentId')
	const walkInMedicalId = isWalkIn ? searchParams.get('medicalId') : null
	// When opening from the unified list with ?medicalId=XXX (no appointmentId, not walkin),
	// we need to load the medical record directly by ID.
	const directMedicalId = !isWalkIn && !appointmentId ? searchParams.get('medicalId') : null
	const [mappedMedicalId, setMappedMedicalId] = useState(() =>
		resolveAppointmentLinkedMedicalId(searchParams.get('appointmentId')),
	)
	const editableMedicalId = editableMedicalRecord?.id || appointment?.medical?.id || ''
	const isReadOnlyForm = isLockedByPayment || (!isWalkIn && isResolvingExamState)

	useEffect(() => {
		setMappedMedicalId(resolveAppointmentLinkedMedicalId(appointmentId))
	}, [appointmentId])

	const historyPetId = useMemo(() => {
		return (
			appointment?.petRaw?.id ||
			appointment?.pet?.id ||
			appointment?.petId ||
			editableMedicalRecord?.pet?.id ||
			latestMedicalRecord?.pet?.id ||
			''
		)
	}, [appointment?.pet?.id, appointment?.petRaw?.id, appointment?.petId, editableMedicalRecord?.pet?.id, latestMedicalRecord?.pet?.id])

	useEffect(() => {
		let active = true

		const loadPetDetail = async () => {
			if (!historyPetId) {
				if (active) setPetDetail(null)
				return
			}

			try {
				const payload = await getPetByIdApi(getAdminInstance(), historyPetId)
				if (active) setPetDetail(payload || null)
			} catch {
				if (active) setPetDetail(null)
			}
		}

		loadPetDetail()

		return () => {
			active = false
		}
	}, [historyPetId])

	const hydrateByAppointmentId = useCallback(async () => {
		if (isWalkIn) return
		if (!appointmentId || location?.state?.appointment?.appointmentId === appointmentId) return

		const response = await getMyAppointmentsApi(getAdminInstance(), 1, 500)
		const items = Array.isArray(response?.items) ? response.items : []
		const found = items.find((item) => String(item?.id) === String(appointmentId))
		if (found) {
			setAppointment(toAppointmentViewModel(found))
		}
	}, [appointmentId, isWalkIn, location?.state?.appointment])

	const loadMetaData = useCallback(async () => {
		setLoading(true)
		try {
			// Hydrate appointment independently — failure must NOT block catalog loading
			try {
				await hydrateByAppointmentId()
			} catch (appointmentError) {
				console.warn('[loadMetaData] hydrateByAppointmentId failed:', appointmentError?.message)
			}

			// Load each catalog independently so one failure does not block the others
			const [medicalOrdersResult, medicinesResult, speciesResult] = await Promise.allSettled([
				getMedicalOrderCatalogApi(getAdminInstance()),
				getMedicineCatalogApi(getAdminInstance()),
				getPetSpeciesApi(getAdminInstance()),
			])

			if (medicalOrdersResult.status === 'fulfilled') {
				setMedicalOrderOptions(normalizeCollection(medicalOrdersResult.value))
			} else {
				console.warn('[loadMetaData] Không tải được danh mục chỉ định:', medicalOrdersResult.reason?.message)
			}

			if (medicinesResult.status === 'fulfilled') {
				setMedicineOptions(normalizeCollection(medicinesResult.value))
			} else {
				console.warn('[loadMetaData] Không tải được danh mục thuốc:', medicinesResult.reason?.message)
			}

			if (speciesResult.status === 'fulfilled') {
				setSpeciesOptions(normalizeCollection(speciesResult.value))
			}
		} catch (error) {
			message.error(error?.message || t('examForm.record.messages.loadMetaError'))
		} finally {
			setLoading(false)
		}
	}, [hydrateByAppointmentId, t])

	useEffect(() => {
		loadMetaData()
	}, [loadMetaData])

	useEffect(() => {
		const initialValues = buildInitialValues(
			appointment,
			latestMedicalRecord,
			editableMedicalRecord,
			editableMedicalOrders,
			editableMedicines,
			{ isWalkIn },
		)
		form.setFieldsValue(initialValues)
		const snapshot = JSON.stringify(initialValues)
		initialSnapshotRef.current = snapshot
		setIsDirty(false)
	}, [appointment, editableMedicalOrders, editableMedicalRecord, editableMedicines, form, latestMedicalRecord, isWalkIn])

	useEffect(() => {
		let active = true

		const hydrateLatestMedicalRecord = async () => {
			if (active && !isWalkIn) {
				setIsResolvingExamState(true)
			}

			if (isWalkIn) {
				// If reopening an existing walk-in record, hydrate it
				if (walkInMedicalId) {
					try {
						const resolvedMedical = await getMedicalByIdApi(getAdminInstance(), walkInMedicalId).catch(() => null)
						if (!resolvedMedical || !active) {
							if (active) setIsResolvingExamState(false)
							return
						}

						const [orders, medicines] = await Promise.all([
							getMedicalOrdersByMedicalIdApi(getAdminInstance(), resolvedMedical.id).catch(() => []),
							getMedicinesByMedicalIdApi(getAdminInstance(), resolvedMedical.id).catch(() => []),
						])

						if (!active) return

						setEditableMedicalRecord(resolvedMedical)
						setEditableMedicalOrders(Array.isArray(orders) ? orders : [])
						setEditableMedicines(Array.isArray(medicines) ? medicines : [])

						try {
							const invoice = await getInvoiceByMedicalRecordIdApi(getAdminInstance(), resolvedMedical.id)
							if (active) {
								setIsLockedByPayment(invoice?.status === INVOICE_STATUS.PAID)
							}
						} catch (invoiceErr) {
							if (active) {
								setIsLockedByPayment(invoiceErr?.response?.status === 404 ? false : false)
							}
						}
					} catch {
						// Ignore — form starts blank
					}
				}
				if (active) {
					setIsResolvingExamState(false)
				}
				return
			}

			// --- Direct medical record from unified list (?medicalId=XXX, no appointment) ---
			if (directMedicalId) {
				try {
					const resolvedMedical = await getMedicalByIdApi(getAdminInstance(), directMedicalId).catch(() => null)
					if (!resolvedMedical || !active) {
						if (active) setIsResolvingExamState(false)
						return
					}

					const [orders, medicines] = await Promise.all([
						getMedicalOrdersByMedicalIdApi(getAdminInstance(), resolvedMedical.id).catch(() => []),
						getMedicinesByMedicalIdApi(getAdminInstance(), resolvedMedical.id).catch(() => []),
					])

					if (!active) return

					setEditableMedicalRecord(resolvedMedical)
					setEditableMedicalOrders(Array.isArray(orders) ? orders : [])
					setEditableMedicines(Array.isArray(medicines) ? medicines : [])

					try {
						const invoice = await getInvoiceByMedicalRecordIdApi(getAdminInstance(), resolvedMedical.id)
						if (active) {
							setIsLockedByPayment(invoice?.status === INVOICE_STATUS.PAID)
						}
					} catch (invoiceErr) {
						if (active) {
							setIsLockedByPayment(invoiceErr?.response?.status === 404 ? false : false)
						}
					}
				} catch {
					// Ignore — form starts blank
				}
				if (active) {
					setIsResolvingExamState(false)
				}
				return
			}

			const petId = appointment?.petRaw?.id || appointment?.pet?.id || appointment?.petId
			const appointmentMedicalId = appointment?.medical?.id
			const linkedMedicalId = appointmentMedicalId || mappedMedicalId

			if (active) {
				setEditableMedicalRecord(null)
				setEditableMedicalOrders([])
				setEditableMedicines([])
			}

			if (!petId) {
				if (active) {
					setLatestMedicalRecord(null)
					setIsLockedByPayment(false)
					if (mappedMedicalId && appointmentId) {
						removeAppointmentMedicalLink(appointmentId)
						setMappedMedicalId('')
					}
					setIsResolvingExamState(false)
				}
				return
			}

			try {
				const payload = await getMedicalByPetIClinicdApi(getAdminInstance(),petId, 1, 200)
				const records = Array.isArray(payload?.items)
					? payload.items
					: Array.isArray(payload?.data)
						? payload.data
						: Array.isArray(payload)
							? payload
							: []

				if (!active) return

				if (records.length === 0) {
					setLatestMedicalRecord(null)
					setIsLockedByPayment(false)
					if (mappedMedicalId && appointmentId) {
						removeAppointmentMedicalLink(appointmentId)
						setMappedMedicalId('')
					}
					return
				}

				const latestRecord = [...records].sort((a, b) => {
					const aTime = new Date(a?.createdAt || 0).getTime()
					const bTime = new Date(b?.createdAt || 0).getTime()
					return bTime - aTime
				})[0]

				setLatestMedicalRecord(latestRecord || null)

				const matchedMedicalById = linkedMedicalId
					? records.find((record) => String(record?.id || '') === String(linkedMedicalId)) || null
					: null
				const inferredMedicalByCompletedAppointment =
					!matchedMedicalById
						? inferMedicalRecordForCompletedAppointment(records, appointment)
						: null
				const matchedMedical = matchedMedicalById || inferredMedicalByCompletedAppointment

				if (!matchedMedical) {
					setIsLockedByPayment(false)
					if (mappedMedicalId && !appointmentMedicalId && appointmentId) {
						removeAppointmentMedicalLink(appointmentId)
						setMappedMedicalId('')
					}
					return
				}

				const idToFetch = matchedMedical?.id || linkedMedicalId
				const resolvedMedical = idToFetch
					? await getMedicalByIdApi(getAdminInstance(),idToFetch).catch(() => matchedMedical || null)
					: null
				if (!resolvedMedical || !active) {
					setIsLockedByPayment(false)
					if (mappedMedicalId && !appointmentMedicalId && appointmentId) {
						removeAppointmentMedicalLink(appointmentId)
						setMappedMedicalId('')
					}
					return
				}

				const [orders, medicines] = await Promise.all([
					getMedicalOrdersByMedicalIdApi(getAdminInstance(),resolvedMedical.id).catch(() => []),
					getMedicinesByMedicalIdApi(getAdminInstance(),resolvedMedical.id).catch(() => []),
				])

				if (!active) return

				setEditableMedicalRecord(resolvedMedical)
				setEditableMedicalOrders(Array.isArray(orders) ? orders : [])
				setEditableMedicines(Array.isArray(medicines) ? medicines : [])

				try {
					const invoice = await getInvoiceByMedicalRecordIdApi(getAdminInstance(), resolvedMedical.id)
					if (active) {
						setIsLockedByPayment(invoice?.status === INVOICE_STATUS.PAID)
					}
				} catch (error) {
					if (!active) return
					if (error?.response?.status === 404) {
						setIsLockedByPayment(false)
						return
					}

					setIsLockedByPayment(false)
				}

				if (appointmentId && resolvedMedical?.id) {
					const nextMedicalId = String(resolvedMedical.id)
					persistAppointmentMedicalLink(appointmentId, nextMedicalId)
					if (nextMedicalId !== mappedMedicalId) {
						setMappedMedicalId(nextMedicalId)
					}
				}
			} catch {
				if (active) {
					setLatestMedicalRecord(null)
					setIsLockedByPayment(false)
					setEditableMedicalRecord(null)
					setEditableMedicalOrders([])
					setEditableMedicines([])
				}
			} finally {
				if (active) {
					setIsResolvingExamState(false)
				}
			}
		}

		hydrateLatestMedicalRecord()

		return () => {
			active = false
		}
	}, [appointment, appointmentId, mappedMedicalId, isWalkIn, walkInMedicalId, directMedicalId])

	useEffect(() => {
		let active = true

		const loadHistoryRecords = async () => {
			if (isWalkIn) {
				if (active) {
					setHistoryRecords([])
					setHistoryPet(null)
				}
				return
			}

			if (!historyPetId) {
				if (active) {
					setHistoryRecords([])
					setHistoryPet(null)
				}
				return
			}

			try {
				setHistoryLoading(true)
				// TODO: Check pet owner's sharing permission before displaying medical records.
				const payload = await getMedicalByPetIClinicdApi(getAdminInstance(),historyPetId, 1, 200)
				let records = normalizeCollection(payload)
				if (!active) return

				if (records.length === 0) {
					setHistoryRecords([])
					setHistoryPet(appointment?.petRaw || appointment?.pet || null)
					return
				}

				records = await Promise.all(
					records.map(async (record) => {
						if (!record?.id) return record
						const detail = await getMedicalByIdApi(getAdminInstance(),record.id).catch(() => null)
						return detail ? { ...record, ...detail } : record
					}),
				)

				records.sort((a, b) => {
					const aTime = new Date(a?.createdAt || 0).getTime()
					const bTime = new Date(b?.createdAt || 0).getTime()
					return bTime - aTime
				})

				const enriched = await Promise.all(
					records.map(async (record) => {
						const [orders, medicines] = await Promise.all([
							getMedicalOrdersByMedicalIdApi(getAdminInstance(),record.id).catch(() => []),
							getMedicinesByMedicalIdApi(getAdminInstance(),record.id).catch(() => []),
						])

						return {
							record,
							orders: Array.isArray(orders) ? orders : [],
							medicines: Array.isArray(medicines) ? medicines : [],
						}
					}),
				)

				if (!active) return
				setHistoryRecords(enriched)
				setHistoryPet(records[0]?.pet || appointment?.petRaw || appointment?.pet || null)
			} catch (error) {
				if (active) {
					setHistoryRecords([])
					setHistoryPet(appointment?.petRaw || appointment?.pet || null)
					console.warn('[loadHistoryRecords]', error?.message)
				}
			} finally {
				if (active) {
					setHistoryLoading(false)
				}
			}
		}

		loadHistoryRecords()

		return () => {
			active = false
		}
	}, [appointment?.pet, appointment?.petRaw, appointment?.pet?.id, appointment?.petRaw?.id, historyPetId, isWalkIn])

	useEffect(() => {
		const syncPaymentLock = (event) => {
			if (event.key !== APPOINTMENT_PAYMENT_SYNC_EVENT_KEY || !event.newValue || !appointmentId) return

			try {
				const payload = JSON.parse(event.newValue)
				if (String(payload?.appointmentId || '') !== String(appointmentId)) return

				if (payload?.paymentStatus === INVOICE_STATUS.PAID) {
					setIsLockedByPayment(true)
				}
			} catch {
				// Ignore malformed cross-tab sync payload.
			}
		}

		window.addEventListener('storage', syncPaymentLock)
		return () => {
			window.removeEventListener('storage', syncPaymentLock)
		}
	}, [appointmentId])

	useEffect(() => {
		setExpandedHistoryRecords(new Set())
	}, [historyRecords])

	const toggleHistoryRecord = useCallback((recordId) => {
		setExpandedHistoryRecords((prev) => {
			const next = new Set(prev)
			if (next.has(recordId)) {
				next.delete(recordId)
			} else {
				next.add(recordId)
			}
			return next
		})
	}, [])

	const selectedSpecies = Form.useWatch('species', form)

	useEffect(() => {
		let mounted = true

		const loadBreeds = async () => {
			if (!selectedSpecies) {
				if (mounted) setBreedOptions([])
				return
			}

			try {
				const breeds = await getBreedsBySpeciesApi(getAdminInstance(), selectedSpecies)
				if (mounted) {
					setBreedOptions(Array.isArray(breeds) ? breeds : [])
				}
			} catch {
				if (mounted) {
					setBreedOptions([])
				}
			}
		}

		loadBreeds()

		return () => {
			mounted = false
		}
	}, [selectedSpecies])

	const doctorName = useMemo(() => {
		if (location?.state?.doctorName) return location.state.doctorName

		try {
			const rawProfile = getAdminAuthItem(ADMIN_AUTH_STORAGE.userInfoKey)
			if (!rawProfile) return t('examForm.record.signature.defaultDoctor')

			const profile = JSON.parse(rawProfile)
			return profile?.fullName || profile?.user?.fullName || t('examForm.record.signature.defaultDoctor')
		} catch {
			return t('examForm.record.signature.defaultDoctor')
		}
	}, [location?.state?.doctorName, t])

	const prescriptionDate = useMemo(() => {
		return dayjs().format('DD/MM/YYYY')
	}, [])

	const examinationCode = useMemo(() => {
		const prefix = isWalkIn ? 'WK' : 'AP'
		if (appointmentId) {
			return `${prefix}-${String(appointmentId).slice(0, 8).toUpperCase()}`
		}

		return `${prefix}-${dayjs().format('YYYYMMDDHHmm')}`
	}, [appointmentId, isWalkIn])

	const hasCreatedMedical = Boolean(editableMedicalId)
	const shouldShowExamStateAlerts = isWalkIn || !isResolvingExamState
	const historySummary = useMemo(() => {
		const sourcePet = petDetail || historyPet
		if (!sourcePet) return null
		const weightValue =
			sourcePet?.weight ??
			latestMedicalRecord?.weight ??
			editableMedicalRecord?.weight ??
			null

		return {
			name: sourcePet?.name || t('examForm.record.fallbacks.notUpdated'),
			species: getSpeciesLabel(sourcePet?.species),
			breed: getBreedLabel(sourcePet?.breed, sourcePet?.species),
			birthday: formatDateLabel(sourcePet?.dateOfBirth),
			age: getAgeLabel(sourcePet?.dateOfBirth),
			gender: formatGenderLabel(sourcePet?.gender),
			weight: weightValue ? `${weightValue} kg` : t('examForm.record.fallbacks.notUpdated'),
		}
	}, [editableMedicalRecord?.weight, historyPet, latestMedicalRecord?.weight, petDetail, t])

	const patientInfo = useMemo(() => {
		const isWalkInReopen = isWalkIn && Boolean(editableMedicalRecord)
		if (isWalkIn && !isWalkInReopen) return null

		const pet =
			petDetail ||
			appointment?.petRaw ||
			appointment?.pet ||
			editableMedicalRecord?.pet ||
			null
		const owner =
			pet?.owner ||
			appointment?.petRaw?.owner ||
			editableMedicalRecord?.pet?.owner ||
			{}
		if (!pet && !owner?.id) return null

		const noInfo = t('examForm.record.patientInfo.noInfo')
		const petWeightValue =
			pet?.weight ??
			latestMedicalRecord?.weight ??
			editableMedicalRecord?.weight ??
			null

		const resolvedPhone = normalizePhone(owner?.phone || appointment?.ownerPhone || '')

		return {
			hasPhone: Boolean(resolvedPhone),
			ownerName: owner?.fullName || appointment?.ownerName || noInfo,
			ownerEmail: owner?.email || appointment?.ownerEmail || noInfo,
			ownerPhone: resolvedPhone || noInfo,
			petName: pet?.name || appointment?.petName || noInfo,
			petSpecies: pet?.species ? getSpeciesLabel(pet.species) : noInfo,
			petBreed: pet?.breed ? getBreedLabel(pet.breed, pet.species) : noInfo,
			petGender: pet?.gender !== undefined && pet?.gender !== null ? formatGenderLabel(pet.gender) : noInfo,
			petAge: pet?.dateOfBirth ? getAgeLabel(pet.dateOfBirth) : noInfo,
			petWeight: petWeightValue ? `${petWeightValue} kg` : noInfo,
		}
	}, [appointment, editableMedicalRecord, isWalkIn, latestMedicalRecord?.weight, petDetail, t])

	const serviceOptions = useMemo(() => {
		return Object.values(ServiceEnum).map((service) => ({
			value: service,
			label: getServiceLabel(service),
		}))
	}, [])

	const handleValuesChange = (_, allValues) => {
		const normalized = {
			...allValues,
			medicalOrders: normalizeRowsPayload(allValues?.medicalOrders || []),
			medicines: normalizeRowsPayload(allValues?.medicines || []),
		}
		setIsDirty(JSON.stringify(normalized) !== initialSnapshotRef.current)
	}

	const goBackToList = () => {
		navigate(isWalkIn ? '/veterinarian/exam-forms?tab=walkin' : '/veterinarian/exam-forms')
	}

	const handleCancel = () => {
		if (!isDirty) {
			goBackToList()
			return
		}

		Modal.confirm({
			title: t('examForm.record.confirm.cancelTitle'),
			content: t('examForm.record.confirm.cancelContent'),
			okText: t('examForm.record.confirm.cancelOk'),
			cancelText: t('examForm.record.confirm.cancelCancel'),
			onOk: goBackToList,
		})
	}

	const showWalkInStep = (content, type = 'loading') => {
		message[type]({
			content,
			key: 'walkin-step',
			duration: type === 'loading' ? 0 : type === 'error' ? 4 : 2,
		})
	}

	const findExistingUserByEmail = async (email) => {
		try {
			const searchResponse = await getUserListApi(getAdminInstance(), 1, 50, email)
			const payload = searchResponse.data
			const users = normalizeCollection(payload)
			return users.find((user) => normalizeEmail(user?.email) === email) || null
		} catch {
			return null
		}
	}

	const findPetByOwnerAndName = async (ownerId, petName) => {
		try {
			const payload = await getPetsByOwnerApi(getAdminInstance(), { ownerId, page: 1, limit: 200 })
			const pets = normalizeCollection(payload)
			const normalizedName = String(petName || '').trim().toLowerCase()
			return pets.find((pet) => String(pet?.name || '').trim().toLowerCase() === normalizedName) || null
		} catch {
			return null
		}
	}

	const handleWalkInSubmit = async (values) => {
		if (isReadOnlyForm) {
			message.warning(t('examForm.record.messages.lockedWarning'))
			return
		}

		const normalizedEmail = normalizeEmail(values.email)
		const normalizedPhone = normalizePhone(values.phone)
		const temperature = toNumberOrUndefined(values.temperature)
		const heartRate = toNumberOrUndefined(values.heartRate)
		const systolic = toNumberOrUndefined(values.systolic)
		const diastolic = toNumberOrUndefined(values.diastolic)
		const weight = toNumberOrUndefined(values.weight)
		const selectedServiceType = values.serviceType
		const resolvedServiceName = selectedServiceType ? getServiceLabel(selectedServiceType, '') : ''

		if (
			temperature === undefined ||
			heartRate === undefined ||
			systolic === undefined ||
			diastolic === undefined ||
			weight === undefined
		) {
			message.error(t('examForm.record.messages.vitalRequiredError'))
			return
		}

		if (!/^\d{10}$/.test(normalizedPhone)) {
			message.error(t('examForm.record.messages.phoneFormatError'))
			return
		}

		if (!normalizedEmail) {
			message.error(t('examForm.record.messages.emailRequiredError'))
			return
		}

		if (!selectedServiceType || !resolvedServiceName) {
			message.error(t('examForm.record.messages.serviceTypeRequiredError'))
			return
		}

		try {
			setSaving(true)
			showWalkInStep(t('examForm.record.messages.walkInStepSaving'))

			// Best-effort: look up existing user + pet to resolve petId
			// (RBAC may block vet from user/pet lookup — if so, skip and let BE handle)
			let resolvedPetId = undefined
			let existingOwnerId = undefined
			const existingOwner = await findExistingUserByEmail(normalizedEmail)
			if (existingOwner) {
				existingOwnerId = existingOwner?.id || existingOwner?.user?.id
				if (existingOwnerId) {
					const existingPet = await findPetByOwnerAndName(existingOwnerId, values.petName)
					if (existingPet?.id) resolvedPetId = existingPet.id
				}
			}

			const createPayload = {
				...(resolvedPetId ? { petId: resolvedPetId } : {}),
				species: values.species,
				breed: values.breed,
				petName: values.petName,
				name: resolvedServiceName,
				customerName: values.customerName,
				email: normalizedEmail,
				phone: normalizedPhone,
				temperature,
				heartRate,
				systolic,
				diastolic,
				weight,
				diagnosis: values.preliminaryDiagnosis,
				symptoms: values.clinicalSymptoms,
			}

			const shouldClearFollowUpDate = !values.enableFollowUpDate && Boolean(editableMedicalId)
			const updatePayload = {
				conclusion: buildConclusionText(values.conclusionSummary),
				note: values.note || undefined,
				followUpDate:
					values.enableFollowUpDate && values.followUpDate
						? values.followUpDate.format('YYYY-MM-DD')
						: shouldClearFollowUpDate
							? null
							: undefined,
			}
			const hasFollowUpDateUpdate = values.enableFollowUpDate
				? Boolean(values.followUpDate)
				: shouldClearFollowUpDate

			let medicalId = editableMedicalId
			if (medicalId) {
				await updateMedicalRecordApi(getAdminInstance(), medicalId, {
					...createPayload,
					...updatePayload,
				})

				const existingOrderIds = editableMedicalOrders
					.map((item) => item?.id)
					.filter(Boolean)
				const existingMedicineIds = editableMedicines
					.map((item) => item?.id)
					.filter(Boolean)

				await Promise.allSettled(existingOrderIds.map((id) => deleteMedicalOrderApi(getAdminInstance(), id)))
				await Promise.allSettled(existingMedicineIds.map((id) => deleteMedicineApi(getAdminInstance(), id)))
			} else {
				const createdMedical = await createMedicalRecordApi(getAdminInstance(), createPayload)
				medicalId = createdMedical?.id

				if (!medicalId) {
					throw new Error(t('examForm.record.messages.medicalIdMissingError'))
				}

				if (updatePayload.conclusion || updatePayload.note || hasFollowUpDateUpdate) {
					await updateMedicalRecordApi(getAdminInstance(), medicalId, updatePayload)
				}
			}

			const medicalOrders = normalizeRowsPayload(values.medicalOrders)
			await Promise.all(
				medicalOrders
					.filter((item) => item?.medicalOrderId)
					.map((item) => {
						const selectedOrder = medicalOrderOptions.find(
							(order) => String(order.id) === String(item.medicalOrderId),
						)

						return createMedicalOrderApi(getAdminInstance(), {
							medicalRecordId: medicalId,
							medicalOrderId: item.medicalOrderId,
							note: item.note || undefined,
							priceAtTime: Number(selectedOrder?.price || 0),
						})
					}),
			)

			const medicines = normalizeRowsPayload(values.medicines)
			await Promise.all(
				medicines
					.filter((item) => item?.medicineId && item?.quantity)
					.map((item) => {
						const selectedMedicine = medicineOptions.find(
							(medicine) => String(medicine.id) === String(item.medicineId),
						)

						return createMedicalMedicineApi(getAdminInstance(), {
							medicalRecordId: medicalId,
							medicineId: item.medicineId,
							quantity: Number(item.quantity),
							note: item.frequency || undefined,
							priceAtTime: Number(selectedMedicine?.price || 0),
						})
					}),
			)

			// Best-effort: update phone for existing user (new user already has phone from BE)
			if (existingOwnerId && normalizedPhone) {
				try {
					await updateUserProfileApi(getAdminInstance(), existingOwnerId, { phone: normalizedPhone })
				} catch (updateErr) {
					console.warn('[WalkIn] Update owner phone failed (non-blocking)', updateErr)
				}
			}

			showWalkInStep(t('examForm.record.messages.walkInSaveSuccess'), 'success')
			goBackToList()
		} catch (error) {
			showWalkInStep(buildErrorMessage(error, t('examForm.record.messages.walkInSaveError')), 'error')
		} finally {
			setSaving(false)
		}
	}

	const onFinish = async (values) => {
		if (isWalkIn) {
			await handleWalkInSubmit(values)
			return
		}

		if (isReadOnlyForm) {
			message.warning(t('examForm.record.messages.lockedWarning'))
			return
		}

		try {
			setSaving(true)

			const petId = appointment?.petRaw?.id
			if (!petId) {
				throw new Error(t('examForm.record.messages.petMissingError'))
			}

			const temperature = toNumberOrUndefined(values.temperature)
			const heartRate = toNumberOrUndefined(values.heartRate)
			const systolic = toNumberOrUndefined(values.systolic)
			const diastolic = toNumberOrUndefined(values.diastolic)
			const weight = toNumberOrUndefined(values.weight)
			const resolvedCustomerName =
				values.customerName || appointment?.ownerName || appointment?.petRaw?.owner?.fullName || ''
			const resolvedEmail = normalizeEmail(
				values.email || appointment?.ownerEmail || appointment?.petRaw?.owner?.email || '',
			)
			const resolvedPhone = normalizePhone(
				values.phone || appointment?.ownerPhone || appointment?.petRaw?.owner?.phone || '',
			)

			if (
				temperature === undefined ||
				heartRate === undefined ||
				systolic === undefined ||
				diastolic === undefined ||
				weight === undefined
			) {
				throw new Error(t('examForm.record.messages.vitalRequiredError'))
			}

			if (!/^\d{10}$/.test(resolvedPhone)) {
				form.setFields([
					{
						name: 'phone',
						errors: [t('examForm.record.validation.phoneFormat')],
					},
				])
				form.scrollToField('phone', { behavior: 'smooth', block: 'center' })
				throw new Error(t('examForm.record.messages.phoneFormatError'))
			}

			const createPayload = {
				petId,
				species: values.species || appointment?.petRaw?.species,
				breed: values.breed || appointment?.petRaw?.breed,
				petName: values.petName,
				name: values.formName,
				customerName: resolvedCustomerName,
				email: resolvedEmail,
				phone: resolvedPhone,
				temperature,
				heartRate,
				systolic,
				diastolic,
				weight,
				diagnosis: values.preliminaryDiagnosis,
				symptoms: values.clinicalSymptoms,
			}

			const shouldClearFollowUpDate = !values.enableFollowUpDate && Boolean(editableMedicalId)
			const updatePayload = {
				conclusion: buildConclusionText(values.conclusionSummary),
				note: values.note || undefined,
				followUpDate:
					values.enableFollowUpDate && values.followUpDate
						? values.followUpDate.format('YYYY-MM-DD')
						: shouldClearFollowUpDate
							? null
							: undefined,
			}
			const hasFollowUpDateUpdate = values.enableFollowUpDate
				? Boolean(values.followUpDate)
				: shouldClearFollowUpDate

			let medicalId = editableMedicalId

			if (medicalId) {
				await updateMedicalRecordApi(getAdminInstance(), medicalId, {
					...createPayload,
					...updatePayload,
				})

				const existingOrderIds = editableMedicalOrders
					.map((item) => item?.id)
					.filter(Boolean)
				const existingMedicineIds = editableMedicines
					.map((item) => item?.id)
					.filter(Boolean)

				await Promise.allSettled(existingOrderIds.map((id) => deleteMedicalOrderApi(getAdminInstance(), id)))
				await Promise.allSettled(existingMedicineIds.map((id) => deleteMedicineApi(getAdminInstance(), id)))
			} else {
				const createdMedical = await createMedicalRecordApi(getAdminInstance(), createPayload)
				medicalId = createdMedical?.id

				if (!medicalId) {
					throw new Error(t('examForm.record.messages.medicalIdMissingError'))
				}

				if (updatePayload.conclusion || updatePayload.note || hasFollowUpDateUpdate) {
					await updateMedicalRecordApi(getAdminInstance(), medicalId, updatePayload)
				}
			}


			const medicalOrders = normalizeRowsPayload(values.medicalOrders)
			await Promise.all(
				medicalOrders
					.filter((item) => item?.medicalOrderId)
					.map((item) => {
						const selectedOrder = medicalOrderOptions.find(
							(order) => String(order.id) === String(item.medicalOrderId),
						)

						return createMedicalOrderApi(getAdminInstance(), {
							medicalRecordId: medicalId,
							medicalOrderId: item.medicalOrderId,
							note: item.note || undefined,
							priceAtTime: Number(selectedOrder?.price || 0),
						})
					}),
			)

			const medicines = normalizeRowsPayload(values.medicines)
			await Promise.all(
				medicines
					.filter((item) => item?.medicineId && item?.quantity)
					.map((item) => {
						const selectedMedicine = medicineOptions.find(
							(medicine) => String(medicine.id) === String(item.medicineId),
						)

						return createMedicalMedicineApi(getAdminInstance(), {
							medicalRecordId: medicalId,
							medicineId: item.medicineId,
							quantity: Number(item.quantity),
							note: item.frequency || undefined,
							priceAtTime: Number(selectedMedicine?.price || 0),
						})
					}),
			)

			if (appointmentId) {
				await updateAppointmentStatusApi(getAdminInstance(), appointmentId, {
					status: APPOINTMENT_STATUS.COMPLETED,
				}).catch(() => undefined)
			}

			if (appointmentId && medicalId) {
				const medicalIdValue = String(medicalId)
				persistAppointmentMedicalLink(appointmentId, medicalIdValue)
				setMappedMedicalId(medicalIdValue)
			}

			const ownerId = appointment?.petRaw?.owner?.id || appointment?.pet?.owner?.id || editableMedicalRecord?.pet?.owner?.id
			const existingOwnerPhone = normalizePhone(appointment?.petRaw?.owner?.phone || appointment?.pet?.owner?.phone || editableMedicalRecord?.pet?.owner?.phone || '')
			if (ownerId && resolvedPhone && resolvedPhone !== existingOwnerPhone) {
				await updateUserProfileApi(getAdminInstance(), ownerId, { phone: resolvedPhone }).catch((err) => {
					console.warn('[RecordExamForm] Cập nhật SĐT khách hàng thất bại', err)
				})
			}

			message.success(
				editableMedicalId
					? t('examForm.record.messages.saveSuccessUpdate')
					: t('examForm.record.messages.saveSuccessCreate'),
			)
			goBackToList()
		} catch (error) {
			message.error(buildErrorMessage(error, t('examForm.record.messages.saveError')))
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<div className={styles.loadingWrap}>
				<Spin size="large" />
			</div>
		)
	}

	return (
		<div className={styles.pageRoot}>
			<Form
				form={form}
				layout="vertical"
				disabled={isReadOnlyForm}
				onValuesChange={handleValuesChange}
				onFinish={onFinish}
				scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
				className={styles.formRoot}
			>
				<header className={styles.formHeader}>
					<div className={styles.headerMeta}>
						<p>{t('examForm.record.header.title')}</p>
						<div className={styles.headerLine}>
							<span className={styles.headerLabel}>{t('examForm.record.header.recordCode')}</span>
							<strong className={styles.headerValue}>{examinationCode}</strong>
						</div>
						<div className={styles.headerLine}>
							<span className={styles.headerLabel}>{t('examForm.record.header.examDate')}</span>
							<strong className={styles.headerValue}>{prescriptionDate}</strong>
						</div>
					</div>
				</header>

				<Tabs
					className={styles.tabsRoot}
					destroyOnHidden={false}
					items={[
						{
							key: 'exam',
							label: t('examForm.record.tabs.currentExam'),
							children: (
						<div className={styles.formScrollableContent}>
					{shouldShowExamStateAlerts && !hasCreatedMedical ? (
						<Alert
							className={styles.editLockAlert}
							type="info"
							showIcon
							title={t('examForm.record.alerts.notCreatedTitle')}
							description={t('examForm.record.alerts.notCreatedDesc')}
						/>
					) : null}

					{shouldShowExamStateAlerts && hasCreatedMedical && !isLockedByPayment ? (
						<Alert
							className={styles.editLockAlert}
							type="success"
							showIcon
							title={t('examForm.record.alerts.editableTitle')}
							description={t('examForm.record.alerts.editableDesc')}
						/>
					) : null}

					{shouldShowExamStateAlerts && isLockedByPayment ? (
						<Alert
							className={styles.editLockAlert}
							type="error"
							showIcon
							title={t('examForm.record.alerts.paymentLockedTitle')}
							description={t('examForm.record.alerts.paymentLockedDesc')}
						/>
					) : null}

				{patientInfo ? (
					<Card
						className={styles.patientInfoCard}
						title={
							<span>
								<UserOutlined /> {t('examForm.record.patientInfo.title')}
								<span className={styles.patientInfoBadge}>
									<InfoCircleOutlined /> {t('examForm.record.patientInfo.badge')}
								</span>
							</span>
						}
					>
						<div className={styles.patientInfoGrid}>
								<div className={styles.patientInfoSection}>
									<p className={styles.patientInfoSectionTitle}>{t('examForm.record.patientInfo.ownerSection')}</p>
									<div className={styles.patientInfoFieldGrid}>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.ownerName')}</span>
											<span className={patientInfo.ownerName === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.ownerName}
											</span>
										</div>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.ownerEmail')}</span>
											<span className={patientInfo.ownerEmail === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.ownerEmail}
											</span>
										</div>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.ownerPhone')}</span>
											{patientInfo.hasPhone ? (
												<span className={styles.patientInfoValue}>
													{patientInfo.ownerPhone}
												</span>
											) : (
												<div className={styles.patientInfoPhoneInputWrap}>
													<span className={styles.patientInfoPhonePrompt}>
														<WarningOutlined /> {t('examForm.record.patientInfo.phoneMissingPrompt')}
													</span>
													<Form.Item
														name="phone"
														className={styles.patientInfoPhoneFormItem}
														validateTrigger={['onBlur', 'onSubmit']}
														rules={[
															{ required: true, message: t('examForm.record.validation.phoneRequired') },
															{ pattern: /^\d{10}$/, message: t('examForm.record.validation.phoneFormat') },
														]}
													>
														<Input
															size="large"
															maxLength={10}
															placeholder={t('examForm.record.patientInfo.phonePlaceholder')}
															onChange={(event) => {
																const next = String(event?.target?.value || '').replace(/\D/g, '').slice(0, 10)
																form.setFieldValue('phone', next)
															}}
														/>
													</Form.Item>
												</div>
											)}
										</div>
									</div>
								</div>

								<div className={styles.patientInfoSection}>
									<p className={styles.patientInfoSectionTitle}>{t('examForm.record.patientInfo.petSection')}</p>
									<div className={styles.patientInfoFieldGrid}>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.petName')}</span>
											<span className={patientInfo.petName === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.petName}
											</span>
										</div>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.petSpecies')}</span>
											<span className={patientInfo.petSpecies === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.petSpecies}
											</span>
										</div>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.petBreed')}</span>
											<span className={patientInfo.petBreed === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.petBreed}
											</span>
										</div>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.petGender')}</span>
											<span className={patientInfo.petGender === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.petGender}
											</span>
										</div>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.petAge')}</span>
											<span className={patientInfo.petAge === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.petAge}
											</span>
										</div>
										<div className={styles.patientInfoField}>
											<span className={styles.patientInfoLabel}>{t('examForm.record.patientInfo.petWeight')}</span>
											<span className={patientInfo.petWeight === t('examForm.record.patientInfo.noInfo') ? styles.patientInfoValueMuted : styles.patientInfoValue}>
												{patientInfo.petWeight}
											</span>
										</div>
									</div>
								</div>
							</div>
					</Card>
				) : null}

				<Card className={styles.sectionCard}>
					<Row gutter={12}>
						<Col xs={24} md={12}>
							{isWalkIn ? (
								<Form.Item
									label={t('examForm.record.fields.serviceType')}
									name="serviceType"
									rules={[{ required: true, message: t('examForm.record.validation.serviceTypeRequired') }]}
								>
									<Select
										size="large"
										placeholder={t('examForm.record.placeholders.selectServiceType')}
										options={serviceOptions}
									/>
								</Form.Item>
							) : (
								<Form.Item
									label={t('examForm.record.fields.formName')}
									name="formName"
									rules={[{ required: true, message: t('examForm.record.validation.formNameRequired') }]}
								>
									<Input placeholder={t('examForm.record.placeholders.formName')} />
								</Form.Item>
							)}
						</Col>
						<Col xs={24} md={12}>
							<Form.Item label={t('examForm.record.fields.followUpDate')}>
								<div className={styles.followUpControlRow}>
									<Form.Item
										name="followUpDate"
										rules={
											enableFollowUpDate
												? [{ required: true, message: t('examForm.record.validation.followUpDateRequiredWhenEnabled') }]
												: []
										}
										className={styles.followUpDateField}
									>
										<DatePicker
											format="DD/MM/YYYY"
											placeholder={t('examForm.record.placeholders.date')}
											className={styles.followUpDateCompact}
											disabled={!enableFollowUpDate}
											disabledDate={(current) => current && current <= dayjs().startOf('day')}
										/>
									</Form.Item>

									<Form.Item name="enableFollowUpDate" valuePropName="checked" className={styles.followUpToggleField}>
										<Checkbox
											onChange={(event) => {
												if (!event?.target?.checked) {
													form.setFieldValue('followUpDate', null)
												}
											}}
										>
											{t('examForm.record.fields.enableFollowUpDate')}
										</Checkbox>
									</Form.Item>
								</div>
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{!isWalkIn ? (
					<div>
						<Form.Item name="customerName" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="email" hidden>
							<Input />
						</Form.Item>
						{patientInfo?.hasPhone ? (
							<Form.Item name="phone" hidden>
								<Input />
							</Form.Item>
						) : null}
						<Form.Item name="petName" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="species" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="breed" hidden>
							<Input />
						</Form.Item>
					</div>
				) : null}

				{isWalkIn && !editableMedicalRecord ? (
					<Card className={styles.sectionCard} title={<span><UserOutlined /> {t('examForm.record.sections.walkInCustomerPet')}</span>}>
						<Row gutter={12}>
							<Col xs={24} md={8}>
								<Form.Item
									label={t('examForm.record.fields.customerName')}
									name="customerName"
									rules={isWalkIn ? [{ required: true, message: t('examForm.record.validation.customerNameRequired') }] : []}
								>
									<Input placeholder={t('examForm.record.placeholders.customerName')} />
								</Form.Item>
							</Col>
							<Col xs={24} md={8}>
								<Form.Item
									label={t('examForm.record.fields.email')}
									name="email"
									rules={isWalkIn ? [
										{ required: true, message: t('examForm.record.validation.emailRequired') },
										{ type: 'email', message: t('examForm.record.validation.emailInvalid') },
									] : []}
								>
									<Input placeholder={t('examForm.record.placeholders.email')} />
								</Form.Item>
							</Col>
							<Col xs={24} md={8}>
								<Form.Item
									label={t('examForm.record.fields.phone')}
									name="phone"
									rules={isWalkIn ? [
										{ required: true, message: t('examForm.record.validation.phoneRequired') },
										{ pattern: /^\d{10}$/, message: t('examForm.record.validation.phoneFormat') },
									] : []}
								>
									<Input placeholder={t('examForm.record.placeholders.phone')} />
								</Form.Item>
							</Col>

							<Col xs={24} md={8}>
								<Form.Item
									label={t('examForm.record.fields.petName')}
									name="petName"
									rules={isWalkIn ? [{ required: true, message: t('examForm.record.validation.petNameRequired') }] : []}
								>
									<Input placeholder={t('examForm.record.placeholders.petName')} />
								</Form.Item>
							</Col>
							<Col xs={24} md={8}>
								<Form.Item
									label={t('examForm.record.fields.species')}
									name="species"
									rules={isWalkIn ? [{ required: true, message: t('examForm.record.validation.speciesRequired') }] : []}
								>
									<Select
										size="large"
										placeholder={t('examForm.record.placeholders.species')}
										onChange={() => form.setFieldValue('breed', undefined)}
										options={speciesOptions.map((species) => ({
											value: species,
											label: getSpeciesLabel(species),
										}))}
									/>
								</Form.Item>
							</Col>
							<Col xs={24} md={8}>
								<Form.Item
									label={t('examForm.record.fields.breed')}
									name="breed"
									rules={isWalkIn ? [{ required: true, message: t('examForm.record.validation.breedRequired') }] : []}
								>
									<Select
										size="large"
										placeholder={t('examForm.record.placeholders.breed')}
										options={breedOptions.map((breed) => ({
											value: breed,
											label: getBreedLabel(breed, selectedSpecies),
										}))}
									/>
								</Form.Item>
							</Col>

						</Row>
					</Card>
				) : null}

				<Card className={styles.sectionCard} title={<span><HeartOutlined /> {t('examForm.record.sections.vital')}</span>}>
					<div className={styles.vitalGrid}>
						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>
								{t('examForm.record.fields.weight')}
								<span className={styles.vitalLabelRequired} aria-hidden="true">*</span>
							</p>
							<Form.Item
								name="weight"
								rules={[
									{ required: true, message: t('examForm.record.validation.weightRequired') },
									{ type: 'number', min: 0.1, message: t('examForm.record.validation.weightMin') },
									{ type: 'number', max: 99.9, message: t('examForm.record.validation.weightMax') },
								]}
								className={styles.noMargin}
							>
								<InputNumber min={0.1} max={99.9} step={0.1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.weight')} />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>
								{t('examForm.record.fields.temperature')}
								<span className={styles.vitalLabelRequired} aria-hidden="true">*</span>
							</p>
							<Form.Item
								name="temperature"
								rules={[{ required: true, message: t('examForm.record.validation.temperatureRequired') }]}
								className={styles.noMargin}
							>
								<InputNumber min={20} max={50} step={0.1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.temperature')} />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>
								{t('examForm.record.fields.heartRate')}
								<span className={styles.vitalLabelRequired} aria-hidden="true">*</span>
							</p>
							<Form.Item
								name="heartRate"
								rules={[{ required: true, message: t('examForm.record.validation.heartRateRequired') }]}
								className={styles.noMargin}
							>
								<InputNumber min={1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.heartRate')} />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>
								{t('examForm.record.fields.systolic')}
								<span className={styles.vitalLabelRequired} aria-hidden="true">*</span>
							</p>
							<Form.Item
								name="systolic"
								rules={[{ required: true, message: t('examForm.record.validation.systolicRequired') }]}
								className={styles.noMargin}
							>
								<InputNumber min={1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.systolic')} />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>
								{t('examForm.record.fields.diastolic')}
								<span className={styles.vitalLabelRequired} aria-hidden="true">*</span>
							</p>
							<Form.Item
								name="diastolic"
								rules={[{ required: true, message: t('examForm.record.validation.diastolicRequired') }]}
								className={styles.noMargin}
							>
								<InputNumber min={1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.diastolic')} />
							</Form.Item>
						</div>
					</div>
				</Card>

				<Card className={styles.sectionCard} title={<span><WarningOutlined /> {t('examForm.record.sections.clinical')}</span>}>
					<Form.Item 
						label={t('examForm.record.fields.clinicalSymptoms')}
						name="clinicalSymptoms"
						rules={[{ required: true, message: t('examForm.record.validation.clinicalSymptomsRequired') }]}
					>
						<Input.TextArea rows={3} placeholder={t('examForm.record.placeholders.clinicalSymptoms')} />
					</Form.Item>
					<Form.Item
						label={t('examForm.record.fields.preliminaryDiagnosis')}
						name="preliminaryDiagnosis"
						rules={[{ required: true, message: t('examForm.record.validation.preliminaryDiagnosisRequired') }]}
					>
						<Input.TextArea rows={2} placeholder={t('examForm.record.placeholders.preliminaryDiagnosis')} />
					</Form.Item>
				</Card>

					<Card className={styles.sectionCard} title={<span><MedicineBoxOutlined /> {t('examForm.record.sections.conclusion')}</span>}>
						<div className={styles.conclusionGrid}>
							<Form.Item
								label={t('examForm.record.fields.conclusionSummary')}
								name="conclusionSummary"
								rules={[{ required: true, message: t('examForm.record.validation.conclusionRequired') }]}
							>
								<Input.TextArea
									rows={3}
									placeholder={t('examForm.record.placeholders.conclusionSummary')}
								/>
							</Form.Item>

						</div>
					</Card>

				<Card
					className={styles.sectionCard}
					title={<span><ExperimentOutlined /> {t('examForm.record.sections.orders')}</span>}
					extra={
						<Button
							type="link"
							icon={<PlusCircleOutlined />}
							disabled={isReadOnlyForm}
							onClick={() => {
								const current = form.getFieldValue('medicalOrders') || []
								form.setFieldValue('medicalOrders', [
									...current,
									{ medicalOrderId: undefined, note: '' },
								])
							}}
						>
							{t('examForm.record.actions.addOrder')}
						</Button>
					}
				>
					<Form.List name="medicalOrders">
						{(fields, { remove }) => (
							<div className={styles.dynamicTable}>
								<div className={styles.dynamicHead}>
									<span>{t('examForm.record.fields.index')}</span>
									<span>{t('examForm.record.fields.orderType')}</span>
									<span>{t('examForm.record.fields.orderNote')}</span>
									<span>{t('examForm.record.fields.action')}</span>
								</div>
								{fields.map((field, index) => (
									<div key={field.key} className={styles.dynamicRow}>
										<span>{index + 1}</span>
										<Form.Item
											name={[field.name, 'medicalOrderId']}
											rules={[{ required: true, message: t('examForm.record.validation.orderRequired') }]}
											className={styles.noMargin}
										>
											<Select
												size="large"
												placeholder={t('examForm.record.placeholders.selectOrder')}
												showSearch
												optionFilterProp="label"
												options={medicalOrderOptions.map((item) => ({
													value: item.id,
													label: getMedicalOrderOptionLabel(item),
												}))}
											/>
										</Form.Item>
										<Form.Item name={[field.name, 'note']} className={styles.noMargin}>
											<Input placeholder={t('examForm.record.placeholders.orderNote')} />
										</Form.Item>
										<div className={styles.actionCell}>
											<Button
												type="text"
												className={styles.deleteActionButton}
												icon={<DeleteOutlined />}
												onClick={() => remove(field.name)}
												disabled={isReadOnlyForm || fields.length <= 1}
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</Form.List>
				</Card>

				<Card
					className={styles.sectionCard}
					title={<span><MedicineBoxOutlined /> {t('examForm.record.sections.medicines')}</span>}
					extra={
						<Button
							type="link"
							icon={<PlusCircleOutlined />}
							disabled={isReadOnlyForm}
							onClick={() => {
								const current = form.getFieldValue('medicines') || []
								form.setFieldValue('medicines', [
									...current,
									{ medicineId: undefined, quantity: undefined, frequency: '' },
								])
							}}
						>
							{t('examForm.record.actions.addMedicine')}
						</Button>
					}
				>
					<Form.List name="medicines">
						{(fields, { remove }) => (
							<div className={styles.dynamicTable}>
								<div className={styles.dynamicHeadMedicine}>
									<span>{t('examForm.record.fields.index')}</span>
									<span>{t('examForm.record.fields.medicineName')}</span>
									<span>{t('examForm.record.fields.dosage')}</span>
									<span>{t('examForm.record.fields.frequency')}</span>
									<span>{t('examForm.record.fields.action')}</span>
								</div>
								{fields.map((field, index) => (
									<div key={field.key} className={styles.dynamicRowMedicine}>
										<span>{index + 1}</span>
										<Form.Item
											name={[field.name, 'medicineId']}
											rules={[{ required: true, message: t('examForm.record.validation.medicineRequired') }]}
											className={styles.noMargin}
										>
											<Select
												size="large"
												placeholder={t('examForm.record.placeholders.selectMedicine')}
												showSearch
												optionFilterProp="label"
												options={medicineOptions.map((item) => ({
													value: item.id,
													label: getMedicineOptionLabel(item),
												}))}
											/>
										</Form.Item>
										<Form.Item
											name={[field.name, 'quantity']}
											rules={[{ required: true, message: t('examForm.record.validation.medicineQuantityRequired') }]}
											className={styles.noMargin}
										>
											<InputNumber min={1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.medicineQuantity')} />
										</Form.Item>
										<Form.Item name={[field.name, 'frequency']} className={styles.noMargin}>
											<Input placeholder={t('examForm.record.placeholders.medicineFrequency')} />
										</Form.Item>
										<div className={styles.actionCell}>
											<Button
												type="text"
												className={styles.deleteActionButton}
												icon={<DeleteOutlined />}
												onClick={() => remove(field.name)}
												disabled={isReadOnlyForm || fields.length <= 1}
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</Form.List>

					<Divider className={styles.adviceDivider} />
					<Form.Item label={t('examForm.record.fields.doctorAdvice')} name="note">
						<Input.TextArea
							rows={3}
							placeholder={t('examForm.record.placeholders.doctorAdvice')}
						/>
					</Form.Item>

					<div className={styles.doctorSign}>
						<p>
							{t('examForm.record.signature.cityDate', {
								day: dayjs().format('DD'),
								month: dayjs().format('MM'),
								year: dayjs().format('YYYY'),
							})}
						</p>
						<strong>{t('examForm.record.signature.doctorTitle')}</strong>
						<span>{doctorName}</span>
					</div>
				</Card>

						<div className={styles.footerActions}>
							<Button className={styles.cancelBtn} onClick={handleCancel}>
								{t('examForm.record.actions.cancel')}
							</Button>
							{!isReadOnlyForm ? (
								<Button type="primary" htmlType="submit" className={styles.saveBtn} loading={saving} icon={<SaveOutlined />}>
									{t('examForm.record.actions.save')}
								</Button>
							) : null}
						</div>
					</div>
							),
						},
						...(!isWalkIn
							? [
								{
									key: 'history',
									label: t('examForm.record.tabs.history'),
									children: (
						<div className={styles.historyPanel}>
						{historySummary ? (
							<Card className={styles.sectionCard}>
								<div className={styles.historySummary}>
									<div>
										<p className={styles.historyLabel}>{t('examForm.record.history.pet')}</p>
										<h3 className={styles.historyTitle}>{historySummary.name}</h3>
										<p className={styles.historySub}>{historySummary.species} · {historySummary.breed}</p>
									</div>
									<div className={styles.historyMetaGrid}>
										<div>
											<span>{t('examForm.record.history.age')}</span>
											<strong>{historySummary.age}</strong>
										</div>
										<div>
											<span>{t('examForm.record.history.gender')}</span>
											<strong>{historySummary.gender}</strong>
										</div>
										<div>
											<span>{t('examForm.record.history.weight')}</span>
											<strong>{historySummary.weight}</strong>
										</div>
										<div>
											<span>{t('examForm.record.history.birthday')}</span>
											<strong>{historySummary.birthday}</strong>
										</div>
									</div>
								</div>
							</Card>
						) : null}

						{historyLoading ? (
							<div className={styles.loadingWrap}>
								<Spin size="large" />
							</div>
						) : historyRecords.length === 0 ? (
							<div className={styles.historyEmpty}>
								{historyPetId ? t('examForm.record.history.emptyWithPet') : t('examForm.record.history.emptyWithoutPet')}
							</div>
						) : (
							<div className={styles.historyList}>
								{historyRecords.map(({ record, orders, medicines }, index) => {
									const recordKey = record?.id || `${record?.createdAt || 'record'}-${index}`
									const isExpanded = expandedHistoryRecords.has(recordKey)

									return (
										<div key={recordKey} className={styles.historyRecord}>
											<div className={styles.historyRecordHeader}>
												<div className={styles.historyHeaderMain}>
													<h4>{resolveRecordName(record?.name)}</h4>
												</div>

												<div className={styles.historyHeaderActions}>
													<span className={`${styles.historyStatus} ${record?.conclusion ? styles.historyStatusDone : styles.historyStatusPending}`}>
														{record?.conclusion ? t('examForm.record.history.statusDone') : t('examForm.record.history.statusPending')}
													</span>
													<button
														type="button"
														className={styles.historyExpandButton}
														onClick={() => toggleHistoryRecord(recordKey)}
														aria-expanded={isExpanded}
													>
														{isExpanded ? t('common.actions.collapse') : t('common.actions.expand')}
														{isExpanded ? <UpOutlined /> : <DownOutlined />}
													</button>
												</div>
											</div>

											<div className={styles.historyMetaInfoGrid}>
												<div>
													<p><strong>{t('examForm.record.history.examDate')}</strong> {resolveRecordExamDate(record)}</p>
												</div>
												{record?.followUpDate ? (
													<div>
														<p><strong>{t('examForm.record.history.followUpDate')}</strong> {formatFollowUpDateLabel(record?.followUpDate)}</p>
													</div>
												) : null}
											</div>

											{isExpanded ? (
												<>
													<div className={styles.historyDivider} />
													<div className={styles.historyRecordBody}>
														<div className={styles.historyVitalGrid}>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.vitalWeight')}</span>
																<strong>{formatVitalValue(record?.weight, 'kg')}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.vitalTemperature')}</span>
																<strong>{formatVitalValue(record?.temperature, '°C')}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.vitalHeartRate')}</span>
																<strong>{formatVitalValue(record?.heartRate, 'l/p/m')}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.vitalBloodPressure')}</span>
																<strong>{formatBloodPressure(record?.systolic, record?.diastolic)}</strong>
															</div>
														</div>
														<div className={styles.historyDetailColumn}>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.symptoms')}</span>
																<strong>{record?.symptoms || t('examForm.record.fallbacks.notUpdated')}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.diagnosis')}</span>
																<strong>{record?.diagnosis || t('examForm.record.fallbacks.notUpdated')}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.conclusion')}</span>
																<strong>{record?.conclusion || t('examForm.record.fallbacks.notUpdated')}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.doctorAdvice')}</span>
																<strong>{record?.note || t('examForm.record.fallbacks.notUpdated')}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.orders')}</span>
																<strong>{formatHistoryOrderSummary(orders)}</strong>
															</div>
															<div className={styles.historyField}>
																<span>{t('examForm.record.history.medicines')}</span>
																<strong>{formatHistoryMedicineSummary(medicines)}</strong>
															</div>
														</div>
													</div>
												</>
											) : null}
										</div>
									)
								})}
							</div>
						)}
						</div>
									),
								},
							]
							: []),
					]}
				/>
			</Form>
		</div>
	)
}
