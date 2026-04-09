import {
	DeleteOutlined,
	DownOutlined,
	ExperimentOutlined,
	HeartOutlined,
	ManOutlined,
	MedicineBoxOutlined,
	PlusCircleOutlined,
	SaveOutlined,
	UpOutlined,
	UserOutlined,
	WarningOutlined,
	WomanOutlined,
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
	APPOINTMENT_STATUS,
	getAppointmentsApi,
	getServerNowApi,
	updateAppointmentStatusApi,
} from '../../../services/appointmentService'
import { registerApi } from '../../../services/authService'
import {
	createMedicalMedicineApi,
	createMedicalOrderApi,
	createMedicalRecordApi,
	deleteMedicalOrderApi,
	deleteMedicineApi,
	getMedicalByIdApi,
	getMedicalByPetIdApi,
	getMedicalOrderCatalogApi,
	getMedicalOrdersByMedicalIdApi,
	getMedicineCatalogApi,
	getMedicinesByMedicalIdApi,
	updateMedicalRecordApi,
} from '../../../services/medicalService'
import {
	createPetApi,
	getBreedLabel,
	getBreedsBySpeciesApi,
	getPetByIdApi,
	getPetsByOwnerApi,
	getPetSpeciesApi,
	getSpeciesLabel,
} from '../../../services/petService'
import { getUserByIdApi, getUserListApi } from '../../../services/userService'
import { formatDateDDMMYYYY } from '../../../utils/dateTimeFormat'
import { getMedicineUnitLabel, getServiceLabel } from '../../../utils/enumLabel'
import styles from './recordExaminationForm.module.css'

const EDITABLE_DURATION_SECONDS = 15 * 60
const EMERGENCY_TEMP_PASSWORD = 'Baophan1234'

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

const normalizePhone = (value) => String(value || '').replace(/\D/g, '')

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const normalizeGenderValue = (value) => {
	if (value === true || value === false) return value
	if (value === 'male') return true
	if (value === 'female') return false
	return undefined
}

const resolveDateOfBirth = (dateValue, ageValue) => {
	if (dateValue) return dayjs(dateValue).format('YYYY-MM-DD')
	if (ageValue) {
		return dayjs().subtract(Number(ageValue), 'year').format('YYYY-MM-DD')
	}
	return undefined
}

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

const parseDateToMs = (value) => {
	if (!value) return null
	const parsed = Date.parse(String(value))
	if (Number.isNaN(parsed)) return null
	return parsed
}

const formatRemainingTime = (seconds) => {
	const safeSeconds = Math.max(0, Number(seconds) || 0)
	const minutes = Math.floor(safeSeconds / 60)
	const remainSeconds = safeSeconds % 60
	return `${String(minutes).padStart(2, '0')}:${String(remainSeconds).padStart(2, '0')}`
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

const selectMedicalRecordByAppointment = (records, appointment) => {
	if (!Array.isArray(records) || records.length === 0 || !appointment) return null

	const appointmentDay = toDayStamp(appointment?.appointmentDate)
	const appointmentDateTime = toDateTime(appointment?.appointmentDate, appointment?.appointmentTime)
	const appointmentClinicId = String(appointment?.clinicId || appointment?.clinic?.id || '')

	const ranked = records
		.map((record) => {
			let score = 0

			if (appointmentDay && toDayStamp(record?.createdAt) === appointmentDay) {
				score += 100
			}

			if (appointmentClinicId && String(record?.clinicId || record?.clinic?.id || '') === appointmentClinicId) {
				score += 40
			}

			const recordCreatedTime = new Date(record?.createdAt || 0).getTime()
			if (appointmentDateTime && Number.isFinite(recordCreatedTime) && recordCreatedTime > 0) {
				const diffHours = Math.abs(recordCreatedTime - appointmentDateTime.getTime()) / (1000 * 60 * 60)
				score += Math.max(0, 24 - diffHours)
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

	const best = ranked[0]
	if (!best) return null

	if (appointmentDay && best.score < 90) {
		return null
	}

	return best.record || null
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

	return {
		formName: isWalkIn ? '' : serviceLabel,
		serviceType: resolvedServiceType,
		enableFollowUpDate: Boolean(editableMedicalRecord?.followUpDate),
		followUpDate: editableMedicalRecord?.followUpDate ? dayjs(editableMedicalRecord.followUpDate) : null,
		customerName: isWalkIn ? '' : appointment?.ownerName || owner?.fullName || '',
		email: isWalkIn ? '' : owner?.email || appointment?.ownerEmail || '',
		phone: isWalkIn ? '' : normalizePhone(owner?.phone || ''),
		petName: isWalkIn ? '' : appointment?.petName || pet?.name || '',
		species: isWalkIn ? undefined : pet?.species || undefined,
		breed: isWalkIn ? undefined : pet?.breed || undefined,
		petGender: !isWalkIn
			? pet?.gender === true
				? 'male'
				: pet?.gender === false
					? 'female'
					: undefined
			: undefined,
		petDateOfBirth: isWalkIn
			? null
			: pet?.dateOfBirth
				? dayjs(pet.dateOfBirth)
				: null,
		petAge: undefined,
		weight: latestWeight ?? petWeight,
		temperature: toNumberOrUndefined(editableMedicalRecord?.temperature),
		heartRate: toNumberOrUndefined(editableMedicalRecord?.heartRate),
		systolic: toNumberOrUndefined(editableMedicalRecord?.systolic),
		diastolic: toNumberOrUndefined(editableMedicalRecord?.diastolic),
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
		service: item?.service,
		appointmentDate: item?.appointmentDate || null,
		appointmentTime: item?.appointmentTime || '',
		clinicId: item?.clinic?.id || item?.clinicId || '',
		petName: pet?.name,
		ownerName: owner?.fullName,
		ownerId: owner?.id,
		ownerEmail: owner?.email || '',
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
	const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState(0)
	const [serverTimeSynced, setServerTimeSynced] = useState(false)
	const [remainingEditableSeconds, setRemainingEditableSeconds] = useState(EDITABLE_DURATION_SECONDS)
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
	const appointmentOwnerId = appointment?.ownerId || appointment?.petRaw?.owner?.id
	const appointmentOwnerEmail = appointment?.ownerEmail || appointment?.petRaw?.owner?.email
	const editableMedicalId = editableMedicalRecord?.id || appointment?.medical?.id || ''
	const editableMedicalCreatedAtMs = parseDateToMs(editableMedicalRecord?.createdAt)
	const missingServerCreatedAt = Boolean(editableMedicalId) && !editableMedicalCreatedAtMs
	const isLockedByTime = Boolean(editableMedicalId) && Boolean(editableMedicalCreatedAtMs) && remainingEditableSeconds <= 0

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

		const response = await getAppointmentsApi(getAdminInstance(), { page: 1, limit: 500 })
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
			const [medicalOrdersResult, medicinesResult, speciesResult, serverNowResult] = await Promise.allSettled([
				getMedicalOrderCatalogApi(getAdminInstance()),
				getMedicineCatalogApi(getAdminInstance()),
				getPetSpeciesApi(getAdminInstance()),
				getServerNowApi(getAdminInstance()),
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

			if (serverNowResult.status === 'fulfilled') {
				const serverNowMs = serverNowResult.value
				if (typeof serverNowMs === 'number' && Number.isFinite(serverNowMs)) {
					setServerTimeOffsetMs(serverNowMs - Date.now())
					setServerTimeSynced(true)
				} else {
					setServerTimeOffsetMs(0)
					setServerTimeSynced(false)
				}
			} else {
				setServerTimeOffsetMs(0)
				setServerTimeSynced(false)
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
			const petId = appointment?.petRaw?.id || appointment?.pet?.id || appointment?.petId
			const appointmentMedicalId = appointment?.medical?.id
			if (!petId) {
				if (active) {
					setLatestMedicalRecord(null)
					setEditableMedicalRecord(null)
					setEditableMedicalOrders([])
					setEditableMedicines([])
				}
				return
			}

			try {
				const payload = await getMedicalByPetIdApi(getAdminInstance(),petId, 1, 200)
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
					setEditableMedicalRecord(null)
					setEditableMedicalOrders([])
					setEditableMedicines([])
					return
				}

				const latestRecord = [...records].sort((a, b) => {
					const aTime = new Date(a?.createdAt || 0).getTime()
					const bTime = new Date(b?.createdAt || 0).getTime()
					return bTime - aTime
				})[0]

				setLatestMedicalRecord(latestRecord || null)

				const matchedMedicalById = appointmentMedicalId
					? records.find((record) => String(record?.id || '') === String(appointmentMedicalId)) || null
					: null

				const matchedMedical = matchedMedicalById || selectMedicalRecordByAppointment(records, appointment)

				if (!matchedMedical && !appointmentMedicalId) {
					setEditableMedicalRecord(null)
					setEditableMedicalOrders([])
					setEditableMedicines([])
					return
				}

				const idToFetch = matchedMedical?.id || appointmentMedicalId
				const resolvedMedical = idToFetch
					? await getMedicalByIdApi(getAdminInstance(),idToFetch).catch(() => matchedMedical || null)
					: null
				if (!resolvedMedical || !active) {
					setEditableMedicalRecord(null)
					setEditableMedicalOrders([])
					setEditableMedicines([])
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
			} catch {
				if (active) {
					setLatestMedicalRecord(null)
					setEditableMedicalRecord(null)
					setEditableMedicalOrders([])
					setEditableMedicines([])
				}
			}
		}

		hydrateLatestMedicalRecord()

		return () => {
			active = false
		}
	}, [appointment, appointment?.medical?.id, appointment?.petRaw?.id])

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
				const payload = await getMedicalByPetIdApi(getAdminInstance(),historyPetId, 1, 200)
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

	useEffect(() => {
		if (!editableMedicalId || !editableMedicalCreatedAtMs) {
			setRemainingEditableSeconds(EDITABLE_DURATION_SECONDS)
			return
		}

		const getRemainingSeconds = () => {
			const nowByServerClock = Date.now() + serverTimeOffsetMs
			const elapsedSeconds = Math.floor((nowByServerClock - editableMedicalCreatedAtMs) / 1000)
			return Math.max(0, EDITABLE_DURATION_SECONDS - elapsedSeconds)
		}

		setRemainingEditableSeconds(getRemainingSeconds())

		const intervalId = window.setInterval(() => {
			setRemainingEditableSeconds(getRemainingSeconds())
		}, 1000)

		return () => {
			window.clearInterval(intervalId)
		}
	}, [editableMedicalCreatedAtMs, editableMedicalId, serverTimeOffsetMs])

	useEffect(() => {
		let active = true

		const hydrateOwnerEmail = async () => {
			if (!appointmentOwnerId || appointmentOwnerEmail) return

			try {
				const ownerResponse = await getUserByIdApi(getAdminInstance(), appointmentOwnerId)
				const owner = ownerResponse.data
				const resolvedEmail = owner?.email || owner?.data?.email || ''
				if (!resolvedEmail || !active) return

				setAppointment((prev) => {
					if (!prev) return prev

					return {
						...prev,
						ownerEmail: resolvedEmail,
						petRaw: {
							...prev.petRaw,
							owner: {
								...(prev.petRaw?.owner || {}),
								email: resolvedEmail,
							},
						},
					}
				})
			} catch {
				// Ignore owner email hydration failure and keep form editable.
			}
		}

		hydrateOwnerEmail()

		return () => {
			active = false
		}
	}, [appointmentOwnerId, appointmentOwnerEmail])

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
		const prefix = isWalkIn ? 'EMG' : 'AP'
		if (appointmentId) {
			return `${prefix}-${String(appointmentId).slice(0, 8).toUpperCase()}`
		}

		return `${prefix}-${dayjs().format('YYYYMMDDHHmm')}`
	}, [appointmentId, isWalkIn])

	const hasCreatedMedical = Boolean(editableMedicalId)
	const canShowCountdown = hasCreatedMedical && Boolean(editableMedicalCreatedAtMs) && !isLockedByTime
	const editableCountdownText = formatRemainingTime(remainingEditableSeconds)
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

	const serviceOptions = useMemo(() => {
		return Object.values(ServiceEnum).map((service) => ({
			value: service,
			label: getServiceLabel(service),
		}))
	}, [])

	const genderSelectOptions = useMemo(
		() => [
			{
				value: 'male',
				label: (
					<span>
						<ManOutlined style={{ marginRight: 8 }} />
						{t('examForm.record.options.male')}
					</span>
				),
			},
			{
				value: 'female',
				label: (
					<span>
						<WomanOutlined style={{ marginRight: 8 }} />
						{t('examForm.record.options.female')}
					</span>
				),
			},
		],
		[t],
	)

	const handleValuesChange = (_, allValues) => {
		const normalized = {
			...allValues,
			medicalOrders: normalizeRowsPayload(allValues?.medicalOrders || []),
			medicines: normalizeRowsPayload(allValues?.medicines || []),
		}
		setIsDirty(JSON.stringify(normalized) !== initialSnapshotRef.current)
	}

	const goBackToList = () => {
		navigate('/veterinarian/exam-forms')
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
			duration: type === 'loading' ? 0 : 2,
		})
	}

	const findUserByEmail = async (email) => {
		try {
			const searchResponse = await getUserListApi(getAdminInstance(), 1, 50, email)
			const payload = searchResponse.data
			const users = normalizeCollection(payload)
			return users.find((user) => normalizeEmail(user?.email) === email) || null
		} catch {
			throw new Error(t('examForm.record.messages.findUserError'))
		}
	}

	const findPetByOwnerAndName = async (ownerId, petName) => {
		try {
			const payload = await getPetsByOwnerApi(getAdminInstance(), { ownerId, page: 1, limit: 200 })
			const pets = normalizeCollection(payload)
			const normalizedName = String(petName || '').trim().toLowerCase()
			return pets.find((pet) => String(pet?.name || '').trim().toLowerCase() === normalizedName) || null
		} catch {
			throw new Error(t('examForm.record.messages.findPetError'))
		}
	}

	const handleWalkInSubmit = async (values) => {
		if (isLockedByTime) {
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
		const genderValue = normalizeGenderValue(values.petGender)
		const dateOfBirth = resolveDateOfBirth(values.petDateOfBirth, values.petAge)
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

		if (!dateOfBirth) {
			message.error(t('examForm.record.messages.petDobRequiredError'))
			return
		}

		if (genderValue === undefined) {
			message.error(t('examForm.record.messages.petGenderRequiredError'))
			return
		}

		if (!selectedServiceType || !resolvedServiceName) {
			message.error(t('examForm.record.messages.serviceTypeRequiredError'))
			return
		}

		try {
			setSaving(true)
			showWalkInStep(t('examForm.record.messages.walkInStepCheckingOwner'))

			let owner = await findUserByEmail(normalizedEmail)
			if (!owner) {
				showWalkInStep(t('examForm.record.messages.walkInStepCreatingOwner'))
				// Placeholder password; backend should replace with random password + email notification.
				await registerApi(getAdminInstance(), {
					fullName: values.customerName,
					email: normalizedEmail,
					password: EMERGENCY_TEMP_PASSWORD,
				})
				owner = await findUserByEmail(normalizedEmail)
			}

			if (!owner) {
				throw new Error(t('examForm.record.messages.ownerResolveError'))
			}

			showWalkInStep(t('examForm.record.messages.walkInStepOwnerReady'), 'success')

			const ownerId = owner?.id || owner?.user?.id
			if (!ownerId) {
				throw new Error(t('examForm.record.messages.ownerIdMissingError'))
			}

			showWalkInStep(t('examForm.record.messages.walkInStepCheckingPet'))
			let pet = await findPetByOwnerAndName(ownerId, values.petName)
			if (!pet) {
				showWalkInStep(t('examForm.record.messages.walkInStepCreatingPet'))
				pet = await createPetApi(getAdminInstance(), {
					ownerId,
					name: values.petName,
					species: values.species,
					breed: values.breed,
					gender: genderValue,
					dateOfBirth,
					weight,
				})
			}

			if (!pet?.id) {
				throw new Error(t('examForm.record.messages.petResolveError'))
			}

			showWalkInStep(t('examForm.record.messages.walkInStepPetReady'), 'success')

			showWalkInStep(t('examForm.record.messages.walkInStepSaving'))
			const createPayload = {
				petId: pet.id,
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

			showWalkInStep(t('examForm.record.messages.walkInSaveSuccess'), 'success')
			goBackToList()
		} catch (error) {
			message.error(buildErrorMessage(error, t('examForm.record.messages.walkInSaveError')))
		} finally {
			setSaving(false)
		}
	}

	const onFinish = async (values) => {
		if (isWalkIn) {
			await handleWalkInSubmit(values)
			return
		}

		if (isLockedByTime) {
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
				values.phone || appointment?.petRaw?.owner?.phone || '',
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
				disabled={isLockedByTime}
				onValuesChange={handleValuesChange}
				onFinish={onFinish}
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

				<Tabs className={styles.tabsRoot} destroyInactiveTabPane={false}>
					<Tabs.TabPane tab={t('examForm.record.tabs.currentExam')} key="exam">
						<div className={styles.formScrollableContent}>
					{!hasCreatedMedical ? (
						<Alert
							className={styles.editLockAlert}
							type="info"
							showIcon
							message={t('examForm.record.alerts.notCreatedTitle')}
							description={t('examForm.record.alerts.notCreatedDesc')}
						/>
					) : null}

					{canShowCountdown ? (
						<Alert
							className={styles.editLockAlert}
							type="success"
							showIcon
							message={t('examForm.record.alerts.editingWindowTitle')}
							description={t('examForm.record.alerts.editingWindowDesc', { time: editableCountdownText })}
						/>
					) : null}

					{isLockedByTime ? (
						<Alert
							className={styles.editLockAlert}
							type="warning"
							showIcon
							message={t('examForm.record.alerts.expiredTitle')}
							description={t('examForm.record.alerts.expiredDesc')}
						/>
					) : null}

					{hasCreatedMedical && !serverTimeSynced ? (
						<Alert
							className={styles.editLockAlert}
							type="warning"
							showIcon
							message={t('examForm.record.alerts.serverSyncFailTitle')}
							description={t('examForm.record.alerts.serverSyncFailDesc')}
						/>
					) : null}

					{missingServerCreatedAt ? (
						<Alert
							className={styles.editLockAlert}
							type="error"
							showIcon
							message={t('examForm.record.alerts.missingCreatedAtTitle')}
							description={t('examForm.record.alerts.missingCreatedAtDesc')}
						/>
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
						<Form.Item name="phone" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="petName" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="species" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="breed" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="petGender" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="petDateOfBirth" hidden>
							<Input />
						</Form.Item>
						<Form.Item name="petAge" hidden>
							<Input />
						</Form.Item>
					</div>
				) : null}

				{isWalkIn ? (
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

							<Col xs={24} md={8}>
								<Form.Item
									label={t('examForm.record.fields.petGender')}
									name="petGender"
									rules={isWalkIn ? [{ required: true, message: t('examForm.record.validation.petGenderRequired') }] : []}
								>
									<Select
										size="large"
										placeholder={t('examForm.record.placeholders.petGender')}
										options={genderSelectOptions}
									/>
								</Form.Item>
							</Col>
							<Col xs={24} md={8}>
								<Form.Item label={t('examForm.record.fields.petDateOfBirth')} name="petDateOfBirth">
									<DatePicker
										format="DD/MM/YYYY"
										placeholder={t('examForm.record.placeholders.date')}
										className={styles.fullWidth}
										disabledDate={(current) => current && current > dayjs().endOf('day')}
									/>
								</Form.Item>
							</Col>
							<Col xs={24} md={8}>
								<Form.Item label={t('examForm.record.fields.petAge')} name="petAge">
									<InputNumber
										min={0}
										max={50}
										className={styles.fullWidth}
										placeholder={t('examForm.record.placeholders.petAge')}
									/>
								</Form.Item>
							</Col>
						</Row>
					</Card>
				) : null}

				<Card className={styles.sectionCard} title={<span><HeartOutlined /> {t('examForm.record.sections.vital')}</span>}>
					<div className={styles.vitalGrid}>
						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>{t('examForm.record.fields.weight')}</p>
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
							<p className={styles.vitalLabel}>{t('examForm.record.fields.temperature')}</p>
							<Form.Item
								name="temperature"
								rules={[{ required: true, message: t('examForm.record.validation.temperatureRequired') }]}
								className={styles.noMargin}
							>
								<InputNumber min={20} max={50} step={0.1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.temperature')} />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>{t('examForm.record.fields.heartRate')}</p>
							<Form.Item
								name="heartRate"
								rules={[{ required: true, message: t('examForm.record.validation.heartRateRequired') }]}
								className={styles.noMargin}
							>
								<InputNumber min={1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.heartRate')} />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>{t('examForm.record.fields.bloodPressure')}</p>
							<div className={styles.bpGrid}>
								<Form.Item
									name="systolic"
									rules={[{ required: true, message: t('examForm.record.validation.systolicRequired') }]}
									className={styles.noMargin}
								>
									<InputNumber min={1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.systolic')} />
								</Form.Item>
								<Form.Item
									name="diastolic"
									rules={[{ required: true, message: t('examForm.record.validation.diastolicRequired') }]}
									className={styles.noMargin}
								>
									<InputNumber min={1} className={styles.fullWidth} placeholder={t('examForm.record.placeholders.diastolic')} />
								</Form.Item>
							</div>
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
							disabled={isLockedByTime}
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
										<Button
											type="text"
											icon={<DeleteOutlined />}
											onClick={() => remove(field.name)}
											disabled={isLockedByTime || fields.length <= 1}
										/>
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
							disabled={isLockedByTime}
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
										<Button
											type="text"
											icon={<DeleteOutlined />}
											onClick={() => remove(field.name)}
											disabled={isLockedByTime || fields.length <= 1}
										/>
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
							{!isLockedByTime ? (
								<Button type="primary" htmlType="submit" className={styles.saveBtn} loading={saving} icon={<SaveOutlined />}>
									{t('examForm.record.actions.save')}
								</Button>
							) : null}
						</div>
					</div>
				</Tabs.TabPane>
				{!isWalkIn ? (
					<Tabs.TabPane tab={t('examForm.record.tabs.history')} key="history">
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
					</Tabs.TabPane>
				) : null}
			</Tabs>
			</Form>
		</div>
	)
}
