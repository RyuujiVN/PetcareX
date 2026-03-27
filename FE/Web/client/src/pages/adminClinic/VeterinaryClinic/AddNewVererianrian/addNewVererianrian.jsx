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
	EyeInvisibleOutlined,
	EyeTwoTone,
	LockOutlined,
	MailOutlined,
	SaveOutlined,
	UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useVeterinarians from '../../../../data/adminClinic/api/useVeterinarians'
import { uploadUserImageApi } from '../../../../data/adminClinic/api/user'
import { getSpecialtyOptions } from '../../../../constants/veterinaryLabels'
import styles from './addNewVererianrian.module.css'

const specialtyOptions = getSpecialtyOptions('vi')

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
			navigate('/admin/clinic/veterinarians')
			return
		}

		Modal.confirm({
			title: 'Bạn muốn thoát thay đổi?',
			content: 'Bạn đang nhập thông tin. Chọn "Lưu thông tin" để lưu, hoặc "Thoát không lưu".',
			okText: 'Lưu thông tin',
			cancelText: 'Thoát không lưu',
			onOk: saveProfileWithValidation,
			onCancel: () => {
				navigate('/admin/clinic/veterinarians')
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
									Thêm bác sĩ
								</Button>
							</Space>
						</div>
					</Form>
				</Card>
			</section>
		</div>
	)
}
