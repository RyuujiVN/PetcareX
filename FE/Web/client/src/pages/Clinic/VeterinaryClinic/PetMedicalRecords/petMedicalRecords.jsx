import { useCallback, useEffect, useMemo, useState } from 'react'
import { Spin, message } from 'antd'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
	FaHeartbeat,
	FaPaw,
	FaPills,
	FaStethoscope,
	FaThermometerHalf,
	FaTint,
	FaUserMd,
	FaVial,
} from 'react-icons/fa'
import { getClinicAppointmentByIdApi } from '../../../../data/Clinic/api/appointmentApi'
import {
	getLatestMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
} from '../../../../data/Clinic/api/medicalApi'
import styles from './petMedicalRecords.module.css'

const FALLBACK_TEXT = 'Chua cap nhat'

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

function Field({ label, value, placeholder = '', isSelect = false }) {
	const displayValue = value ?? ''

	return (
		<label className={styles.fieldGroup}>
			<span>{label}</span>
			{isSelect ? (
				<select value={displayValue} disabled>
					<option>{displayValue || placeholder || FALLBACK_TEXT}</option>
				</select>
			) : (
				<input value={displayValue} placeholder={placeholder} readOnly />
			)}
		</label>
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

			const latestMedical = await getLatestMedicalByPetId(resolvedPetId)
			setMedicalRecord(latestMedical || null)

			if (!latestMedical?.id) {
				setMedicalOrders([])
				setMedicines([])
				return
			}

			const [ordersPayload, medicinesPayload] = await Promise.all([
				getMedicalOrdersByMedicalId(latestMedical.id).catch(() => []),
				getMedicinesByMedicalId(latestMedical.id).catch(() => []),
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
		<div className={styles.page}>
			<div className={styles.pageWrap}>
				<header className={styles.headerCard}>
					<div className={styles.brandBox}>
						<div className={styles.brandIcon}>
							<FaPaw />
						</div>
						<div>
							<h1>PETCAR</h1>
							<p>He thong thu y chuyen nghiep</p>
						</div>
					</div>

					<div className={styles.headerMeta}>
						<h2>PHIEU KHAM BENH &amp; CHI DINH</h2>
						<p>Ma ho so: {buildExamCode(medicalRecord?.id)}</p>
						<p>Ngay kham: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)}</p>
					</div>
				</header>

				{loading ? (
					<div className={styles.card}>
						<div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
							<Spin size="large" />
						</div>
					</div>
				) : null}

				<section className={styles.card}>
					<div className={styles.twoColumns}>
						<Field label="TEN PHIEU KHAM" value={examName} />
						<Field label="NGAY TAI KHAM" value={followUpDateText} placeholder="dd/mm/yyyy" />
					</div>
				</section>

				<section className={styles.card}>
					<h3>
						<FaUserMd /> Thong tin khach hang &amp; Thu cung
					</h3>

					<div className={styles.threeColumns}>
						<Field label="TEN KHACH HANG" value={ownerName} />
						<Field label="EMAIL" value={ownerEmail} />
						<Field label="SDT" value={ownerPhone} />
						<Field label="TEN THU CUNG" value={petName} />
						<Field label="GIONG LOAI" value={`${speciesLabel} - ${breedLabel}`} isSelect />
						<Field label="CAN NANG (KG)" value={weightText} />
					</div>
				</section>

				<section className={styles.card}>
					<h3>
						<FaStethoscope /> Chi so sinh ton
					</h3>

					<div className={styles.vitalsGrid}>
						<article className={styles.vitalItem}>
							<div className={styles.vitalTitle}>
								<FaThermometerHalf /> NHIET DO (DEG C)
							</div>
							<strong>{temperatureText}</strong>
						</article>

						<article className={styles.vitalItem}>
							<div className={styles.vitalTitle}>
								<FaHeartbeat /> NHIP TIM (L/P/M)
							</div>
							<strong>{heartRateText}</strong>
						</article>

						<article className={styles.vitalItem}>
							<div className={styles.vitalTitle}>
								<FaTint /> HUYET AP (MMHG)
							</div>
							<strong>{bloodPressureText}</strong>
						</article>
					</div>
				</section>

				<section className={styles.card}>
					<h3>
						<FaStethoscope /> Thong tin lam sang
					</h3>

					<label className={styles.fieldGroup}>
						<span>TRIEU CHUNG &amp; TINH TRANG</span>
						<textarea value={medicalRecord?.symptoms || FALLBACK_TEXT} readOnly />
					</label>

					<label className={styles.fieldGroup}>
						<span>CHAN DOAN SO BO</span>
						<input value={medicalRecord?.diagnosis || FALLBACK_TEXT} readOnly />
					</label>

					<label className={styles.fieldGroup}>
						<span>KET LUAN</span>
						<textarea value={conclusionSummary} readOnly />
					</label>
				</section>

				<section className={styles.card}>
					<div className={styles.sectionHeader}>
						<h3>
							<FaVial /> Phieu chi dinh xet nghiem/X-Quang
						</h3>
					</div>

					<div className={styles.tableWrap}>
						<table>
							<thead>
								<tr>
									<th>STT</th>
									<th>LOAI XET NGHIEM / CHAN DOAN HINH ANH</th>
									<th>GHI CHU YEU CAU</th>
									<th>TRANG THAI</th>
								</tr>
							</thead>
							<tbody>
								{medicalOrders.length > 0 ? (
									medicalOrders.map((item, index) => (
										<tr key={item?.id || `order-${index}`}>
											<td>{index + 1}</td>
											<td>{item?.medicalOrder?.nameVn || item?.medicalOrder?.nameEng || FALLBACK_TEXT}</td>
											<td>{item?.note || FALLBACK_TEXT}</td>
											<td>
												<span className={styles.waitingTag}>Da chi dinh</span>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={4}>Chua co chi dinh xet nghiem</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>

				<section className={styles.card}>
					<div className={styles.sectionHeader}>
						<h3>
							<FaPills /> Don thuoc chi dinh
						</h3>
					</div>

					<div className={styles.tableWrap}>
						<table>
							<thead>
								<tr>
									<th>TEN THUOC / HAM LUONG</th>
									<th>LIEU DUNG</th>
									<th>TAN SUAT</th>
									<th>GHI CHU</th>
								</tr>
							</thead>
							<tbody>
								{medicines.length > 0 ? (
									medicines.map((item, index) => (
										<tr key={item?.id || `medicine-${index}`}>
											<td>
												<strong>{item?.medicine?.name || FALLBACK_TEXT}</strong>
												<p>{item?.medicine?.unit || FALLBACK_TEXT}</p>
											</td>
											<td>{item?.quantity || FALLBACK_TEXT}</td>
											<td>{item?.note || FALLBACK_TEXT}</td>
											<td>{item?.medicine?.note || FALLBACK_TEXT}</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={4}>Chua co don thuoc</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>

				<footer className={styles.footerCard}>
					<div className={styles.noteBox}>
						<h4>Loi dan bac si:</h4>
						<p>{medicalRecord?.note || 'Khong co ghi chu them tu bac si.'}</p>
					</div>

					<div className={styles.signatureBlock}>
						<p>Ngay tao: {formatDateLabel(medicalRecord?.createdAt || appointment?.appointmentDate)}</p>
						<h5>BAC SI DIEU TRI</h5>
						<strong>{medicalRecord?.veterinarian?.fullName || appointment?.veterinarianName || FALLBACK_TEXT}</strong>
					</div>
				</footer>

				<div className={styles.actionRow}>
					<button type="button" className={styles.saveBtn} onClick={handleMedicalBill}>
						Hoa don benh an
					</button>
				</div>
			</div>
		</div>
	)
}
