import { useTranslation } from 'react-i18next'
import { INVOICE_STATUS } from '../../../../services/invoiceService'
import { formatDateDDMMYYYY } from '../../../../utils/dateTimeFormat'
import styles from '../revenue.module.css'

const formatCurrency = (value) => {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`
}

export default function RecentInvoicesTable({
  invoices,
  invoiceFilter,
  onFilterChange,
}) {
  const { t } = useTranslation('clinic')

  const filters = [
    { key: 'all', label: t('revenue.invoices.filterAll') },
    { key: INVOICE_STATUS.PAID, label: t('revenue.invoices.filterPaid') },
    { key: INVOICE_STATUS.UNPAID, label: t('revenue.invoices.filterUnpaid') },
  ]

  return (
    <div className={styles.invoicesCard}>
      <div className={styles.invoicesHeader}>
        <h3 className={styles.invoicesTitle}>
          {t('revenue.invoices.title')}
        </h3>
        <div className={styles.invoiceFilterTabs}>
          {filters.map((f) => (
            <button
              key={f.key}
              className={`${styles.invoiceFilterTab} ${
                invoiceFilter === f.key ? styles.invoiceFilterTabActive : ''
              }`}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {invoices.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>{t('revenue.invoices.colRecord')}</th>
                <th>{t('revenue.invoices.colPet')}</th>
                <th>{t('revenue.invoices.colVet')}</th>
                <th>{t('revenue.invoices.colDate')}</th>
                <th>{t('revenue.invoices.colAmount')}</th>
                <th>{t('revenue.invoices.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((record) => (
                <tr key={record.id}>
                  <td>{record.name || record.id?.slice(0, 8)}</td>
                  <td>{record.pet?.name || '—'}</td>
                  <td>
                    {record.veterinarian?.fullName || '—'}
                  </td>
                  <td>
                    {formatDateDDMMYYYY(
                      record.invoice?.createdAt || record.createdAt,
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatCurrency(record.invoice?.totalAmount)}
                  </td>
                  <td>
                    <span
                      className={
                        record.invoice?.status === INVOICE_STATUS.PAID
                          ? styles.badgePaid
                          : styles.badgeUnpaid
                      }
                    >
                      {record.invoice?.status === INVOICE_STATUS.PAID
                        ? t('revenue.invoices.statusPaid')
                        : t('revenue.invoices.statusUnpaid')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyWrapper}>
          <span className={styles.emptyText}>
            {t('revenue.empty.noInvoices')}
          </span>
        </div>
      )}
    </div>
  )
}
