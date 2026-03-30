import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	DeleteOutlined,
	ExperimentOutlined,
	HeartOutlined,
	MedicineBoxOutlined,
	PlusCircleOutlined,
	SaveOutlined,
	SmileOutlined,
	UserOutlined,
	WarningOutlined,
} from '@ant-design/icons'
import {
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
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ADMIN_AUTH_STORAGE, getAdminAuthItem } from '../../../constants/authStorage'
import {
	APPOINTMENT_STATUS,
	getVeterinarianAppointmentsApi,
	updateVeterinarianAppointmentStatusApi,
} from '../../../data/Vererianrian/api/appointmentApi'
import {
	createMedicalMedicineApi,
	createMedicalOrderApi,
	createMedicalRecordApi,
	getMedicalOrderCatalogApi,
	getMedicineCatalogApi,
	updateMedicalRecordApi,
} from '../../../data/Vererianrian/api/medicalApi'
import {
	getVeterinarianPetBreedsApi,
	getVeterinarianPetSpeciesApi,
} from '../../../data/Vererianrian/api/petApi'
import { getVeterinarianUserByIdApi } from '../../../data/Vererianrian/api/userApi'
import { getBreedLabel, getSpeciesLabel } from '../../../data/client/api/petApi'
import styles from './recordExaminationForm.module.css'

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

const buildInitialValues = (appointment) => {
	const pet = appointment?.petRaw || appointment?.pet || {}
	const owner = pet?.owner || {}

	return {
		formName: appointment?.formName || appointment?.service || '',
		followUpDate: null,
		customerName: appointment?.ownerName || owner?.fullName || '',
		email: owner?.email || appointment?.ownerEmail || '',
		phone: normalizePhone(owner?.phone || ''),
		petName: appointment?.petName || pet?.name || '',
		species: pet?.species || undefined,
		breed: pet?.breed || undefined,
		weight: toNumberOrUndefined(pet?.weight),
		temperature: undefined,
		heartRate: undefined,
		systolic: undefined,
		diastolic: undefined,
		clinicalSymptoms: '',
		preliminaryDiagnosis: '',
		note: '',
		medicalOrders: [
			{
				medicalOrderId: undefined,
				note: '',
			},
		],
		medicines: [
			{
				medicineId: undefined,
				quantity: undefined,
				note: '',
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
		petName: pet?.name,
		ownerName: owner?.fullName,
		ownerId: owner?.id,
		ownerEmail: owner?.email || '',
		formName: item?.service,
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
	const [isDirty, setIsDirty] = useState(false)
	const initialSnapshotRef = useRef('')

	const appointmentId = searchParams.get('appointmentId')
	const appointmentOwnerId = appointment?.ownerId || appointment?.petRaw?.owner?.id
	const appointmentOwnerEmail = appointment?.ownerEmail || appointment?.petRaw?.owner?.email

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

			const [medicalOrders, medicines, species] = await Promise.all([
				getMedicalOrderCatalogApi(),
				getMedicineCatalogApi(),
				getVeterinarianPetSpeciesApi(),
			])

			setMedicalOrderOptions(normalizeCollection(medicalOrders))
			setMedicineOptions(normalizeCollection(medicines))
			setSpeciesOptions(normalizeCollection(species))
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
		const initialValues = buildInitialValues(appointment)
		form.setFieldsValue(initialValues)
		const snapshot = JSON.stringify(initialValues)
		initialSnapshotRef.current = snapshot
		setIsDirty(false)
	}, [appointment, form])

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

			const createdMedical = await createMedicalRecordApi(createPayload)
			const medicalId = createdMedical?.id

			if (!medicalId) {
				throw new Error('Không nhận được mã phiếu khám từ hệ thống')
			}

			const updatePayload = {
				note: values.note || undefined,
				followUpDate: values.followUpDate ? values.followUpDate.format('YYYY-MM-DD') : undefined,
			}

			if (updatePayload.note || updatePayload.followUpDate) {
				await updateMedicalRecordApi(medicalId, updatePayload)
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
							note: item.note || undefined,
							priceAtTime: Number(selectedMedicine?.price || 0),
						})
					}),
			)

			if (appointmentId) {
				await updateVeterinarianAppointmentStatusApi(appointmentId, {
					status: APPOINTMENT_STATUS.COMPLETED,
				}).catch(() => undefined)
			}

			message.success('Lưu hồ sơ thành công')
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
				onValuesChange={handleValuesChange}
				onFinish={onFinish}
				className={styles.formRoot}
			>
				<header className={styles.formHeader}>
					<div>
						<div className={styles.brandRow}>
							<div className={styles.brandIcon}>
								<SmileOutlined />
							</div>
							<div>
								<h2>PETCAR</h2>
								<p>Hệ thống thú y chuyên nghiệp</p>
							</div>
						</div>
					</div>

					<div className={styles.headerMeta}>
						<p>PHIẾU KHÁM BỆNH & CHỈ ĐỊNH</p>
						<span>Mã hồ sơ: {examinationCode}</span>
						<span>Ngày khám: {prescriptionDate}</span>
					</div>
				</header>

				<div className={styles.formScrollableContent}>

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

				<Card
					className={styles.sectionCard}
					title={<span><ExperimentOutlined /> Phiếu chỉ định xét nghiệm/X-Quang</span>}
					extra={
						<Button
							type="link"
							icon={<PlusCircleOutlined />}
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
											disabled={fields.length <= 1}
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
							onClick={() => {
								const current = form.getFieldValue('medicines') || []
								form.setFieldValue('medicines', [
									...current,
									{ medicineId: undefined, quantity: undefined, note: '' },
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
									<span>GHI CHÚ</span>
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
										<Form.Item name={[field.name, 'note']} className={styles.noMargin}>
											<Input placeholder="Tần suất và trong bao nhiêu ngày" />
										</Form.Item>
										<Button
											type="text"
											icon={<DeleteOutlined />}
											onClick={() => remove(field.name)}
											disabled={fields.length <= 1}
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
					<Button type="primary" htmlType="submit" className={styles.saveBtn} loading={saving} icon={<SaveOutlined />}>
						LƯU PHIẾU KHÁM
					</Button>
				</div>
				</div>
			</Form>
		</div>
	)
}
