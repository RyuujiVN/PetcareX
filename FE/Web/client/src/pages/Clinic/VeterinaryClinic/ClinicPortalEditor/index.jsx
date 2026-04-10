import { Tabs, Typography } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import ClinicInfoEditorTab from './ClinicInfoEditorTab'
import HomePageEditorTab from './HomePageEditorTab'
import './styles.css'

const { Title, Text } = Typography

export default function ClinicPortalEditor() {
  const { t } = useTranslation('clinic')
  const navigate = useNavigate()
  const { clinicId = '' } = useParams()

  useEffect(() => {
    if (!clinicId) {
      navigate('/clinic/appointments', { replace: true })
    }
  }, [clinicId, navigate])

  return (
    <div className="clinic-portal-editor-page">
      <header className="clinic-portal-editor-header">
        <Title level={3}>{t('sidebar.menu.portalEditor', { defaultValue: 'Chỉnh sửa trang phòng khám' })}</Title>
        <Text type="secondary">
          {t('portalEditor.subtitle', {
            defaultValue: 'Quản lý nội dung trang chủ và thông tin hiển thị phòng khám tại cùng một nơi.',
          })}
        </Text>
      </header>

      <Tabs
        defaultActiveKey="homepage"
        className="clinic-portal-editor-tabs"
        items={[
          {
            key: 'homepage',
            label: t('sidebar.menu.homeEditor'),
            children: <HomePageEditorTab />,
          },
          {
            key: 'clinicinfo',
            label: t('sidebar.menu.clinicEditor'),
            children: <ClinicInfoEditorTab />,
          },
        ]}
      />
    </div>
  )
}
