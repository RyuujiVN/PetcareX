import {
	CalendarOutlined,
	CameraOutlined,
	EditOutlined,
	EnvironmentOutlined,
	IdcardOutlined,
	MailOutlined,
	MedicineBoxOutlined,
	PhoneOutlined,
	SaveOutlined,
	UserOutlined
} from '@ant-design/icons'
import {
	Avatar,
	Button,
	Card,
	Col,
	DatePicker,
	Descriptions,
	Divider,
	Form,
	Input,
	Modal,
	Row,
	Select,
	Space,
	Statistic,
	Typography,
	Upload,
	message
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getRoleLabel, getSpecialtyLabel, getSpecialtyOptions } from '../../../../constants/veterinaryLabels'
import useVeterinarians from '../../../../hooks/Clinic/useVeterinarians'
import { getAdminInstance } from '../../../../services/apiClient'
import { getUserByIdApi, uploadUserImageApi } from '../../../../services/userService'
import { formatDateDDMMYYYY } from '../../../../utils/dateTimeFormat'
import styles from './InformationVererianrian.module.css'

const { Title, Text } = Typography

const formatDate = (dateValue) => {
	return formatDateDDMMYYYY(dateValue, 'Chưa cập nhật')
}

const parseDay = (dateValue) => {
	if (!dateValue) return null
	const parsed = dayjs(dateValue)
	return parsed.isValid() ? parsed : null
}

const NAME_REGEX = /^[A-Za-zÀ-ỹ]+(?: [A-Za-zÀ-ỹ]+)*$/u

const validateFullName = async (_, value) => {
	const rawValue = value || ''
	const trimmedValue = rawValue.trim()

	if (!trimmedValue) {
		throw new Error('Vui lòng nhập họ tên')
	}

	if (rawValue !== trimmedValue) {
		throw new Error('Họ tên không được có khoảng trắng ở đầu hoặc cuối')
	}

	if (/\s{2,}/.test(rawValue)) {
		throw new Error('Họ tên không được chứa 2 khoảng trắng liên tiếp')
	}

	if (!NAME_REGEX.test(trimmedValue)) {
		throw new Error('Họ tên chỉ được chứa chữ cái và khoảng trắng')
	}
}

const validatePhone = async (_, value) => {
	const rawValue = value || ''
	const trimmedValue = rawValue.trim()

	if (!trimmedValue) {
		throw new Error('Vui lòng nhập số điện thoại')
	}

	if (rawValue !== trimmedValue || /\s/.test(rawValue)) {
		throw new Error('Số điện thoại không được chứa khoảng trắng')
	}

	if (!/^\d+$/.test(trimmedValue)) {
		throw new Error('Số điện thoại chỉ được chứa chữ số')
	}

	if (trimmedValue.length !== 10) {
		throw new Error('Số điện thoại phải đúng 10 chữ số')
	}
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
	const [editAvatarUploading, setEditAvatarUploading] = useState(false)
	const [editUploadedAvatarUrl, setEditUploadedAvatarUrl] = useState('')
	const [initialEditValues, setInitialEditValues] = useState(null)
	const specialtyOptions = useMemo(() => getSpecialtyOptions('vi'), [])

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
				const response = await getUserByIdApi(getAdminInstance(), veterinarian.userId)
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
			}
		}

		enrichUser()
	}, [veterinarian?.user?.address, veterinarian?.user?.phone, veterinarian?.userId])

	const veterinarianView = useMemo(() => {
		const user = veterinarian?.user || {}
		const roleValue = user.role || 'VETERINARIAN'
		const specialtyValue = veterinarian?.specialty || 'GENERAL_EXAMINATION'

		return {
			avatarUrl: user.avatarUrl || '',
			userId: veterinarian?.userId || '',
			fullName: user.fullName || 'Chưa cập nhật',
			specialty: getSpecialtyLabel(specialtyValue, 'vi'),
			specialtyValue,
			role: getRoleLabel(roleValue, 'vi'),
			roleValue,
			joinDate: formatDate(user.createdAt),
			joinDateRaw: user.createdAt || '',
			phone: user.phone || 'Chưa cập nhật',
			email: user.email || 'Chưa cập nhật',
			address: user.address || 'Chưa cập nhật',
			active: !user.deleted,
		}
	}, [veterinarian])

	const openEditModal = () => {
		const initialValues = {
			fullName: veterinarian?.user?.fullName || '',
			email: veterinarian?.user?.email || '',
			phone: veterinarian?.user?.phone || '',
			address: veterinarian?.user?.address || '',
			joinDate: parseDay(veterinarian?.user?.createdAt),
			specialty: veterinarian?.specialty || 'GENERAL_EXAMINATION',
		}

		form.setFieldsValue(initialValues)
		setInitialEditValues(initialValues)
		setEditAvatarFile(null)
		setEditAvatarPreview(veterinarian?.user?.avatarUrl || '')
		setEditUploadedAvatarUrl(veterinarian?.user?.avatarUrl || '')
		setEditOpen(true)
	}

	const hasUnsavedChanges = () => {
		if (editAvatarFile) return true
		if (!initialEditValues) return form.isFieldsTouched(true)

		const currentValues = form.getFieldsValue(true)
		return ['fullName', 'email', 'phone', 'address', 'specialty'].some((key) => {
			return (currentValues?.[key] || '') !== (initialEditValues?.[key] || '')
		})
	}

	const saveEditProfile = async () => {
		if (editAvatarUploading) {
			messageApi.warning('Ảnh đang được tải lên, vui lòng đợi')
			return
		}

		const values = await form.validateFields()
		const normalizedFullName = values.fullName.trim()
		const normalizedPhone = values.phone.trim()
		const normalizedAddress = (values.address || '').trim()
		setEditing(true)
		try {
			const avatarUrl = editUploadedAvatarUrl || veterinarian?.user?.avatarUrl || ''

			await editVeterinarian(veterinarianView.userId, {
				fullName: normalizedFullName,
				email: values.email,
				phone: normalizedPhone,
				address: normalizedAddress,
				avatarUrl,
				specialty: values.specialty,
			})

			setVeterinarian((prev) => {
				const updated = {
					...prev,
					specialty: values.specialty,
					user: {
						...(prev?.user || {}),
						fullName: normalizedFullName,
						email: values.email,
						phone: normalizedPhone,
						address: normalizedAddress,
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
		if (editAvatarUploading) {
			messageApi.warning('Ảnh đang được tải lên, vui lòng đợi hoàn tất')
			return
		}

		const isDirty = hasUnsavedChanges()
		if (!isDirty) {
			setEditOpen(false)
			return
		}

		Modal.confirm({
			title: 'Xác nhận hủy chỉnh sửa',
			content: 'Bạn đang nhập dở thông tin. Nếu hủy, các thay đổi chưa lưu sẽ bị mất.',
			okText: 'Bỏ thay đổi',
			cancelText: 'Tiếp tục chỉnh sửa',
			onOk: () => setEditOpen(false),
		})
	}

	const handleEditAvatarUpload = async (file) => {
		setEditAvatarFile(file)
		setEditAvatarPreview(URL.createObjectURL(file))
		setEditAvatarUploading(true)

		try {
			const uploaded = await uploadUserImageApi(file)
			const avatarUrl = uploaded?.url || uploaded?.file || uploaded?.secure_url || uploaded?.data?.url || ''

			if (!avatarUrl) {
				throw new Error('Không nhận được URL ảnh từ server')
			}

			setEditUploadedAvatarUrl(avatarUrl)
			messageApi.success('Tải ảnh đại diện thành công')
		} catch (error) {
			setEditAvatarFile(null)
			setEditAvatarPreview(veterinarian?.user?.avatarUrl || '')
			setEditUploadedAvatarUrl(veterinarian?.user?.avatarUrl || '')
			messageApi.error(error.message || 'Không thể tải ảnh đại diện')
		} finally {
			setEditAvatarUploading(false)
		}
	}

	const uploadProps = {
		accept: 'image/*',
		showUploadList: false,
		beforeUpload: (file) => {
			handleEditAvatarUpload(file)
			return false
		},
	}

	return (
		<div className={styles.page}>
			{contextHolder}
			<header className={styles.topBar}>
				<h1 style={{fontSize: 24, fontWeight: 'bold'}}>Thông tin bác sĩ</h1>
			</header>

			<section className={styles.content}>
				<Card className={styles.profileCard}>
					<Row gutter={[20, 20]} align="middle">
						<Col xs={24} md={6} lg={5}>
							<div className={styles.avatarWrap}>
								<Avatar
									size={116}
									src={veterinarianView.avatarUrl || undefined}
									icon={<UserOutlined />}
									className={styles.avatar}
								/>
							</div>
						</Col>

						<Col xs={24} md={12} lg={13}>
							<Space direction="vertical" size={8}>
								<Space align="center" wrap>
									<Title level={2} style={{ marginBottom: 0 }} className={styles.nameTitle}>{veterinarianView.fullName}</Title>
								</Space>
								{/* <Space wrap>
									<Tag color="blue" icon={<MedicineBoxOutlined />}>{veterinarianView.specialty}</Tag>
									<Tag color="geekblue" icon={<TeamOutlined />}>{veterinarianView.role}</Tag>
								</Space>
								<Text type="secondary">
									<CalendarOutlined /> Tham gia từ {veterinarianView.joinDate}
								</Text> */}
							</Space>
						</Col>

						<Col xs={24} md={6}>
							<div className={styles.actions}>
								<Button
									style={{background: "#4672b4"}}
									type="primary"
									shape="round"
									icon={<EditOutlined />}
									onClick={openEditModal}
									disabled={saving}
								>
									Chỉnh sửa hồ sơ
								</Button>
							</div>
						</Col>
					</Row>

					<Divider className={styles.divider} />

					<Row gutter={[16, 16]}>
						<Col xs={24} md={8}>
							<Card size="small" className={styles.statCard}>
								<Statistic title="Vai trò" value={veterinarianView.role} prefix={<IdcardOutlined />} />
							</Card>
						</Col>
						<Col xs={24} md={8}>
							<Card size="small" className={styles.statCard}>
								<Statistic title="Chuyên khoa" value={veterinarianView.specialty} prefix={<MedicineBoxOutlined />} />
							</Card>
						</Col>
						<Col xs={24} md={8}>
							<Card size="small" className={styles.statCard}>
								<Statistic title="Ngày tham gia" value={veterinarianView.joinDate} prefix={<CalendarOutlined />} />
							</Card>
						</Col>
					</Row>
				</Card>

				<Card className={styles.infoCard} title="Thông tin cá nhân">
					<Descriptions column={{ xs: 1, md: 2 }} bordered size="middle">
						<Descriptions.Item label="Họ và tên">{veterinarianView.fullName}</Descriptions.Item>
						<Descriptions.Item label="Số điện thoại">
							<PhoneOutlined /> {veterinarianView.phone}
						</Descriptions.Item>
						<Descriptions.Item label="Email">
							<MailOutlined /> {veterinarianView.email}
						</Descriptions.Item>
						<Descriptions.Item label="Địa chỉ">
							<EnvironmentOutlined /> {veterinarianView.address}
						</Descriptions.Item>
					</Descriptions>
				</Card>

				<Modal
					title="Chỉnh sửa hồ sơ bác sĩ"
					open={editOpen}
					onCancel={closeModalWithGuard}
					footer={
						<Space>
							<Button onClick={closeModalWithGuard} disabled={editAvatarUploading || editing || saving}>Hủy</Button>
							<Button
								type="primary"
								icon={<SaveOutlined />}
								loading={editing || saving}
								onClick={saveEditProfile}
								disabled={editAvatarUploading}
							>
								{editAvatarUploading ? 'Đang tải ảnh...' : 'Lưu hồ sơ'}
							</Button>
						</Space>
					}
				>
					<div className={styles.modalAvatarWrap}>
						<Avatar size={90} src={editAvatarPreview || undefined} icon={<UserOutlined />} />
						<Upload {...uploadProps}>
							<Button
								icon={<CameraOutlined />}
								className={styles.modalUploadButton}
								disabled={editAvatarUploading || editing || saving}
								loading={editAvatarUploading}
							>
								Đổi ảnh đại diện
							</Button>
						</Upload>
					</div>

					<Form form={form} layout="vertical" className={styles.editForm}>
						<Row gutter={14}>
							<Col span={12}>
								<Form.Item
									name="fullName"
									label="Họ và tên"
									rules={[{ validator: validateFullName }]}
								>
									<Input prefix={<UserOutlined />} maxLength={80} />
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
								<Form.Item name="phone" label="Số điện thoại" rules={[{ validator: validatePhone }]}>
									<Input prefix={<PhoneOutlined />} maxLength={10} inputMode="numeric" />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="specialty" label="Chuyên khoa">
									<Select  size="large" options={specialtyOptions} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="address" label="Địa chỉ">
									<Input prefix={<EnvironmentOutlined />} />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item name="joinDate" label="Ngày tham gia">
									<DatePicker
										style={{ width: '100%', height: 40 }}
										format="DD/MM/YYYY"
										disabled
										inputReadOnly
										suffixIcon={<CalendarOutlined />}
									/>
								</Form.Item>
							</Col>
						</Row>
					</Form>
				</Modal>
			</section>
		</div>
	)
}
