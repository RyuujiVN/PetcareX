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
	CameraOutlined,
	EnvironmentOutlined,
	EyeInvisibleOutlined,
	EyeTwoTone,
	LockOutlined,
	MailOutlined,
	PhoneOutlined,
	SaveOutlined,
	UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useVeterinarians from '../../../../data/Clinic/api/useVeterinarians'
import { uploadUserImageApi, updateUserProfileApi } from '../../../../data/Clinic/api/user'
import { getSpecialtyOptions } from '../../../../constants/veterinaryLabels'
import styles from './addNewVererianrian.module.css'

const specialtyOptions = getSpecialtyOptions('vi')
const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

const defaultFormValues = {
	fullName: '',
	email: '',
	password: '',
	specialty: 'GENERAL_EXAMINATION',
	phone: '',
	address: '',
}

export default function AddNewVererianrian() {
	const navigate = useNavigate()
	const [form] = Form.useForm()
	const [messageApi, contextHolder] = message.useMessage()
	const { saving, addVeterinarian, removeVeterinarian } = useVeterinarians()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [avatarFile, setAvatarFile] = useState(null)
	const [avatarPreview, setAvatarPreview] = useState('')
	const [avatarUploading, setAvatarUploading] = useState(false)
	const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState('')

	const navigateToListWithFlash = (text) => {
		sessionStorage.setItem('veterinarianFlashMessage', text)
		navigate('/clinic/veterinarians')
	}

	const handleSubmit = async (values) => {
		if (avatarUploading) {
			messageApi.warning('Ảnh đang được tải lên, vui lòng đợi')
			return
		}

		setIsSubmitting(true)
		try {
			const fullName = String(values.fullName || '').trim()
			const email = String(values.email || '').trim().toLowerCase()
			const password = String(values.password || '')
			const phone = String(values.phone || '').trim()
			const address = String(values.address || '').trim()

			// Bước 1: Tạo tài khoản bác sĩ (POST /veterinarian chỉ nhận 5 field)
			const created = await addVeterinarian({
				fullName,
				email,
				password,
				specialty: values.specialty,
			})

			if (!created?.userId) {
				throw new Error('Tạo bác sĩ thành công nhưng không nhận được userId')
			}

			// Bước 2: Cập nhật SĐT, địa chỉ, avatar qua PUT /user/{id}
			try {
				const updateData = { fullName, email, phone, address }
				if (uploadedAvatarUrl) {
					updateData.avatarUrl = uploadedAvatarUrl
				}
				await updateUserProfileApi(created.userId, updateData)
			} catch (updateError) {
				// Rollback: xóa bác sĩ vừa tạo để tránh dữ liệu rỗng
				try {
					await removeVeterinarian(created.userId)
				} catch {
					// Nếu rollback cũng thất bại
					throw new Error('Cập nhật thông tin thất bại và không thể tự hủy tài khoản. Vui lòng xóa thủ công bác sĩ vừa tạo.')
				}
				throw new Error('Không thể cập nhật SĐT/địa chỉ. Tài khoản đã được hủy, vui lòng thử lại.')
			}

			navigateToListWithFlash('Thêm bác sĩ mới thành công')
		} catch (error) {
			messageApi.error(error.message || 'Không thể lưu thông tin bác sĩ')
		} finally {
			setIsSubmitting(false)
		}
	}

	const hasPendingChanges = () => {
		const currentValues = form.getFieldsValue()
		const hasFormValueChanged = Object.entries(defaultFormValues).some(([key, initialValue]) => {
			const currentValue = currentValues[key]
			return currentValue !== initialValue
		})

		return hasFormValueChanged || form.isFieldsTouched(true) || Boolean(avatarFile)
	}

	const saveProfileWithValidation = async () => {
		try {
			const values = await form.validateFields()
			await handleSubmit(values)
		} catch (error) {
			if (error?.errorFields) return
			messageApi.error(error.message || 'Không thể lưu thông tin bác sĩ')
		}
	}

	const handleCancel = () => {
		if (!hasPendingChanges()) {
			navigate('/clinic/veterinarians')
			return
		}

		Modal.confirm({
			title: 'Bạn muốn thoát thay đổi?',
			content: 'Bạn đang nhập thông tin. Chọn "Lưu thông tin" để lưu, hoặc "Thoát không lưu".',
			okText: 'Lưu thông tin',
			cancelText: 'Thoát không lưu',
			onOk: saveProfileWithValidation,
			onCancel: () => {
				navigate('/clinic/veterinarians')
			},
		})
	}

	const fullNamePreview = Form.useWatch('fullName', form)

	const handleAvatarUpload = async (file) => {
		setAvatarFile(file)
		setAvatarPreview(URL.createObjectURL(file))
		setAvatarUploading(true)

		try {
			const uploaded = await uploadUserImageApi(file)
			const avatarUrl = uploaded?.url || uploaded?.file || uploaded?.secure_url || uploaded?.data?.url || ''

			if (!avatarUrl) {
				throw new Error('Không nhận được URL ảnh từ server')
			}

			setUploadedAvatarUrl(avatarUrl)
			messageApi.success('Tải ảnh đại diện thành công')
		} catch (error) {
			setAvatarFile(null)
			setAvatarPreview('')
			setUploadedAvatarUrl('')
			messageApi.error(error.message || 'Không thể tải ảnh đại diện')
		} finally {
			setAvatarUploading(false)
		}
	}

	const uploadProps = {
		accept: 'image/*',
		showUploadList: false,
		beforeUpload: (file) => {
			handleAvatarUpload(file)
			return false
		},
	}

	return (
		<div className={styles.page}>
			{contextHolder}
			<header className={styles.topBar}>
				<h1 style={{fontSize: 24, fontWeight: 'bold'}}>Thêm mới bác sĩ</h1>
			</header>

			<section className={styles.content}>
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
								disabled={avatarUploading || saving || isSubmitting}
								loading={avatarUploading}
							/>
						</Upload>
					</div>

					<h2>{fullNamePreview || 'Tên'}</h2>

					<Form
						layout="vertical"
						form={form}
						initialValues={defaultFormValues}
						onFinish={saveProfileWithValidation}
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
									<Select  size="large" options={specialtyOptions} placeholder="Chọn chuyên khoa"/>
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
									rules={[
										{ required: true, message: 'Vui lòng nhập mật khẩu' },
										{ min: 6, message: 'Mật khẩu tối thiểu là 6 ký tự' },
										{
											pattern: passwordPolicyRegex,
											message: 'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số',
										},
									]}
								>
									<Input.Password
										prefix={<LockOutlined />}
										placeholder="Nhập mật khẩu"
										iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
									/>
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="phone"
									label="Số điện thoại"
									rules={[
										{ required: true, message: 'Vui lòng nhập số điện thoại' },
										{
											pattern: /^0\d{9}$/,
											message: 'Số điện thoại phải đúng 10 số (VD: 0901234567)',
										},
									]}
								>
									<Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="address"
									label="Địa chỉ"
									rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
								>
									<Input prefix={<EnvironmentOutlined />} placeholder="Nhập địa chỉ" />
								</Form.Item>
							</Col>
						</Row>

						<div className={styles.formActions}>
							<Space>
								<Button onClick={handleCancel} disabled={saving || isSubmitting || avatarUploading}>Hủy</Button>
								<Button
									type="primary"
									htmlType="submit"
									icon={<SaveOutlined />}
									loading={saving || isSubmitting}
									disabled={avatarUploading}
								>
									{avatarUploading ? 'Đang tải ảnh...' : 'Thêm bác sĩ'}
								</Button>
							</Space>
						</div>
					</Form>
				</Card>
			</section>
		</div>
	)
}
