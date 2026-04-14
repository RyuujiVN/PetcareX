import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatVND } from '../../../../utils/currencyFormat'
import styles from '../revenue.module.css'

export default function RevenueSummaryCards({ summary }) {
  const { t } = useTranslation('clinic')

  const cards = [
    {
      key: 'totalRevenue',
      label: t('revenue.cards.totalRevenue'),
      value: formatVND(summary.totalRevenue),
      icon: <DollarOutlined />,
      iconClass: styles.iconRevenue,
    },
    {
      key: 'paidInvoices',
      label: t('revenue.cards.paidInvoices'),
      value: summary.totalPaidInvoices,
      icon: <CheckCircleOutlined />,
      iconClass: styles.iconPaid,
    },
    {
      key: 'unpaidInvoices',
      label: t('revenue.cards.unpaidInvoices'),
      value: summary.totalUnpaidInvoices,
      icon: <ClockCircleOutlined />,
      iconClass: styles.iconUnpaid,
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
