import { CheckCircleOutlined, MedicineBoxOutlined, RiseOutlined, StopOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styles from '../activity.module.css'

export default function ActivityKPICards({ summary }) {
  const { t } = useTranslation('admin')
  const cards = [
    {
      key: 'clinics',
      label: t('activity.kpi.totalClinics'),
      value: summary?.totalClinics ?? 0,
      iconClass: styles.kpiClinics,
      Icon: MedicineBoxOutlined,
    },
    {
      key: 'visits',
      label: t('activity.kpi.totalVisits'),
      value: summary?.totalVisits ?? 0,
      iconClass: styles.kpiVisits,
      Icon: RiseOutlined,
    },
    {
      key: 'active',
      label: t('activity.kpi.activeClinics'),
      value: summary?.activeClinics ?? 0,
      iconClass: styles.kpiActive,
      Icon: CheckCircleOutlined,
    },
    {
      key: 'inactive',
      label: t('activity.kpi.inactiveClinics'),
      value: summary?.inactiveClinics ?? 0,
      iconClass: styles.kpiInactive,
      Icon: StopOutlined,
    },
  ]

  return (
    <div className={styles.kpiGrid}>
      {cards.map((card) => {
        const IconComponent = card.Icon
        return (
          <div key={card.key} className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${card.iconClass}`}>
              <IconComponent />
            </div>
            <div className={styles.kpiBody}>
              <p className={styles.kpiLabel}>{card.label}</p>
              <p className={styles.kpiValue}>{card.value.toLocaleString('vi-VN')}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
