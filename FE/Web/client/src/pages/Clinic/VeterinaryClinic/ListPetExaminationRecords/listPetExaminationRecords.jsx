import { FileTextOutlined } from '@ant-design/icons'
import { Button, DatePicker, Empty, Select, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { APPOINTMENT_STATUS, getAppointmentsApi } from '../../../../services/appointmentService'
import { getAdminInstance } from '../../../../services/apiClient'
import { getPetSpeciesApi } from '../../../../services/petService'
import {
    getAppointmentStatusLabel,
    getPetBreedLabel,
    getPetSpeciesLabel,
} from '../../../../utils/enumLabel'
import styles from './listPetExaminationRecords.module.css'

const normalizeDate = (dateValue) => {
	if (!dateValue) return ''

	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return ''

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}


const getAgeLabel = (dateOfBirth, t) => {
	if (!dateOfBirth) return t('examForm.common.unknownAge')

	const birthDate = new Date(dateOfBirth)
	if (Number.isNaN(birthDate.getTime())) return t('examForm.common.unknownAge')

	const now = new Date()
	let totalMonths =
		(now.getFullYear() - birthDate.getFullYear()) * 12 +
		(now.getMonth() - birthDate.getMonth())

	if (now.getDate() < birthDate.getDate()) {
		totalMonths -= 1
	}

	if (totalMonths < 0) return t('examForm.common.unknownAge')
	if (totalMonths < 24) return t('examForm.common.monthsOld', { count: totalMonths })
	return t('examForm.common.yearsOld', { count: Math.floor(totalMonths / 12) })
}

const getStatusLabel = (status, t) => getAppointmentStatusLabel(status, status || t('examForm.common.unknownStatus'))

export default function ListPetExaminationRecords() {
	const { t, i18n } = useTranslation('clinic')
	const navigate = useNavigate()
	const location = useLocation()
	const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN'
	const isVeterinarianPortal = location.pathname.startsWith('/veterinarian')
	const routePrefix = isVeterinarianPortal ? '/veterinarian' : '/clinic'
	const [records, setRecords] = useState([])
	const [loading, setLoading] = useState(false)
	const [loadingSpecies, setLoadingSpecies] = useState(false)
	const [selectedDate, setSelectedDate] = useState('')
	const [selectedSpecies, setSelectedSpecies] = useState('ALL')
	const [searchText, setSearchText] = useState('')
	const [speciesList, setSpeciesList] = useState([])

	const fetchSpecies = useCallback(async () => {
		try {
			setLoadingSpecies(true)
			const response = await getPetSpeciesApi(getAdminInstance())
			setSpeciesList(Array.isArray(response) ? response : [])
		} catch {
			setSpeciesList([])
		} finally {
			setLoadingSpecies(false)
		}
	}, [])

	const fetchExaminationRecords = useCallback(async () => {
		try {
			setLoading(true)

			const response = await getAppointmentsApi(getAdminInstance(), {
				page: 1,
				limit: 300,
				date: selectedDate || undefined,
			})

			const items = Array.isArray(response?.items) ? response.items : []
			const mappedItems = items
				.filter((item) => item?.status !== APPOINTMENT_STATUS.CANCELLED)
				.map((item) => {
					const speciesRaw = item?.pet?.species || ''
					const speciesLabel = getPetSpeciesLabel(speciesRaw, t('examForm.common.unknownStatus'))
					const breedLabel = getPetBreedLabel(item?.pet?.breed, speciesRaw, '')

					return {
						id: item?.id,
						petId: item?.pet?.id || '',
						ownerId: item?.pet?.owner?.id || '',
						appointmentDate: item?.appointmentDate,
						appointmentTime: item?.appointmentTime,
						status: item?.status,
						statusLabel: getStatusLabel(item?.status, t),
						service: item?.service || t('examForm.common.unknownStatus'),
						petName: item?.pet?.name || t('examForm.common.unknownPetName'),
						petAvatar: item?.pet?.avatar || '',
						speciesRaw,
						speciesLabel,
						breed: breedLabel,
						ownerName: item?.pet?.owner?.fullName || t('examForm.common.unknownOwner'),
						ageLabel: getAgeLabel(item?.pet?.dateOfBirth, t),
						note: item?.note || t('examForm.common.noNotes'),
						dateKey: normalizeDate(item?.appointmentDate),
					}
				})

			setRecords(mappedItems)
			setSelectedSpecies((current) => {
				if (current === 'ALL') return current
				const existsInBackend = speciesList.includes(current)
				const existsInRecords = mappedItems.some((item) => item.speciesRaw === current)
				return existsInBackend || existsInRecords ? current : 'ALL'
			})
		} catch (error) {
			message.error(error.message || t('examForm.messages.fetchFailed'))
			setRecords([])
		} finally {
			setLoading(false)
		}
	}, [selectedDate, speciesList, t])

	useEffect(() => {
		fetchSpecies()
	}, [fetchSpecies])

	useEffect(() => {
		fetchExaminationRecords()
	}, [fetchExaminationRecords])

	const speciesOptions = useMemo(() => {
		const dataSpecies = [...new Set(records.map((item) => item.speciesRaw).filter(Boolean))]
		const availableSpecies = speciesList.length > 0 ? speciesList : dataSpecies

		return [
			{ style: {height: 30, display: 'flex', alignItems: 'center'}, label: t('examForm.filters.allSpecies'), value: 'ALL'},
				...availableSpecies.map((item) => ({ label: getPetSpeciesLabel(item, t('examForm.common.unknownStatus')), value: item })),
		]
	}, [records, speciesList, t])

	const visibleRecords = useMemo(() => {
		const keyword = searchText.trim().toLowerCase()

		return records.filter((item) => {
			if (selectedSpecies !== 'ALL' && item.speciesRaw !== selectedSpecies) {
				return false
			}

			if (selectedDate && item.dateKey !== selectedDate) {
				return false
			}

			if (keyword) {
				const searchable = [item.petName, item.ownerName, item.speciesLabel, item.breed].join(' ').toLowerCase()
				if (!searchable.includes(keyword)) {
					return false
				}
			}

			return true
		})
	}, [records, searchText, selectedDate, selectedSpecies])

	const openRecordDetail = (record) => {
		if (!record?.id) {
			message.warning(t('examForm.messages.notFound'))
			return
		}

		navigate(`${routePrefix}/exam-slips/${record.id}`, {
			state: {
				record,
			},
		})
	}

	return (
		<div className={styles.page}>
			<header className={styles.topBar}>
				<div className={styles.titleBlock}>
					<h1 style={{fontSize: 25}}>{t('examForm.list.pageTitle')}</h1>
				</div>
				<div className={styles.topBarActionSpacer} aria-hidden="true" />
			</header>

			<section className={styles.content}>


				<div className={styles.filtersRow}>
					<Select
						className={styles.speciesSelect}
						value={selectedSpecies}
						onChange={setSelectedSpecies}
						options={speciesOptions}
						loading={loadingSpecies}
					/>

					<DatePicker
						className={styles.datePicker}
						format="DD/MM/YYYY"
						placeholder={t('examForm.filters.selectDate')}
						value={selectedDate ? dayjs(selectedDate) : null}
						onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : '')}
						allowClear
					/>
				</div>

				{loading ? (
					<div className={styles.loadingState}>
						<Spin size="large" />
					</div>
				) : visibleRecords.length === 0 ? (
					<div className={styles.emptyState}>
						<Empty
							description={
								<>
									<div className={styles.emptyTitle}>{t('examForm.list.emptyTitle')}</div>
									<div className={styles.emptyDescription}>{t('examForm.list.emptyDescription')}</div>
								</>
							}
						/>
					</div>
				) : (
					<div className={styles.cardsGrid}>
						{visibleRecords.map((record) => (
							<article key={record.id} className={styles.petCard}>
								<div className={styles.petImageWrap}>
									{record.petAvatar ? (
										<img src={record.petAvatar} alt={record.petName} className={styles.petImage} />
									) : (
										<div className={styles.petImagePlaceholder}>{record.petName.charAt(0).toUpperCase()}</div>
									)}
								</div>

								<div className={styles.cardBody}>
									<div className={styles.petHeaderRow}>
										<h3 style={{fontSize: 23}}> {record.petName}</h3>
										<span className={styles.ageBadge}>{t('examForm.list.fields.age')}: {record.ageLabel}</span>
									</div>

									<p style={{fontSize: 16}} className={styles.speciesText}>{t('examForm.list.fields.species')}: {record.breed || record.speciesLabel}</p>
									<p style={{fontSize: 16}} className={styles.ownerText}>{t('examForm.list.fields.owner')}: {record.ownerName}</p>

									<Button type="default" className={styles.viewButton} onClick={() => openRecordDetail(record)}>
										<FileTextOutlined />
										<span>{t('examForm.list.viewExamSlip')}</span>
									</Button>
								</div>
							</article>
						))}
					</div>
				)}
			</section>
		</div>
	)
}
