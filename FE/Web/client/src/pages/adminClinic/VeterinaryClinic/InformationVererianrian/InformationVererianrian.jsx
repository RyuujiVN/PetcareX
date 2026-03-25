import { useEffect, useMemo, useState } from 'react'
import {
	Avatar,
	Button,
	Col,
	Form,
	Input,
	Modal,
	Row,
	Select,
	Space,
	Upload,
	message,
} from 'antd'
import {
	BellOutlined,
	CameraOutlined,
	EditOutlined,
	MailOutlined,
	PhoneOutlined,
	SaveOutlined,
	SearchOutlined,
	SolutionOutlined,
	UserOutlined,
} from '@ant-design/icons'
import {
	FaCalendarAlt,
	FaStethoscope,
	FaRegAddressCard,
} from 'react-icons/fa'
import { useLocation } from 'react-router-dom'
import useVeterinarians from '../../../../data/adminClinic/api/useVeterinarians'
import { getUserByIdApi, uploadUserImageApi } from '../../../../data/adminClinic/api/user'
import styles from './InformationVererianrian.module.css'

const specialtyOptions = [
	{ value: 'GENERAL_EXAMINATION', label: 'Khám tổng quát' },
	{ value: 'INTERNAL_MEDICINE', label: 'Nội khoa' },
	{ value: 'SURGERY', label: 'Ngoại khoa' },
	{ value: 'ULTRASOUND', label: 'Chẩn đoán hình ảnh' },
	{ value: 'VACCINATION_AND_PREVENTION', label: 'Tiêm chủng' },
]

const formatSpecialtyLabel = (specialty) => {
	if (!specialty) return 'Chưa cập nhật'

	return specialty
		.toString()
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

const formatDate = (dateValue) => {
	if (!dateValue) return 'Chưa cập nhật'

	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'

	return date.toLocaleDateString('vi-VN')
}

const getStoredVeterinarian = () => {
	try {
		const raw = sessionStorage.getItem('selectedVeterinarian')
		if (!raw) return null
		return JSON.parse(raw)
	} catch {
		return null
	}
}

export default function InformationVererianrian() {
	const location = useLocation()
 	const [form] = Form.useForm()
	const [messageApi, contextHolder] = message.useMessage()
	const { saving, editVeterinarian } = useVeterinarians()
 	const [editOpen, setEditOpen] = useState(false)
 	const [editing, setEditing] = useState(false)
 	const [editAvatarFile, setEditAvatarFile] = useState(null)
 	const [editAvatarPreview, setEditAvatarPreview] = useState('')

	const [veterinarian, setVeterinarian] = useState(() => {
		const fromLocation = location.state?.veterinarian
		if (fromLocation) {
			sessionStorage.setItem('selectedVeterinarian', JSON.stringify(fromLocation))
			return fromLocation
		}

		return getStoredVeterinarian()
	})

	useEffect(() => {
		const enrichUser = async () => {
			if (!veterinarian?.userId) return
			if (veterinarian?.user?.phone && veterinarian?.user?.address) return

			try {
				const response = await getUserByIdApi(veterinarian.userId)
				const userData = response?.data
				if (!userData) return

				setVeterinarian((prev) => {
					const merged = {
						...prev,
						user: {
							...(prev?.user || {}),
							...userData,
						},
					}
					sessionStorage.setItem('selectedVeterinarian', JSON.stringify(merged))
					return merged
				})
			} catch {
				// Keep current data if additional user profile fetch fails.
			}
		}

		enrichUser()
	}, [veterinarian?.user?.address, veterinarian?.user?.phone, veterinarian?.userId])

	const veterinarianView = useMemo(() => {
		const user = veterinarian?.user || {}
		return {
			avatarUrl: user.avatarUrl || '',
			userId: veterinarian?.userId || '',
			fullName: user.fullName || 'Chưa cập nhật',
			specialty: formatSpecialtyLabel(veterinarian?.specialty),
			specialtyValue: veterinarian?.specialty || 'GENERAL_EXAMINATION',
			role: user.role || 'VETERINARIAN',
			joinDate: formatDate(user.createdAt),
			phone: user.phone || 'Chưa cập nhật',
			email: user.email || 'Chưa cập nhật',
			address: user.address || 'Chưa cập nhật',
			active: !user.deleted,
		}
	}, [veterinarian])

	const openEditModal = () => {
		form.setFieldsValue({
			fullName: veterinarian?.user?.fullName || '',
			email: veterinarian?.user?.email || '',
			phone: veterinarian?.user?.phone || '',
			address: veterinarian?.user?.address || '',
			specialty: veterinarian?.specialty || 'GENERAL_EXAMINATION',
		})
		setEditAvatarFile(null)
		setEditAvatarPreview(veterinarian?.user?.avatarUrl || '')
		setEditOpen(true)
	}

	const saveEditProfile = async () => {
		const values = await form.validateFields()
		setEditing(true)
		try {
			let avatarUrl = veterinarian?.user?.avatarUrl || ''
			if (editAvatarFile) {
				const uploaded = await uploadUserImageApi(editAvatarFile)
				avatarUrl = uploaded?.url || uploaded?.secure_url || uploaded?.data?.url || avatarUrl
			}

			await editVeterinarian(veterinarianView.userId, {
				fullName: values.fullName,
				email: values.email,
				phone: values.phone || '',
				address: values.address || '',
				avatarUrl,
				specialty: values.specialty,
			})

			setVeterinarian((prev) => {
				const updated = {
					...prev,
					specialty: values.specialty,
					user: {
						...(prev?.user || {}),
						fullName: values.fullName,
						email: values.email,
						phone: values.phone || '',
						address: values.address || '',
						avatarUrl,
					},
				}
				sessionStorage.setItem('selectedVeterinarian', JSON.stringify(updated))
				return updated
			})

			messageApi.success('Cập nhật hồ sơ bác sĩ thành công')
			setEditOpen(false)
		} catch (error) {
			if (error?.errorFields) return
			messageApi.error(error.message || 'Không thể cập nhật hồ sơ bác sĩ')
		} finally {
			setEditing(false)
		}
	}

	const closeModalWithGuard = () => {
		const isDirty = form.isFieldsTouched(true) || Boolean(editAvatarFile)
		if (!isDirty) {
			setEditOpen(false)
			return
		}

		Modal.confirm({
			title: 'Bạn muốn thoát thay đổi?',
			content: 'Bạn đang chỉnh sửa dở. Chọn "Lưu hồ sơ" để lưu, hoặc "Thoát không lưu".',
			okText: 'Lưu hồ sơ',
			cancelText: 'Thoát không lưu',
			onOk: saveEditProfile,
			onCancel: () => setEditOpen(false),
		})
	}

	const uploadProps = {
		accept: 'image/*',
		showUploadList: false,
		beforeUpload: (file) => {
			setEditAvatarFile(file)
			setEditAvatarPreview(URL.createObjectURL(file))
			return false
		},
	}

	return (
		<div className={styles.page}>
			{contextHolder}
			<header className={styles.topBar}>
				<div className={styles.searchBox}>
					<SearchOutlined className={styles.searchIcon} />
					<input type="text" placeholder="Tìm kiếm thú cưng, khách hàng..." value="" readOnly />
				</div>
				<button type="button" className={styles.notificationButton} aria-label="Thông báo">
					<BellOutlined />
				</button>
			</header>

			<section className={styles.content}>
				<article className={styles.profileHead}>
					<div className={styles.avatarWrap}>
						<Avatar
							size={114}
							src={veterinarianView.avatarUrl || undefined}
							icon={<UserOutlined />}
							className={styles.avatar}
						/>
					</div>

					<div className={styles.headInfo}>
						<h1>
							{veterinarianView.fullName} <span>{veterinarianView.active ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}</span>
						</h1>

						<div className={styles.metaLine}>
							<p>
								<FaStethoscope /> {veterinarianView.specialty}
							</p>
							<p>
								<FaStethoscope /> {veterinarianView.role}
							</p>
						</div>

						<p className={styles.joinDate}>
							<FaCalendarAlt /> Tham gia: {veterinarianView.joinDate}
						</p>
					</div>

					<div className={styles.actions}>
						<button
							type="button"
							className={styles.editButton}
							onClick={openEditModal}
							disabled={saving}
						>
							<EditOutlined /> Chỉnh sửa hồ sơ
						</button>
					</div>
				</article>

				<article className={styles.infoCard}>
					<div className={styles.cardTitle}>
						<h2>Thông tin cá nhân</h2>
						<FaRegAddressCard />
					</div>

					<div className={styles.infoGrid}>
						<div className={styles.infoItem}>
							<span>HỌ VÀ TÊN</span>
							<strong>{veterinarianView.fullName}</strong>
						</div>

						<div className={styles.infoItem}>
							<span>SỐ ĐIỆN THOẠI</span>
							<strong>{veterinarianView.phone}</strong>
						</div>

						<div className={styles.infoItem}>
							<span>EMAIL</span>
							<strong>{veterinarianView.email}</strong>
						</div>

						<div className={styles.infoItem}>
							<span>ĐỊA CHỈ</span>
							<strong>{veterinarianView.address}</strong>
						</div>
					</div>
				</article>

				<Modal
					title="Chỉnh sửa hồ sơ bác sĩ"
					open={editOpen}
					onCancel={closeModalWithGuard}
					footer={
						<Space>
							<Button onClick={closeModalWithGuard}>Hủy</Button>
							<Button type="primary" icon={<SaveOutlined />} loading={editing || saving} onClick={saveEditProfile}>
								Lưu hồ sơ
							</Button>
						</Space>
					}
				>
					<div className={styles.modalAvatarWrap}>
						<Avatar size={90} src={editAvatarPreview || undefined} icon={<UserOutlined />} />
						<Upload {...uploadProps}>
							<Button icon={<CameraOutlined />} className={styles.modalUploadButton}>Đổi ảnh</Button>
						</Upload>
					</div>

					<Form form={form} layout="vertical" className={styles.editForm}>
						<Row gutter={14}>
							<Col span={12}>
								<Form.Item
									name="fullName"
									label="Họ và tên"
									rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
								>
									<Input prefix={<UserOutlined />} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item
									name="email"
									label="Email"
									rules={[
										{ required: true, message: 'Vui lòng nhập email' },
										{ type: 'email', message: 'Email không hợp lệ' },
									]}
								>
									<Input prefix={<MailOutlined />} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="phone" label="Số điện thoại">
									<Input prefix={<PhoneOutlined />} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="specialty" label="Chuyên khoa">
									<Select options={specialtyOptions} />
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item name="address" label="Địa chỉ">
									<Input prefix={<SolutionOutlined />} />
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</section>
		</div>
	)
}
