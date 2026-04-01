import { EnvironmentOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Form, Input, Row, Spin, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { getUserProfileApi, updateUserProfileApi } from '../../../../data/adminClinic/api/user'
import { getRoleLabel } from '../../../../constants/veterinaryLabels'
import { useAuth } from '../../../../hooks/adminClinic/AuthContext'
import styles from './profileAdminClinic.module.css'

const { Title, Text } = Typography

export default function AdminClinicProfile() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const { refreshUserProfile } = useAuth()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfileApi()
        const data = res.data
        setProfileData(data)
        form.setFieldsValue({
          phone: data?.phone || '',
          address: data?.address || '',
        })
      } catch (error) {
        message.error(error?.response?.data?.message || error?.message || 'Không thể tải thông tin tài khoản')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [form])

  const handleCancel = () => {
    form.setFieldsValue({
      phone: profileData?.phone || '',
      address: profileData?.address || '',
    })
    message.info('Đã hủy thay đổi')
  }

  const handleSave = async (values) => {
    if (!profileData?.id) {
      message.error('Không tìm thấy tài khoản để cập nhật')
      return
    }

    try {
      setSaving(true)
      await updateUserProfileApi(profileData.id, {
        fullName: profileData?.fullName || '',
        email: profileData?.email || '',
        avatarUrl: profileData?.avatarUrl || '',
        phone: values.phone.trim(),
        address: values.address.trim(),
      })

      const latestRes = await getUserProfileApi()
      const latestData = latestRes.data
      setProfileData(latestData)
      form.setFieldsValue({
        phone: latestData?.phone || '',
        address: latestData?.address || '',
      })
      await refreshUserProfile()

      message.success('Lưu thông tin thành công')
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Không thể lưu thông tin')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.adminProfilePage}>
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
                  {profileData?.fullName || 'Phòng khám'}
                </Title>
                <Text type="secondary">Trang cá nhân phòng khám</Text>
              </Col>
            </Row>

            <div className={styles.adminProfileInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Vai trò</span>
                <span className={styles.value}>{getRoleLabel(profileData?.role || 'ADMIN_CLINIC', 'vi')}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>
                  <MailOutlined /> {profileData?.email || 'Chưa cập nhật'}
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
                    label={<span className={styles.inlineLabel}>Số điện thoại</span>}
                    name="phone"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại' },
                      {
                        pattern: /^(\+84|0)\d{9}$/,
                        message: 'Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)',
                      },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Nhập số điện thoại"
                      maxLength={12}
                    />
                  </Form.Item>
                </div>

                <div className={styles.formRow}>
                  <Form.Item
                    label={<span className={styles.inlineLabel}>Địa chỉ</span>}
                    name="address"
                    rules={[
                      { required: true, message: 'Vui lòng nhập địa chỉ' },
                      { min: 5, message: 'Địa chỉ cần ít nhất 5 ký tự' },
                      { max: 200, message: 'Địa chỉ tối đa 200 ký tự' },
                    ]}
                  >
                    <Input prefix={<EnvironmentOutlined />} placeholder="Nhập địa chỉ" maxLength={200} />
                  </Form.Item>
                </div>

                <div className={styles.actions}>
                  <Button onClick={handleCancel} disabled={saving}>
                    Hủy
                  </Button>
                  <Button type="primary" htmlType="submit" loading={saving}>
                    Lưu
                  </Button>
                </div>
              </Form>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
