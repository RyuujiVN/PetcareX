import { EnvironmentOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Col, Descriptions, Row, Spin, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { getUserProfileApi } from '../../../../data/adminClinic/api/user'
import { getRoleLabel } from '../../../../constants/veterinaryLabels'
import styles from './profileAdminClinic.module.css'

const { Title, Text } = Typography

export default function AdminClinicProfile() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfileApi()
        setProfileData(res.data)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

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

            <Descriptions className={styles.adminProfileInfo} column={1} bordered size="middle">
              <Descriptions.Item label="Vai trò">{getRoleLabel(profileData?.role || 'ADMIN_CLINIC', 'vi')}</Descriptions.Item>
              <Descriptions.Item label="Email">
                <MailOutlined /> {profileData?.email || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <PhoneOutlined /> {profileData?.phone || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                <EnvironmentOutlined /> {profileData?.address || 'Chưa cập nhật'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    </div>
  )
}
