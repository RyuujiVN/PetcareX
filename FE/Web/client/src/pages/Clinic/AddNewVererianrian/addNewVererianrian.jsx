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
import {
    Avatar,
    Button,
    Card,
    Col,
    Form,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Upload,
} from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getSpecialtyOptions } from '../../../constants/veterinaryLabels'
import useVeterinarians from '../../../hooks/Clinic/useVeterinarians'
import { getAdminInstance } from '../../../services/apiClient'
import { updateUserProfileApi, uploadUserImageApi } from '../../../services/userService'
import styles from './addNewVererianrian.module.css'

const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

const defaultFormValues = {
	fullName: '',
	email: '',
	password: '',
	specialty: 'GENERAL_EXAMINATION',
	phone: '',
	address: '',
	experience: '',
	description: '',
}

export default function AddNewVererianrian() {
	const { t, i18n } = useTranslation('clinic')
	const navigate = useNavigate()
	const [form] = Form.useForm()
	const [messageApi, contextHolder] = message.useMessage()
	const { saving, addVeterinarian, editVeterinarian, removeVeterinarian } = useVeterinarians()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [avatarFile, setAvatarFile] = useState(null)
	const [avatarPreview, setAvatarPreview] = useState('')
	const [avatarUploading, setAvatarUploading] = useState(false)
	const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState('')
	const specialtyOptions = useMemo(() => getSpecialtyOptions(), [i18n.language])

	const navigateToListWithFlash = (text) => {
		sessionStorage.setItem('veterinarianFlashMessage', text)
		navigate('/clinic/veterinarians')
	}

	const handleSubmit = async (values) => {
		if (avatarUploading) {
			messageApi.warning(t('veterinarians.add.messages.avatarUploading'))
			return
		}

		setIsSubmitting(true)
		try {
			const fullName = String(values.fullName || '').trim()
			const email = String(values.email || '').trim().toLowerCase()
			const password = String(values.password || '')
			const phone = String(values.phone || '').trim()
			const address = String(values.address || '').trim()
			const experience = String(values.experience || '').trim()
			const description = String(values.description || '').trim()

			// Bước 1: Tạo tài khoản bác sĩ (POST /veterinarian chỉ nhận 5 field)
			const created = await addVeterinarian({
				fullName,
				email,
				password,
				specialty: values.specialty,
			})

			if (!created?.userId) {
				throw new Error(t('veterinarians.add.messages.missingUserId'))
			}

			// Bước 2: Cập nhật SĐT, địa chỉ, avatar qua PUT /user/{id}
			try {
				const updateData = { fullName, email, phone, address }
				if (uploadedAvatarUrl) {
					updateData.avatarUrl = uploadedAvatarUrl
				}
				await updateUserProfileApi(getAdminInstance(), created.userId, updateData)

				if (experience || description) {
					await editVeterinarian(created.userId, {
						experience: experience || undefined,
						description: description || undefined,
						introduce: description || undefined,
					})
				}
			} catch (updateError) {
				// Rollback: xóa bác sĩ vừa tạo để tránh dữ liệu rỗng
				try {
					await removeVeterinarian(created.userId)
				} catch {
					// Nếu rollback cũng thất bại
					throw new Error(t('veterinarians.add.messages.rollbackFailed'))
				}
				throw new Error(t('veterinarians.add.messages.contactUpdateFailed'))
			}

			navigateToListWithFlash(t('veterinarians.add.messages.addSuccess'))
		} catch (error) {
			messageApi.error(error.message || t('veterinarians.add.messages.saveFailed'))
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
			messageApi.error(error.message || t('veterinarians.add.messages.saveFailed'))
		}
	}

	const handleCancel = () => {
		if (!hasPendingChanges()) {
			navigate('/clinic/veterinarians')
			return
		}

		Modal.confirm({
			title: t('veterinarians.add.confirmDiscard.title'),
			content: t('veterinarians.add.confirmDiscard.content'),
			okText: t('veterinarians.add.confirmDiscard.okText'),
			cancelText: t('veterinarians.add.confirmDiscard.cancelText'),
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
				throw new Error(t('veterinarians.add.messages.avatarUrlMissing'))
			}

			setUploadedAvatarUrl(avatarUrl)
			messageApi.success(t('veterinarians.add.messages.avatarUploadSuccess'))
		} catch (error) {
			setAvatarFile(null)
			setAvatarPreview('')
			setUploadedAvatarUrl('')
			messageApi.error(error.message || t('veterinarians.add.messages.avatarUploadFailed'))
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
				<h1 style={{fontSize: 24, fontWeight: 'bold'}}>{t('veterinarians.add.pageTitle')}</h1>
				<div className={styles.topBarActionSpacer} aria-hidden="true" />
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

					<h2>{fullNamePreview || t('veterinarians.add.defaultName')}</h2>

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
									label={t('veterinarians.fields.name')}
									rules={[{ required: true, message: t('veterinarians.validation.nameRequired') }]}
								>
									<Input prefix={<UserOutlined />} placeholder={t('veterinarians.add.placeholders.name')} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="specialty"
									label={t('veterinarians.fields.specialty')}
									rules={[{ required: true, message: t('veterinarians.validation.specialtyRequired') }]}
								>
									<Select  size="large" options={specialtyOptions} placeholder={t('veterinarians.add.placeholders.specialty')}/>
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="email"
									label={t('veterinarians.fields.email')}
									rules={[
										{ required: true, message: t('veterinarians.validation.emailRequired') },
										{ type: 'email', message: t('veterinarians.validation.emailInvalid') },
									]}
								>
									<Input prefix={<MailOutlined />} placeholder={t('veterinarians.add.placeholders.email')} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="password"
									label={t('veterinarians.fields.password')}
									rules={[
										{ required: true, message: t('veterinarians.validation.passwordRequired') },
										{ min: 6, message: t('veterinarians.validation.passwordMin') },
										{
											pattern: passwordPolicyRegex,
											message: t('veterinarians.validation.passwordPolicy'),
										},
									]}
								>
									<Input.Password
										prefix={<LockOutlined />}
										placeholder={t('veterinarians.add.placeholders.password')}
										iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
									/>
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="phone"
									label={t('veterinarians.fields.phone')}
									rules={[
										{ required: true, message: t('veterinarians.validation.phoneRequired') },
										{
											pattern: /^0\d{9}$/,
											message: t('veterinarians.validation.phoneFormat'),
										},
									]}
								>
									<Input prefix={<PhoneOutlined />} placeholder={t('veterinarians.add.placeholders.phone')} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="address"
									label={t('veterinarians.fields.address')}
									rules={[{ required: true, message: t('veterinarians.validation.addressRequired') }]}
								>
									<Input prefix={<EnvironmentOutlined />} placeholder={t('veterinarians.add.placeholders.address')} />
								</Form.Item>
							</Col>

							<Col xs={24} md={12}>
								<Form.Item
									name="experience"
									label={t('veterinarians.fields.experience')}
								>
									<Input
										placeholder={t('veterinarians.fields.experiencePlaceholder')}
										maxLength={200}
									/>
								</Form.Item>
							</Col>

							<Col xs={24} md={24}>
								<Form.Item
									name="description"
									label={t('veterinarians.fields.description')}
								>
									<Input.TextArea
										rows={4}
										placeholder={t('veterinarians.fields.descriptionPlaceholder')}
										maxLength={1000}
										showCount
									/>
								</Form.Item>
							</Col>
						</Row>

						<div className={styles.formActions}>
							<Space>
								<Button onClick={handleCancel} disabled={saving || isSubmitting || avatarUploading}>{t('veterinarians.common.cancel')}</Button>
								<Button
									type="primary"
									htmlType="submit"
									icon={<SaveOutlined />}
									loading={saving || isSubmitting}
									disabled={avatarUploading}
								>
									{avatarUploading ? t('veterinarians.common.uploadingImage') : t('veterinarians.add.submitButton')}
								</Button>
							</Space>
						</div>
					</Form>
				</Card>
			</section>
		</div>
	)
}
