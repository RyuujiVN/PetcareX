import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Button,
	Card,
	Col,
	Divider,
	Form,
	Input,
	Row,
	Spin,
	Table,
	Tag,
	Typography,
	message,
} from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
	CalendarOutlined,
	ExperimentOutlined,
	FileTextOutlined,
	HeartOutlined,
	MedicineBoxOutlined,
	SmileOutlined,
	UserOutlined,
	WarningOutlined,
} from '@ant-design/icons'
import { getClinicAppointmentByIdApi } from '../../../../data/Clinic/api/appointmentApi'
import {
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../../data/Clinic/api/medicalApi'
import styles from './petMedicalRecords.module.css'

const FALLBACK_TEXT = 'Chua cap nhat'
const { TextArea } = Input

const formatDateLabel = (value, fallback = FALLBACK_TEXT) => {
	if (!value) return fallback
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return fallback
	return date.toLocaleDateString('vi-VN')
}

const formatEnumLabel = (value, fallback = FALLBACK_TEXT) => {
	if (!value) return fallback
	return String(value)
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

const buildExamCode = (medicalId) => {
	if (!medicalId) return '#PC-TEMP'
	return `#PC-${String(medicalId).slice(0, 8).toUpperCase()}`
}

const parseConclusionSummary = (conclusionText, fallback = FALLBACK_TEXT) => {
	const raw = String(conclusionText || '').trim()
	if (!raw) return fallback

	const summaryMatch = raw.match(/Ket\s*luan\s*:\s*([^\n]+)/i)
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
		<Form.Item label={label} className={styles.readonlyField}>
			<Input value={value || FALLBACK_TEXT} readOnly />
		</Form.Item>
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
	const [medicalOrders, setMedicalOrders] = useState([])
	const [medicines, setMedicines] = useState([])

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
				setMedicalOrders([])
				setMedicines([])
				return
			}

			const medicalPayload = await getMedicalByPetId(resolvedPetId, 1, 200)
			const medicalRecords = normalizeCollection(medicalPayload)
			const matchedMedical = selectMedicalRecordByAppointment(medicalRecords, resolvedAppointment)

			setMedicalRecord(matchedMedical || null)

			if (!matchedMedical?.id) {
				setMedicalOrders([])
				setMedicines([])
				return
			}

			const [ordersPayload, medicinesPayload] = await Promise.all([
				getMedicalOrdersByMedicalId(matchedMedical.id).catch(() => []),
				getMedicinesByMedicalId(matchedMedical.id).catch(() => []),
			])

			setMedicalOrders(Array.isArray(ordersPayload) ? ordersPayload : [])
			setMedicines(Array.isArray(medicinesPayload) ? medicinesPayload : [])
		} catch (error) {
			message.error(error?.message || 'Khong the tai du lieu phieu kham')
			setMedicalRecord(null)
			setMedicalOrders([])
			setMedicines([])
		} finally {
			setLoading(false)
		}
	}, [appointmentId, stateRecord])

	useEffect(() => {
		loadExamDetail()
	}, [loadExamDetail])

	const pet = useMemo(() => medicalRecord?.pet || appointment?.pet || {}, [appointment?.pet, medicalRecord?.pet])
	const owner = useMemo(() => pet?.owner || {}, [pet])

	const ownerName = medicalRecord?.customerName || owner?.fullName || appointment?.ownerName || FALLBACK_TEXT
	const ownerEmail = medicalRecord?.email || owner?.email || appointment?.ownerEmail || FALLBACK_TEXT
	const ownerPhone = medicalRecord?.phone || owner?.phone || FALLBACK_TEXT
	const petName = medicalRecord?.petName || pet?.name || appointment?.petName || FALLBACK_TEXT
	const speciesLabel = formatEnumLabel(medicalRecord?.species || pet?.species)
	const breedLabel = formatEnumLabel(medicalRecord?.breed || pet?.breed)
	const weightText = medicalRecord?.weight ? String(medicalRecord.weight) : pet?.weight ? String(pet.weight) : FALLBACK_TEXT
	const examName = medicalRecord?.name || appointment?.service || FALLBACK_TEXT
	const followUpDateText = formatDateLabel(medicalRecord?.followUpDate)
	const temperatureText = medicalRecord?.temperature ? String(medicalRecord.temperature) : FALLBACK_TEXT
	const heartRateText = medicalRecord?.heartRate ? String(medicalRecord.heartRate) : FALLBACK_TEXT
	const bloodPressureText =
		medicalRecord?.systolic && medicalRecord?.diastolic
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
			title: 'LOAI XET NGHIEM / CHAN DOAN HINH ANH',
			dataIndex: 'medicalOrder',
			render: (medicalOrder) => medicalOrder?.nameVn || medicalOrder?.nameEng || FALLBACK_TEXT,
		},
		{
			title: 'GHI CHU YEU CAU',
			dataIndex: 'note',
			render: (value) => value || FALLBACK_TEXT,
		},
		{
			title: 'TRANG THAI',
			key: 'status',
			width: 150,
			render: () => <Tag color="blue">Da chi dinh</Tag>,
		},
	]

	const medicineColumns = [
		{
			title: 'TEN THUOC / HAM LUONG',
			dataIndex: 'medicine',
			render: (medicine) => {
				const name = medicine?.name || FALLBACK_TEXT
				const strength = medicine?.strength || medicine?.unit || medicine?.dosage || ''
				return strength ? `${name} (${strength})` : name
			},
		},
		{
			title: 'LIEU DUNG',
			dataIndex: 'quantity',
			render: (value) => (value ? String(value) : FALLBACK_TEXT),
		},
		{
			title: 'TAN SUAT',
			dataIndex: 'note',
			render: (value) => value || FALLBACK_TEXT,
		},
		{
			title: 'GHI CHU',
			dataIndex: 'medicine',
			render: (medicine) => medicine?.note || FALLBACK_TEXT,
		},
	]

	const handleMedicalBill = () => {
		navigate(`${routePrefix}/exam-slips/${appointmentId}/bill`, {
			state: {
				appointmentId,
				appointment,
				medicalRecord,
				medicalOrders,
				medicines,
			},
		})
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
								He thong thu y chuyen nghiep
							</Typography.Title>
						</div>
					</div>

					<div className={styles.headerMeta}>
						<p>PHIEU KHAM BENH & CHI DINH</p>
						<span>Ma ho so: {buildExamCode(medicalRecord?.id)}</span>
						<span>Ngay kham: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)}</span>
					</div>
				</header>

				<Spin spinning={loading}>
					<Card className={styles.sectionCard}>
						<Row gutter={12}>
							<Col xs={24} md={12}>
								<ReadonlyField label="TEN PHIEU KHAM" value={examName} />
							</Col>
							<Col xs={24} md={12}>
								<ReadonlyField label="NGAY TAI KHAM" value={followUpDateText} />
							</Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><UserOutlined /> Thong tin khach hang & Thu cung</span>}>
						<Row gutter={12}>
							<Col xs={24} md={8}><ReadonlyField label="TEN KHACH HANG" value={ownerName} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="EMAIL" value={ownerEmail} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="SDT" value={ownerPhone} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="TEN THU CUNG" value={petName} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="LOAI" value={speciesLabel} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="GIONG LOAI" value={breedLabel} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="CAN NANG (KG)" value={weightText} /></Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><HeartOutlined /> Chi so sinh ton</span>}>
						<Row gutter={12}>
							<Col xs={24} md={8}><ReadonlyField label="NHIET DO (DEG C)" value={temperatureText} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="NHIP TIM (L/P/M)" value={heartRateText} /></Col>
							<Col xs={24} md={8}><ReadonlyField label="HUYET AP (MMHG)" value={bloodPressureText} /></Col>
						</Row>
					</Card>

					<Card className={styles.sectionCard} title={<span><WarningOutlined /> Thong tin lam sang</span>}>
						<Form.Item label="TRIEU CHUNG & TINH TRANG" className={styles.readonlyField}>
							<TextArea value={medicalRecord?.symptoms || FALLBACK_TEXT} rows={3} readOnly />
						</Form.Item>
						<Form.Item label="CHAN DOAN SO BO" className={styles.readonlyField}>
							<TextArea value={medicalRecord?.diagnosis || FALLBACK_TEXT} rows={2} readOnly />
						</Form.Item>
						<Form.Item label="KET LUAN" className={styles.readonlyField}>
							<TextArea value={conclusionSummary} rows={3} readOnly />
						</Form.Item>
					</Card>

					<Card className={styles.sectionCard} title={<span><ExperimentOutlined /> Phieu chi dinh xet nghiem/X-Quang</span>}>
						<Table
							rowKey={(row, index) => row?.id || `order-${index}`}
							columns={orderColumns}
							dataSource={medicalOrders}
							pagination={false}
							locale={{ emptyText: 'Chua co chi dinh xet nghiem' }}
						/>
					</Card>

					<Card className={styles.sectionCard} title={<span><MedicineBoxOutlined /> Don thuoc chi dinh</span>}>
						<Table
							rowKey={(row, index) => row?.id || `medicine-${index}`}
							columns={medicineColumns}
							dataSource={medicines}
							pagination={false}
							locale={{ emptyText: 'Chua co don thuoc' }}
						/>

						<Divider className={styles.noteDivider} />
						<Form.Item label="LOI DAN BAC SI" className={styles.readonlyField}>
							<TextArea value={medicalRecord?.note || 'Khong co ghi chu them tu bac si.'} rows={3} readOnly />
						</Form.Item>

						<div className={styles.doctorSign}>
							<p>
								<CalendarOutlined /> Ngay tao: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)}
							</p>
							<strong>BAC SI DIEU TRI</strong>
							<span>{medicalRecord?.veterinarian?.fullName || appointment?.veterinarianName || FALLBACK_TEXT}</span>
						</div>
					</Card>

					<div className={styles.actionRow}>
						<Button type="primary" className={styles.saveBtn} icon={<FileTextOutlined />} onClick={handleMedicalBill}>
							Hoa don benh an
						</Button>
					</div>
				</Spin>
			</div>
		</div>
	)
}
