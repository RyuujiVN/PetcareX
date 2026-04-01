import {
	DeleteOutlined,
	ExperimentOutlined,
	HeartOutlined,
	MedicineBoxOutlined,
	PlusCircleOutlined,
	SaveOutlined,
	UserOutlined,
	WarningOutlined
} from '@ant-design/icons'
import {
	Alert,
	Button,
	Card,
	Col,
	DatePicker,
	Divider,
	Form,
	Input,
	InputNumber,
	Modal,
	Row,
	Select,
	Spin,
	message,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ADMIN_AUTH_STORAGE, getAdminAuthItem } from '../../../constants/authStorage'
import {
	APPOINTMENT_STATUS,
	getVeterinarianAppointmentsApi,
	getVeterinarianServerNowApi,
	updateVeterinarianAppointmentStatusApi,
} from '../../../data/Vererianrian/api/appointmentApi'
import {
	createMedicalMedicineApi,
	createMedicalOrderApi,
	createMedicalRecordApi,
	deleteMedicalOrder,
	deleteMedicine,
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrderCatalogApi,
	getMedicalOrdersByMedicalId,
	getMedicineCatalogApi,
	getMedicinesByMedicalId,
	updateMedicalRecordApi,
} from '../../../data/Vererianrian/api/medicalApi'
import {
	getVeterinarianPetBreedsApi,
	getVeterinarianPetSpeciesApi,
} from '../../../data/Vererianrian/api/petApi'
import { getVeterinarianUserByIdApi } from '../../../data/Vererianrian/api/userApi'
import { getBreedLabel, getSpeciesLabel } from '../../../data/client/api/petApi'
import { getServiceLabel } from '../../../utils/enumLabel'
import styles from './recordExaminationForm.module.css'

const EDITABLE_DURATION_SECONDS = 15 * 60

const normalizeCollection = (payload) => {
	if (Array.isArray(payload)) return payload
	if (Array.isArray(payload?.items)) return payload.items
	if (Array.isArray(payload?.data)) return payload.data
	return []
}

const getMedicalOrderOptionLabel = (item) => {
	const label = item?.nameVn || item?.name || item?.nameEng || item?.title || item?.code
	if (label) return label
	if (item?.id) return `Chi dinh #${String(item.id).slice(0, 6).toUpperCase()}`
	return 'Chua cap nhat'
}

const getMedicineOptionLabel = (item) => {
	const name = item?.name || item?.nameVn || item?.nameEng || item?.tradeName || item?.code || 'Chua cap nhat'
	const strength = item?.strength || item?.concentration || item?.unit || item?.dosage || ''

	return strength ? `${name} (${strength})` : name
}

const toNumberOrUndefined = (value) => {
	if (value === null || value === undefined || value === '') return undefined
	const normalized = Number(value)
	return Number.isFinite(normalized) ? normalized : undefined
}

const normalizePhone = (value) => String(value || '').replace(/\D/g, '')

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

const buildInitialValues = (appointment, latestMedical, editableMedicalRecord, editableOrders, editableMedicines) => {
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

	return {
		formName: serviceLabel,
		followUpDate: editableMedicalRecord?.followUpDate ? dayjs(editableMedicalRecord.followUpDate) : null,
		customerName: appointment?.ownerName || owner?.fullName || '',
		email: owner?.email || appointment?.ownerEmail || '',
		phone: normalizePhone(owner?.phone || ''),
		petName: appointment?.petName || pet?.name || '',
		species: pet?.species || undefined,
		breed: pet?.breed || undefined,
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
	const initialSnapshotRef = useRef('')

	const appointmentId = searchParams.get('appointmentId')
	const appointmentOwnerId = appointment?.ownerId || appointment?.petRaw?.owner?.id
	const appointmentOwnerEmail = appointment?.ownerEmail || appointment?.petRaw?.owner?.email
	const editableMedicalId = editableMedicalRecord?.id || appointment?.medical?.id || ''
	const editableMedicalCreatedAtMs = parseDateToMs(editableMedicalRecord?.createdAt)
	const missingServerCreatedAt = Boolean(editableMedicalId) && !editableMedicalCreatedAtMs
	const isLockedByTime = Boolean(editableMedicalId) && Boolean(editableMedicalCreatedAtMs) && remainingEditableSeconds <= 0

	const hydrateByAppointmentId = useCallback(async () => {
		if (!appointmentId || location?.state?.appointment?.appointmentId === appointmentId) return

		const response = await getVeterinarianAppointmentsApi({ page: 1, limit: 500 })
		const items = Array.isArray(response?.items) ? response.items : []
		const found = items.find((item) => String(item?.id) === String(appointmentId))
		if (found) {
			setAppointment(toAppointmentViewModel(found))
		}
	}, [appointmentId, location?.state?.appointment])

	const loadMetaData = useCallback(async () => {
		setLoading(true)
		try {
			await hydrateByAppointmentId()

			const [medicalOrders, medicines, species, serverNowMs] = await Promise.all([
				getMedicalOrderCatalogApi(),
				getMedicineCatalogApi(),
				getVeterinarianPetSpeciesApi(),
				getVeterinarianServerNowApi().catch(() => null),
			])

			setMedicalOrderOptions(normalizeCollection(medicalOrders))
			setMedicineOptions(normalizeCollection(medicines))
			setSpeciesOptions(normalizeCollection(species))

			if (typeof serverNowMs === 'number' && Number.isFinite(serverNowMs)) {
				setServerTimeOffsetMs(serverNowMs - Date.now())
				setServerTimeSynced(true)
			} else {
				setServerTimeOffsetMs(0)
				setServerTimeSynced(false)
			}
		} catch (error) {
			message.error(error?.message || 'Không thể tải dữ liệu phiếu khám')
		} finally {
			setLoading(false)
		}
	}, [hydrateByAppointmentId])

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
		)
		form.setFieldsValue(initialValues)
		const snapshot = JSON.stringify(initialValues)
		initialSnapshotRef.current = snapshot
		setIsDirty(false)
	}, [appointment, editableMedicalOrders, editableMedicalRecord, editableMedicines, form, latestMedicalRecord])

	useEffect(() => {
		let active = true

		const hydrateLatestMedicalRecord = async () => {
			const petId = appointment?.petRaw?.id
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
				const payload = await getMedicalByPetId(petId, 1, 200)
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

				const resolvedMedical = matchedMedical || (await getMedicalById(appointmentMedicalId).catch(() => null))
				if (!resolvedMedical || !active) {
					setEditableMedicalRecord(null)
					setEditableMedicalOrders([])
					setEditableMedicines([])
					return
				}

				const [orders, medicines] = await Promise.all([
					getMedicalOrdersByMedicalId(resolvedMedical.id).catch(() => []),
					getMedicinesByMedicalId(resolvedMedical.id).catch(() => []),
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
				const owner = await getVeterinarianUserByIdApi(appointmentOwnerId)
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
				const breeds = await getVeterinarianPetBreedsApi(selectedSpecies)
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
			if (!rawProfile) return 'Bác sĩ phụ trách'

			const profile = JSON.parse(rawProfile)
			return profile?.fullName || profile?.user?.fullName || 'Bác sĩ phụ trách'
		} catch {
			return 'Bác sĩ phụ trách'
		}
	}, [location?.state?.doctorName])

	const prescriptionDate = useMemo(() => {
		return dayjs().format('DD/MM/YYYY')
	}, [])

	const examinationCode = useMemo(() => {
		if (appointmentId) {
			return `AP-${String(appointmentId).slice(0, 8).toUpperCase()}`
		}

		return `AP-${dayjs().format('YYYYMMDDHHmm')}`
	}, [appointmentId])

	const hasCreatedMedical = Boolean(editableMedicalId)
	const canShowCountdown = hasCreatedMedical && Boolean(editableMedicalCreatedAtMs) && !isLockedByTime
	const editableCountdownText = formatRemainingTime(remainingEditableSeconds)

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
			title: 'Bạn có muốn hủy không?',
			content: 'Các dữ liệu đang nhập sẽ không được lưu.',
			okText: 'Xác nhận hủy',
			cancelText: 'Tiếp tục nhập',
			onOk: goBackToList,
		})
	}

	const onFinish = async (values) => {
		if (isLockedByTime) {
			message.warning('Phiếu khám đã quá thời gian chỉnh sửa 15 phút')
			return
		}

		try {
			setSaving(true)

			const petId = appointment?.petRaw?.id
			if (!petId) {
				throw new Error('Không tìm thấy thú cưng từ lịch hẹn, vui lòng chọn lại lịch hẹn trước khi lưu')
			}

			const temperature = toNumberOrUndefined(values.temperature)
			const heartRate = toNumberOrUndefined(values.heartRate)
			const systolic = toNumberOrUndefined(values.systolic)
			const diastolic = toNumberOrUndefined(values.diastolic)
			const weight = toNumberOrUndefined(values.weight)
			const normalizedPhone = normalizePhone(values.phone)

			if (
				temperature === undefined ||
				heartRate === undefined ||
				systolic === undefined ||
				diastolic === undefined ||
				weight === undefined
			) {
				throw new Error('Vui lòng nhập đầy đủ và đúng định dạng các chỉ số sinh tồn')
			}

			if (!/^\d{10}$/.test(normalizedPhone)) {
				throw new Error('Số điện thoại phải gồm đúng 10 chữ số')
			}

			const createPayload = {
				petId,
				species: values.species || appointment?.petRaw?.species,
				breed: values.breed || appointment?.petRaw?.breed,
				petName: values.petName,
				name: values.formName,
				customerName: values.customerName,
				email: values.email,
				phone: normalizedPhone,
				temperature,
				heartRate,
				systolic,
				diastolic,
				weight,
				diagnosis: values.preliminaryDiagnosis,
				symptoms: values.clinicalSymptoms,
			}

			const updatePayload = {
				conclusion: buildConclusionText(values.conclusionSummary),
				note: values.note || undefined,
				followUpDate: values.followUpDate ? values.followUpDate.format('YYYY-MM-DD') : undefined,
			}

			let medicalId = editableMedicalId

			if (medicalId) {
				await updateMedicalRecordApi(medicalId, {
					...createPayload,
					...updatePayload,
				})

				const existingOrderIds = editableMedicalOrders
					.map((item) => item?.id)
					.filter(Boolean)
				const existingMedicineIds = editableMedicines
					.map((item) => item?.id)
					.filter(Boolean)

				await Promise.allSettled(existingOrderIds.map((id) => deleteMedicalOrder(id)))
				await Promise.allSettled(existingMedicineIds.map((id) => deleteMedicine(id)))
			} else {
				const createdMedical = await createMedicalRecordApi(createPayload)
				medicalId = createdMedical?.id

				if (!medicalId) {
					throw new Error('Không nhận được mã phiếu khám từ hệ thống')
				}

				if (updatePayload.conclusion || updatePayload.note || updatePayload.followUpDate) {
					await updateMedicalRecordApi(medicalId, updatePayload)
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

						return createMedicalOrderApi({
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

						return createMedicalMedicineApi({
							medicalRecordId: medicalId,
							medicineId: item.medicineId,
							quantity: Number(item.quantity),
							note: item.frequency || undefined,
							priceAtTime: Number(selectedMedicine?.price || 0),
						})
					}),
			)

			if (appointmentId) {
				await updateVeterinarianAppointmentStatusApi(appointmentId, {
					status: APPOINTMENT_STATUS.COMPLETED,
				}).catch(() => undefined)
			}

			message.success(editableMedicalId ? 'Cập nhật phiếu khám thành công' : 'Lưu hồ sơ thành công')
			goBackToList()
		} catch (error) {
			message.error(buildErrorMessage(error, 'Không thể lưu hồ sơ'))
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
						<p>PHIẾU KHÁM BỆNH & CHỈ ĐỊNH</p>
						<span style={{marginRight: 135}}>Mã hồ sơ: {examinationCode}</span>
						<span style={{marginRight: 135}}>Ngày khám: {prescriptionDate}</span>
					</div>
				</header>

				<div className={styles.formScrollableContent}>
					{!hasCreatedMedical ? (
						<Alert
							className={styles.editLockAlert}
							type="info"
							showIcon
							message="Phiếu khám chưa được tạo"
							description="Sau khi tạo phiếu khám, bác sĩ chỉ có 15 phút để chỉnh sửa phiếu khám nếu có sai sót."
						/>
					) : null}

					{canShowCountdown ? (
						<Alert
							className={styles.editLockAlert}
							type="success"
							showIcon
							message="Đang trong thời gian chỉnh sửa"
							description={`Thời gian còn lại: ${editableCountdownText} (tính từ thời điểm createdAt của server).`}
						/>
					) : null}

					{isLockedByTime ? (
						<Alert
							className={styles.editLockAlert}
							type="warning"
							showIcon
							message="Đã hết thời gian chỉnh sửa"
							description="Phiếu khám đã vượt quá 15 phút kể từ lúc tạo, hệ thống đã chuyển sang chế độ chỉ đọc."
						/>
					) : null}

					{hasCreatedMedical && !serverTimeSynced ? (
						<Alert
							className={styles.editLockAlert}
							type="warning"
							showIcon
							message="Không đồng bộ được giờ server"
							description="Cần backend expose Date header hoặc serverTime để khóa chỉnh sửa theo đồng hồ server chính xác tuyệt đối."
						/>
					) : null}

					{missingServerCreatedAt ? (
						<Alert
							className={styles.editLockAlert}
							type="error"
							showIcon
							message="Thiếu createdAt của phiếu khám"
							description="Backend cần trả về createdAt trong dữ liệu medical của appointment hoặc endpoint chi tiết medical để tính khóa 15 phút."
						/>
					) : null}

				<Card className={styles.sectionCard}>
					<Row gutter={12}>
						<Col xs={24} md={12}>
							<Form.Item
								label="TÊN PHIẾU KHÁM"
								name="formName"
								rules={[{ required: true, message: 'Vui lòng nhập tên phiếu khám' }]}
							>
								<Input placeholder="Tên phiếu khám" />
							</Form.Item>
						</Col>
						<Col xs={24} md={12}>
							<Form.Item label="NGÀY TÁI KHÁM" name="followUpDate">
								<DatePicker
									format="DD/MM/YYYY"
									placeholder="dd/mm/yyyy"
									className={styles.fullWidth}
									disabledDate={(current) => current && current <= dayjs().startOf('day')}
								/>
							</Form.Item>
						</Col>
					</Row>
				</Card>

				<Card className={styles.sectionCard} title={<span><UserOutlined /> Thông tin khách hàng & Thú cưng</span>}>
					<Row gutter={12}>
						<Col xs={24} md={8}>
							<Form.Item
								label="TÊN KHÁCH HÀNG"
								name="customerName"
								rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
							>
								<Input placeholder="Tên khách hàng" />
							</Form.Item>
						</Col>
						<Col xs={24} md={8}>
							<Form.Item
								label="EMAIL"
								name="email"
								rules={[
									{ required: true, message: 'Vui lòng nhập email' },
									{ type: 'email', message: 'Email không hợp lệ' },
								]}
							>
								<Input placeholder="Email khách hàng" />
							</Form.Item>
						</Col>
						<Col xs={24} md={8}>
							<Form.Item
								label="SĐT"
								name="phone"
								rules={[
									{ required: true, message: 'Vui lòng nhập số điện thoại' },
									{ pattern: /^\d{10}$/, message: 'Số điện thoại phải gồm đúng 10 chữ số' },
								]}
							>
								<Input placeholder="Số điện thoại" />
							</Form.Item>
						</Col>

						<Col xs={24} md={8}>
							<Form.Item
								label="TÊN THÚ CƯNG"
								name="petName"
								rules={[{ required: true, message: 'Vui lòng nhập tên thú cưng' }]}
							>
								<Input placeholder="Tên thú cưng" />
							</Form.Item>
						</Col>
						<Col xs={24} md={8}>
							<Form.Item
								label="LOÀI"
								name="species"
								rules={[{ required: true, message: 'Vui lòng chọn loài' }]}
							>
								<Select
									size="large"
									placeholder="Chọn loài"
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
								label="GIỐNG LOÀI"
								name="breed"
								rules={[{ required: true, message: 'Vui lòng chọn giống loài' }]}
							>
								<Select
									size="large"
									placeholder="Giống loài"
									options={breedOptions.map((breed) => ({
										value: breed,
										label: getBreedLabel(breed, selectedSpecies),
									}))}
								/>
							</Form.Item>
						</Col>
					</Row>
				</Card>

				<Card className={styles.sectionCard} title={<span><HeartOutlined /> Chỉ số sinh tồn</span>}>
					<div className={styles.vitalGrid}>
						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>CÂN NẶNG (KG)</p>
							<Form.Item
								name="weight"
								rules={[
									{ required: true, message: 'Vui lòng nhập cân nặng' },
									{ type: 'number', min: 0.1, message: 'Cân nặng phải lớn hơn 0' },
									{ type: 'number', max: 99.9, message: 'Cân nặng không được vượt quá 99.9kg' },
								]}
								className={styles.noMargin}
							>
								<InputNumber min={0.1} max={99.9} step={0.1} className={styles.fullWidth} placeholder="Cân nặng" />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>NHIỆT ĐỘ (°C)</p>
							<Form.Item
								name="temperature"
								rules={[{ required: true, message: 'Vui lòng nhập nhiệt độ' }]}
								className={styles.noMargin}
							>
								<InputNumber min={20} max={50} step={0.1} className={styles.fullWidth} placeholder="Nhiệt độ" />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>NHỊP TIM (L/P/M)</p>
							<Form.Item
								name="heartRate"
								rules={[{ required: true, message: 'Vui lòng nhập nhịp tim' }]}
								className={styles.noMargin}
							>
								<InputNumber min={1} className={styles.fullWidth} placeholder="Nhịp tim" />
							</Form.Item>
						</div>

						<div className={styles.vitalBox}>
							<p className={styles.vitalLabel}>HUYẾT ÁP (MMHG)</p>
							<div className={styles.bpGrid}>
								<Form.Item
									name="systolic"
									rules={[{ required: true, message: 'Nhập huyết áp trên' }]}
									className={styles.noMargin}
								>
									<InputNumber min={1} className={styles.fullWidth} placeholder="Huyết áp trên" />
								</Form.Item>
								<Form.Item
									name="diastolic"
									rules={[{ required: true, message: 'Nhập huyết áp dưới' }]}
									className={styles.noMargin}
								>
									<InputNumber min={1} className={styles.fullWidth} placeholder="Huyết áp dưới" />
								</Form.Item>
							</div>
						</div>
					</div>
				</Card>

				<Card className={styles.sectionCard} title={<span><WarningOutlined /> Thông tin lâm sàng</span>}>
					<Form.Item 
						label="TRIỆU CHỨNG & TÌNH TRẠNG"
						name="clinicalSymptoms"
						rules={[{ required: true, message: 'Vui lòng nhập triệu chứng' }]}
					>
						<Input.TextArea rows={3} placeholder="Mô tả triệu chứng và tình trạng" />
					</Form.Item>
					<Form.Item
						label="CHẨN ĐOÁN SƠ BỘ"
						name="preliminaryDiagnosis"
						rules={[{ required: true, message: 'Vui lòng nhập chẩn đoán sơ bộ' }]}
					>
						<Input.TextArea rows={2} placeholder="Chuẩn đoán sơ bộ" />
					</Form.Item>
				</Card>

					<Card className={styles.sectionCard} title={<span><MedicineBoxOutlined /> Kết luận khám bệnh</span>}>
						<div className={styles.conclusionGrid}>
							<Form.Item
								label="KẾT LUẬN CHUYÊN MÔN"
								name="conclusionSummary"
								rules={[{ required: true, message: 'Vui long nhap ket luan chuyen mon' }]}
							>
								<Input.TextArea
									rows={3}
									placeholder="Tổng kết tình trạng bệnh lý và mức độ"
								/>
							</Form.Item>

						</div>
					</Card>

				<Card
					className={styles.sectionCard}
					title={<span><ExperimentOutlined /> Phiếu chỉ định xét nghiệm/X-Quang</span>}
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
							Thêm chỉ định
						</Button>
					}
				>
					<Form.List name="medicalOrders">
						{(fields, { remove }) => (
							<div className={styles.dynamicTable}>
								<div className={styles.dynamicHead}>
									<span>STT</span>
									<span>LOẠI XÉT NGHIỆM / CHẨN ĐOÁN HÌNH ẢNH</span>
									<span>GHI CHÚ YÊU CẦU</span>
									<span>THAO TÁC</span>
								</div>
								{fields.map((field, index) => (
									<div key={field.key} className={styles.dynamicRow}>
										<span>{index + 1}</span>
										<Form.Item
											name={[field.name, 'medicalOrderId']}
											rules={[{ required: true, message: 'Chọn chỉ định' }]}
											className={styles.noMargin}
										>
											<Select
												size="large"
												placeholder="Chọn loại chỉ định"
												showSearch
												optionFilterProp="label"
												options={medicalOrderOptions.map((item) => ({
													value: item.id,
													label: getMedicalOrderOptionLabel(item),
												}))}
											/>
										</Form.Item>
										<Form.Item name={[field.name, 'note']} className={styles.noMargin}>
											<Input placeholder="Kiểm tra bạch cầu" />
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
					title={<span><MedicineBoxOutlined /> Đơn thuốc chỉ định</span>}
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
							Thêm thuốc
						</Button>
					}
				>
					<Form.List name="medicines">
						{(fields, { remove }) => (
							<div className={styles.dynamicTable}>
								<div className={styles.dynamicHeadMedicine}>
									<span>STT</span>
									<span>TÊN THUỐC / HÀM LƯỢNG</span>
									<span>LIỀU DÙNG</span>
									<span>TẦN SUẤT</span>
									<span>THAO TÁC</span>
								</div>
								{fields.map((field, index) => (
									<div key={field.key} className={styles.dynamicRowMedicine}>
										<span>{index + 1}</span>
										<Form.Item
											name={[field.name, 'medicineId']}
											rules={[{ required: true, message: 'Chọn thuốc' }]}
											className={styles.noMargin}
										>
											<Select
												size="large"
												placeholder="Chọn thuốc"
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
											rules={[{ required: true, message: 'Nhập số lượng' }]}
											className={styles.noMargin}
										>
											<InputNumber min={1} className={styles.fullWidth} placeholder="1" />
										</Form.Item>
										<Form.Item name={[field.name, 'frequency']} className={styles.noMargin}>
											<Input placeholder="Tần suất và trong bao nhiêu ngày" />
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
					<Form.Item label="LỜI DẶN BÁC SĨ" name="note">
						<Input.TextArea
							rows={3}
							placeholder="Theo dõi nhiệt độ tại nhà mỗi 4 tiếng. Nếu có dấu hiệu co giật hoặc nôn ra máu, vui lòng đưa bé đến cấp cứu ngay lập tức."
						/>
					</Form.Item>

					<div className={styles.doctorSign}>
						<p>
							Đà Nẵng, ngày {dayjs().format('DD')} tháng {dayjs().format('MM')} năm {dayjs().format('YYYY')}
						</p>
						<strong>BÁC SĨ ĐIỀU TRỊ</strong>
						<span>{doctorName}</span>
					</div>
				</Card>

				<div className={styles.footerActions}>
					<Button className={styles.cancelBtn} onClick={handleCancel}>
						Hủy
					</Button>
					{!isLockedByTime ? (
						<Button type="primary" htmlType="submit" className={styles.saveBtn} loading={saving} icon={<SaveOutlined />}>
							LƯU PHIẾU KHÁM
						</Button>
					) : null}
				</div>
				</div>
			</Form>
		</div>
	)
}
