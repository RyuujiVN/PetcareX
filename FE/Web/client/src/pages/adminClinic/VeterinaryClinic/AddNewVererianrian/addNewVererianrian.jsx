import { useState } from 'react'
import {
	Avatar,
	Button,
	Card,
	Col,
	Form,
	Input,
	Modal,
	Row,
	Select,
	Space,
	message,
	Upload,
} from 'antd'
import {
	BellOutlined,
	CameraOutlined,
	EyeInvisibleOutlined,
	EyeTwoTone,
	LockOutlined,
	MailOutlined,
	SaveOutlined,
	SearchOutlined,
	UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useVeterinarians from '../../../../data/adminClinic/api/useVeterinarians'
import { uploadUserImageApi } from '../../../../data/adminClinic/api/user'
import styles from './addNewVererianrian.module.css'

const specialtyOptions = [
	{ value: 'GENERAL_EXAMINATION', label: 'Khám tổng quát' },
	{ value: 'INTERNAL_MEDICINE', label: 'Nội khoa' },
	{ value: 'SURGERY', label: 'Ngoại khoa' },
	{ value: 'ULTRASOUND', label: 'Chẩn đoán hình ảnh' },
	{ value: 'VACCINATION_AND_PREVENTION', label: 'Tiêm chủng' },
]

const defaultFormValues = {
	fullName: '',
	email: '',
	password: '',
	specialty: 'GENERAL_EXAMINATION',
}

export default function AddNewVererianrian() {
	const navigate = useNavigate()
	const [form] = Form.useForm()
	const [messageApi, contextHolder] = message.useMessage()
	const { saving, addVeterinarian, editVeterinarian } = useVeterinarians()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [avatarFile, setAvatarFile] = useState(null)
	const [avatarPreview, setAvatarPreview] = useState('')

	const navigateToListWithFlash = (text) => {
		sessionStorage.setItem('veterinarianFlashMessage', text)
		navigate('/admin/clinic/veterinarians')
	}

	const handleSubmit = async (values) => {
		setIsSubmitting(true)
		try {
			const created = await addVeterinarian({
				fullName: values.fullName,
				email: values.email,
				password: values.password,
				specialty: values.specialty,
			})

			if (avatarFile && created?.userId) {
				const uploaded = await uploadUserImageApi(avatarFile)
				const avatarUrl = uploaded?.url || uploaded?.secure_url || uploaded?.data?.url || ''

				if (avatarUrl) {
					await editVeterinarian(created.userId, {
						fullName: values.fullName,
						email: values.email,
						phone: '',
						address: '',
						avatarUrl,
						specialty: values.specialty,
					})
				}
			}

			navigateToListWithFlash('Thêm bác sĩ mới thành công')
		} catch (error) {
			messageApi.error(error.message || 'Không thể lưu thông tin bác sĩ')
		} finally {
			setIsSubmitting(false)
		}
	}

	const hasPendingChanges = () => form.isFieldsTouched(true) || Boolean(avatarFile)

	const handleCancel = () => {
		if (!hasPendingChanges()) {
			navigate('/admin/clinic/veterinarians')
			return
		}

		Modal.confirm({
			title: 'Bạn muốn thoát thay đổi?',
			content: 'Bạn đang nhập dở. Bạn có chắc muốn thoát mà không lưu?',
			okText: 'Thoát không lưu',
			cancelText: 'Ở lại',
			onOk: () => {
				navigate('/admin/clinic/veterinarians')
			},
			onCancel: () => {
				// keep editing
			},
		})
	}

	const fullNamePreview = Form.useWatch('fullName', form)

	const uploadProps = {
		accept: 'image/*',
		showUploadList: false,
		beforeUpload: (file) => {
			setAvatarFile(file)
			setAvatarPreview(URL.createObjectURL(file))
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
				<h1 style={{fontSize: 25}}>Thêm mới bác sĩ</h1>
				<p>Điền thông tin cá nhân của bạn để nhận dịch vụ tốt nhất</p>

				<Card className={styles.formCard}>
					<div className={styles.avatarWrap}>
						<Avatar
							size={156}
							icon={<UserOutlined />}
							src={avatarPreview || undefined}
							className={styles.avatar}
						/>
						<Upload {...uploadProps}>
							<Button
								type="primary"
								shape="circle"
								icon={<CameraOutlined />}
								className={styles.avatarButton}
							/>
						</Upload>
					</div>

					<h2>{fullNamePreview || 'Bác sĩ mới'}</h2>

					<Form
						layout="vertical"
						form={form}
						initialValues={defaultFormValues}
						onFinish={handleSubmit}
						className={styles.antForm}
					>
						<Row gutter={16}>
							<Col xs={24} md={12}>
								<Form.Item
									name="fullName"
									label="Tên"
									rules={[{ required: true, message: 'Vui lòng nhập tên bác sĩ' }]}
								>
									<Input prefix={<UserOutlined />} placeholder="Nhập tên bác sĩ" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item
									name="specialty"
									label="Chuyên khoa"
									rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa' }]}
								>
									<Select options={specialtyOptions} placeholder="Chọn chuyên khoa" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item
									name="email"
									label="Email"
									rules={[
										{ required: true, message: 'Vui lòng nhập email' },
										{ type: 'email', message: 'Email không đúng định dạng' },
									]}
								>
									<Input prefix={<MailOutlined />} placeholder="example@email.com" />
								</Form.Item>
							</Col>
							<Col xs={24} md={12}>
								<Form.Item
									name="password"
									label="Mật khẩu"
									rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
								>
									<Input.Password
										prefix={<LockOutlined />}
										placeholder="Nhập mật khẩu"
										iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
									/>
								</Form.Item>
							</Col>
						</Row>

						<div className={styles.formActions}>
							<Space>
								<Button onClick={handleCancel} disabled={saving || isSubmitting}>Hủy</Button>
								<Button
									type="primary"
									htmlType="submit"
									icon={<SaveOutlined />}
									loading={saving || isSubmitting}
								>
									Lưu thay đổi
								</Button>
							</Space>
						</div>
					</Form>
				</Card>
			</section>
		</div>
	)
}
