import {
  CameraOutlined,
  DownOutlined,
  EnvironmentOutlined,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Spin,
  Upload,
  message,
} from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminInstance } from '../../../services/apiClient'
import { changePasswordApi } from '../../../services/authService'
import { updateUserProfileApi, uploadUserImageApi } from '../../../services/userService'
import styles from './PortalAccountMenu.module.css'

const MIN_PASSWORD_LENGTH = 8

const buildProfileFormData = (profile) => ({
  fullName: String(profile?.fullName || '').trim(),
  email: String(profile?.email || '').trim(),
  phone: String(profile?.phone || '').trim(),
  address: String(profile?.address || '').trim(),
  avatarUrl: String(profile?.avatarUrl || '').trim(),
})

export default function PortalAccountMenu({
  namespace,
  userProfile,
  login,
  logout,
  refreshUserProfile,
  onAfterLogout,
  defaultName,
  defaultMeta,
  metaText,
}) {
  const { t } = useTranslation(namespace)
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')

  const displayName = String(userProfile?.fullName || defaultName || '').trim()
  const displayMeta = String(metaText || userProfile?.email || defaultMeta || '').trim()

  const handleLogout = () => {
    logout()
    onAfterLogout?.()
  }

  const syncProfileForm = (profile) => {
    const nextData = buildProfileFormData(profile)
    setAvatarPreviewUrl(nextData.avatarUrl)
    profileForm.setFieldsValue(nextData)
  }

  const openProfileModal = async () => {
    setIsProfileOpen(true)
    setLoadingProfile(true)

    try {
      const latestProfile = await refreshUserProfile?.()
      syncProfileForm(latestProfile || userProfile)
    } catch {
      syncProfileForm(userProfile)
      message.error(
        t('accountMenu.messages.profileLoadFailed', {
          defaultValue: 'Unable to load profile data',
        }),
      )
    } finally {
      setLoadingProfile(false)
    }
  }

  const closeProfileModal = () => {
    setIsProfileOpen(false)
    setAvatarUploading(false)
    profileForm.resetFields()
    setAvatarPreviewUrl('')
  }

  const openPasswordModal = () => {
    passwordForm.resetFields()
    setIsPasswordOpen(true)
  }

  const closePasswordModal = () => {
    setIsPasswordOpen(false)
    passwordForm.resetFields()
  }

  const handleUploadAvatar = async (file) => {
    setAvatarUploading(true)
    message.loading({
      key: 'account-avatar-upload',
      content: t('accountMenu.messages.avatarUploading', {
        defaultValue: 'Uploading avatar...',
      }),
    })

    try {
      const uploaded = await uploadUserImageApi(file)
      const avatarUrl = uploaded?.url || uploaded?.file || uploaded?.secure_url || uploaded?.data?.url || ''

      if (!avatarUrl) {
        throw new Error(
          t('accountMenu.messages.avatarMissingUrl', {
            defaultValue: 'Missing avatar URL from upload response',
          }),
        )
      }

      setAvatarPreviewUrl(avatarUrl)
      profileForm.setFieldValue('avatarUrl', avatarUrl)
      message.success({
        key: 'account-avatar-upload',
        content: t('accountMenu.messages.avatarUploadSuccess', {
          defaultValue: 'Avatar uploaded successfully',
        }),
      })
    } catch (error) {
      message.error({
        key: 'account-avatar-upload',
        content:
          error?.message ||
          t('accountMenu.messages.avatarUploadFailed', {
            defaultValue: 'Unable to upload avatar',
          }),
      })
    } finally {
      setAvatarUploading(false)
    }

    return false
  }

  const handleSaveProfile = async () => {
    if (avatarUploading) {
      message.warning(
        t('accountMenu.messages.avatarUploading', {
          defaultValue: 'Uploading avatar...',
        }),
      )
      return
    }

    const profileId = userProfile?.id || userProfile?.user?.id
    if (!profileId) {
      message.error(
        t('accountMenu.messages.profileSaveFailed', {
          defaultValue: 'Unable to save profile',
        }),
      )
      return
    }

    try {
      const values = await profileForm.validateFields()
      setSavingProfile(true)

      await updateUserProfileApi(getAdminInstance(), profileId, {
        fullName: String(values.fullName || '').trim(),
        email: String(values.email || '').trim().toLowerCase(),
        phone: String(values.phone || '').trim(),
        address: String(values.address || '').trim(),
        avatarUrl: String(values.avatarUrl || '').trim(),
      })

      await refreshUserProfile?.()

      message.success(
        t('accountMenu.messages.profileSaved', {
          defaultValue: 'Profile updated successfully',
        }),
      )
      closeProfileModal()
    } catch (error) {
      if (error?.errorFields) return

      message.error(
        error?.message ||
          error?.response?.data?.message ||
          t('accountMenu.messages.profileSaveFailed', {
            defaultValue: 'Unable to save profile',
          }),
      )
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      setChangingPassword(true)

      const response = await changePasswordApi(getAdminInstance(), {
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })

      const nextToken = response?.data?.accessToken
      if (nextToken) {
        login(nextToken)
      }

      message.success(
        t('accountMenu.messages.passwordChanged', {
          defaultValue: 'Password changed successfully',
        }),
      )
      closePasswordModal()
    } catch (error) {
      if (error?.errorFields) return

      message.error(
        error?.response?.data?.message ||
          error?.message ||
          t('accountMenu.messages.passwordChangeFailed', {
            defaultValue: 'Unable to change password',
          }),
      )
    } finally {
      setChangingPassword(false)
    }
  }

  const menuItems = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: t('accountMenu.actions.profile', { defaultValue: 'Profile' }),
      },
      {
        key: 'changePassword',
        icon: <LockOutlined />,
        label: t('accountMenu.actions.changePassword', {
          defaultValue: 'Change password',
        }),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        danger: true,
        label: t('accountMenu.actions.logout', { defaultValue: 'Log out' }),
      },
    ],
    [t],
  )

  const handleMenuClick = ({ key }) => {
    if (key === 'profile') {
      void openProfileModal()
      return
    }

    if (key === 'changePassword') {
      openPasswordModal()
      return
    }

    handleLogout()
  }

  return (
    <>
      <Dropdown
        trigger={['click']}
        placement="topRight"
        menu={{ items: menuItems, onClick: handleMenuClick }}
      >
        <button type="button" className={styles.triggerButton}>
          <div className={styles.triggerProfileInfo}>
            <Avatar
              size={40}
              src={userProfile?.avatarUrl || undefined}
              icon={<UserOutlined />}
            />
            <div className={styles.identityText}>
              <h4>{displayName || t('accountMenu.defaults.name', { defaultValue: 'User' })}</h4>
              <p>{displayMeta || t('accountMenu.defaults.meta', { defaultValue: 'Account' })}</p>
            </div>
          </div>
          <DownOutlined className={styles.triggerArrow} />
        </button>
      </Dropdown>

      <Modal
        open={isProfileOpen}
        title={t('accountMenu.profileModal.title', {
          defaultValue: 'Profile information',
        })}
        onCancel={closeProfileModal}
        onOk={handleSaveProfile}
        okText={t('accountMenu.profileModal.buttons.save', {
          defaultValue: 'Save changes',
        })}
        cancelText={t('accountMenu.profileModal.buttons.cancel', {
          defaultValue: 'Cancel',
        })}
        confirmLoading={savingProfile}
        destroyOnClose
        width={760}
      >
        {loadingProfile ? (
          <div className={styles.modalLoadingWrap}>
            <Spin />
          </div>
        ) : (
          <div>
            <div className={styles.avatarRow}>
              <Avatar
                size={108}
                src={avatarPreviewUrl || undefined}
                icon={<UserOutlined />}
              />
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUploadAvatar}
              >
                <Button
                  type="default"
                  icon={<CameraOutlined />}
                  loading={avatarUploading}
                >
                  {t('accountMenu.profileModal.upload.changeAvatar', {
                    defaultValue: 'Change avatar',
                  })}
                </Button>
              </Upload>
            </div>

            <Form
              form={profileForm}
              layout="vertical"
              initialValues={buildProfileFormData(userProfile)}
              className={styles.profileForm}
            >
              <Form.Item name="avatarUrl" hidden>
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('accountMenu.profileModal.fields.fullName', {
                      defaultValue: 'Full name',
                    })}
                    name="fullName"
                    rules={[
                      {
                        required: true,
                        message: t('accountMenu.profileModal.validation.fullNameRequired', {
                          defaultValue: 'Please enter full name',
                        }),
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder={t('accountMenu.profileModal.placeholders.fullName', {
                        defaultValue: 'Enter full name',
                      })}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('accountMenu.profileModal.fields.email', {
                      defaultValue: 'Email',
                    })}
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: t('accountMenu.profileModal.validation.emailRequired', {
                          defaultValue: 'Please enter email',
                        }),
                      },
                      {
                        type: 'email',
                        message: t('accountMenu.profileModal.validation.emailInvalid', {
                          defaultValue: 'Invalid email format',
                        }),
                      },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder={t('accountMenu.profileModal.placeholders.email', {
                        defaultValue: 'Enter email',
                      })}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('accountMenu.profileModal.fields.phone', {
                      defaultValue: 'Phone number',
                    })}
                    name="phone"
                    rules={[
                      {
                        required: true,
                        message: t('accountMenu.profileModal.validation.phoneRequired', {
                          defaultValue: 'Please enter phone number',
                        }),
                      },
                      {
                        pattern: /^0\d{9}$/,
                        message: t('accountMenu.profileModal.validation.phoneInvalid', {
                          defaultValue: 'Phone number must contain exactly 10 digits and start with 0',
                        }),
                      },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder={t('accountMenu.profileModal.placeholders.phone', {
                        defaultValue: 'Enter phone number',
                      })}
                      maxLength={10}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('accountMenu.profileModal.fields.address', {
                      defaultValue: 'Address',
                    })}
                    name="address"
                    rules={[
                      {
                        required: true,
                        message: t('accountMenu.profileModal.validation.addressRequired', {
                          defaultValue: 'Please enter address',
                        }),
                      },
                    ]}
                  >
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder={t('accountMenu.profileModal.placeholders.address', {
                        defaultValue: 'Enter address',
                      })}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        open={isPasswordOpen}
        title={t('accountMenu.passwordModal.title', {
          defaultValue: 'Change password',
        })}
        onCancel={closePasswordModal}
        onOk={handleChangePassword}
        okText={
          changingPassword
            ? t('accountMenu.passwordModal.buttons.saving', {
                defaultValue: 'Updating...',
              })
            : t('accountMenu.passwordModal.buttons.save', {
                defaultValue: 'Update password',
              })
        }
        cancelText={t('accountMenu.passwordModal.buttons.cancel', {
          defaultValue: 'Cancel',
        })}
        confirmLoading={changingPassword}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" autoComplete="off">
          <Form.Item
            label={t('accountMenu.passwordModal.fields.currentPassword', {
              defaultValue: 'Current password',
            })}
            name="currentPassword"
            rules={[
              {
                required: true,
                message: t('accountMenu.passwordModal.validation.currentRequired', {
                  defaultValue: 'Please enter current password',
                }),
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label={t('accountMenu.passwordModal.fields.newPassword', {
              defaultValue: 'New password',
            })}
            name="newPassword"
            rules={[
              {
                required: true,
                message: t('accountMenu.passwordModal.validation.newRequired', {
                  defaultValue: 'Please enter new password',
                }),
              },
              {
                min: MIN_PASSWORD_LENGTH,
                message: t('accountMenu.passwordModal.validation.newMinLength', {
                  count: MIN_PASSWORD_LENGTH,
                  defaultValue: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
                }),
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label={t('accountMenu.passwordModal.fields.confirmPassword', {
              defaultValue: 'Confirm new password',
            })}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              {
                required: true,
                message: t('accountMenu.passwordModal.validation.confirmRequired', {
                  defaultValue: 'Please confirm new password',
                }),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(
                    new Error(
                      t('accountMenu.passwordModal.validation.confirmMismatch', {
                        defaultValue: 'Confirm password does not match',
                      }),
                    ),
                  )
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
