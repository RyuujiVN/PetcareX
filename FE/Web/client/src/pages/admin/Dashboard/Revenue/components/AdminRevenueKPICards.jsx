import {
  CheckCircleOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  ScheduleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatVND } from '../../../../../utils/currencyFormat'
import styles from '../adminRevenue.module.css'

export default function AdminRevenueKPICards({ summary }) {
  const { t } = useTranslation('admin')

  const cards = [
    {
      key: 'totalRevenue',
      label: t('revenue.kpi.totalRevenue'),
      value: formatVND(summary.totalRevenue),
      icon: <DollarOutlined />,
      iconClass: styles.iconRevenue,
    },
    {
      key: 'totalClinics',
      label: t('revenue.kpi.totalClinics'),
      value: summary.totalClinics,
      icon: <MedicineBoxOutlined />,
      iconClass: styles.iconClinic,
    },
    {
      key: 'totalVisits',
      label: t('revenue.kpi.totalVisits'),
      value: summary.totalVisits,
      icon: <ScheduleOutlined />,
      iconClass: styles.iconVisits,
    },
    {
      key: 'paidInvoices',
      label: t('revenue.kpi.paidInvoices'),
      value: `${summary.totalPaidInvoices} / ${summary.totalPaidInvoices + summary.totalUnpaidInvoices}`,
      icon: <CheckCircleOutlined />,
      iconClass: styles.iconInvoice,
    },
  ]

  return (
    <div className={styles.summaryGrid}>
      {cards.map((card) => (
        <div key={card.key} className={styles.summaryCard}>
          <div className={styles.summaryCardHeader}>
            <div className={`${styles.summaryCardIcon} ${card.iconClass}`}>
              {card.icon}
            </div>
            <span className={styles.summaryCardLabel}>{card.label}</span>
          </div>
          <p className={styles.summaryCardValue}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
