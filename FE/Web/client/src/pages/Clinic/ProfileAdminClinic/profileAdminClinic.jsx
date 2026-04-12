import { EnvironmentOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Form, Input, Row, Spin, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserProfileApi, updateUserProfileApi } from '../../../services/userService'
import { getAdminInstance } from '../../../services/apiClient'
import { getRoleLabel } from '../../../constants/veterinaryLabels'
import { useAuth } from '../../../hooks/Clinic/AuthContext'
import styles from './profileAdminClinic.module.css'

const { Title, Text } = Typography

export default function AdminClinicProfile() {
  const { t } = useTranslation('clinic')
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const { refreshUserProfile } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfileApi(getAdminInstance())
        const data = res.data
        setProfileData(data)
        form.setFieldsValue({
          phone: data?.phone || '',
          address: data?.address || '',
        })
      } catch (error) {
        message.error(error?.response?.data?.message || error?.message || t('profile.messages.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [form, t])

  const handleCancel = () => {
    form.setFieldsValue({
      phone: profileData?.phone || '',
      address: profileData?.address || '',
    })
    message.info(t('profile.messages.cancelled'))
  }

  const handleSave = async (values) => {
    if (!profileData?.id) {
      message.error(t('profile.messages.accountNotFound'))
      return
    }

    try {
      setSaving(true)
      await updateUserProfileApi(getAdminInstance(), profileData.id, {
        fullName: profileData?.fullName || '',
        email: profileData?.email || '',
        avatarUrl: profileData?.avatarUrl || '',
        phone: values.phone.trim(),
        address: values.address.trim(),
      })

      const latestRes = await getUserProfileApi(getAdminInstance())
      const latestData = latestRes.data
      setProfileData(latestData)
      form.setFieldsValue({
        phone: latestData?.phone || '',
        address: latestData?.address || '',
      })
      await refreshUserProfile()

      message.success(t('profile.messages.saveSuccess'))
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || t('profile.messages.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.adminProfilePage}>
      <header className={styles.topBar}>
        <h1>{t('accountMenu.actions.profile')}</h1>
        <div className={styles.topBarActionSpacer} aria-hidden="true" />
      </header>

      <div className={styles.pageBody}>
        <Card className={styles.adminProfileCard}>
          {loading ? (
            <div className={styles.adminProfileLoading}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Row gutter={[24, 24]} align="middle">
                <Col xs={24} md={8} className={styles.adminProfileAvatarCol}>
                  <Avatar size={120} icon={<UserOutlined />} src={profileData?.avatarUrl || undefined} />
                </Col>
                <Col xs={24} md={16}>
                  <Title level={3} className={styles.adminProfileTitle}>
                    {profileData?.fullName || t('profile.defaults.clinicName')}
                  </Title>
                  <Text type="secondary">{t('profile.page.subtitle')}</Text>
                </Col>
              </Row>

              <div className={styles.adminProfileInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>{t('profile.labels.role')}</span>
                  <span className={styles.value}>{getRoleLabel(profileData?.role || 'ADMIN_CLINIC')}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.label}>{t('profile.labels.email')}</span>
                  <span className={styles.value}>
                    <MailOutlined /> {profileData?.email || t('veterinarians.common.notUpdated')}
                  </span>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  className={styles.editForm}
                  autoComplete="off"
                >
                  <div className={styles.formRow}>
                    <Form.Item
                      label={<span className={styles.inlineLabel}>{t('profile.labels.phone')}</span>}
                      name="phone"
                      rules={[
                        { required: true, message: t('profile.validation.phoneRequired') },
                        {
                          pattern: /^(\+84|0)\d{9}$/,
                          message: t('profile.validation.phoneInvalid'),
                        },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder={t('profile.placeholders.phone')}
                        maxLength={12}
                      />
                    </Form.Item>
                  </div>

                  <div className={styles.formRow}>
                    <Form.Item
                      label={<span className={styles.inlineLabel}>{t('profile.labels.address')}</span>}
                      name="address"
                      rules={[
                        { required: true, message: t('profile.validation.addressRequired') },
                        { min: 5, message: t('profile.validation.addressMin') },
                        { max: 200, message: t('profile.validation.addressMax') },
                      ]}
                    >
                      <Input prefix={<EnvironmentOutlined />} placeholder={t('profile.placeholders.address')} maxLength={200} />
                    </Form.Item>
                  </div>

                  <div className={styles.actions}>
                    <Button onClick={handleCancel} disabled={saving}>
                      {t('profile.actions.cancel')}
                    </Button>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      {t('profile.actions.save')}
                    </Button>
                  </div>
                </Form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
