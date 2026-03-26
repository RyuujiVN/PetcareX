import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
	Avatar,
	Badge,
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
	Tag,
	Typography,
	Upload,
	message,
} from 'antd'
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
	SearchOutlined,
	TeamOutlined,
	UserOutlined,
} from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import useVeterinarians from '../../../../data/adminClinic/api/useVeterinarians'
import { getUserByIdApi, uploadUserImageApi } from '../../../../data/adminClinic/api/user'
import { getRoleLabel, getSpecialtyLabel, getSpecialtyOptions } from '../../../../constants/veterinaryLabels'
import styles from './InformationVererianrian.module.css'

const { Title, Text } = Typography

const formatDate = (dateValue) => {
	if (!dateValue) return 'Chưa cập nhật'

	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'

	return date.toLocaleDateString('vi-VN')
}

const parseDay = (dateValue) => {
	if (!dateValue) return null
	const parsed = dayjs(dateValue)
	return parsed.isValid() ? parsed : null
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
		form.setFieldsValue({
			fullName: veterinarian?.user?.fullName || '',
			email: veterinarian?.user?.email || '',
			phone: veterinarian?.user?.phone || '',
			address: veterinarian?.user?.address || '',
			joinDate: parseDay(veterinarian?.user?.createdAt),
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
				avatarUrl = uploaded?.url || uploaded?.file || uploaded?.secure_url || uploaded?.data?.url || avatarUrl
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
			content: 'Bạn đang chỉnh sửa thông tin. Chọn "Lưu hồ sơ" để lưu, hoặc "Thoát không lưu".',
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
					<input type="text" placeholder="Tìm theo tên, email, chuyên khoa..." value="" readOnly />
				</div>
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
									<Title level={2} className={styles.nameTitle}>{veterinarianView.fullName}</Title>
									<Badge
										status={veterinarianView.active ? 'success' : 'default'}
										text={veterinarianView.active ? 'Đang hoạt động' : 'Tạm khóa'}
									/>
								</Space>
								<Space wrap>
									<Tag color="blue" icon={<MedicineBoxOutlined />}>{veterinarianView.specialty}</Tag>
									<Tag color="geekblue" icon={<TeamOutlined />}>{veterinarianView.role}</Tag>
								</Space>
								<Text type="secondary">
									<CalendarOutlined /> Tham gia từ {veterinarianView.joinDate}
								</Text>
							</Space>
						</Col>

						<Col xs={24} md={6}>
							<div className={styles.actions}>
								<Button
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
							<Button icon={<CameraOutlined />} className={styles.modalUploadButton}>Đổi ảnh đại diện</Button>
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
							<Col xs={24} md={14}>
								<Form.Item name="address" label="Địa chỉ">
									<Input prefix={<EnvironmentOutlined />} />
								</Form.Item>
							</Col>
							<Col xs={24} md={10}>
								<Form.Item name="joinDate" label="Ngày tham gia">
									<DatePicker
										style={{ width: '100%' }}
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
