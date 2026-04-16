import { SearchOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import { useTranslation } from 'react-i18next'
import { formatVND } from '../../../../../utils/currencyFormat'
import styles from '../adminRevenue.module.css'

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRankClass = (index) => {
  if (index === 0) return styles.rankTop1
  if (index === 1) return styles.rankTop2
  if (index === 2) return styles.rankTop3
  return styles.rankDefault
}

export default function ClinicRevenueRankingTable({
  clinicRanking,
  clinicSearch,
  onSearchChange,
}) {
  const { t } = useTranslation('admin')

  return (
    <div className={styles.rankingCard}>
      <div className={styles.rankingHeader}>
        <h3 className={styles.rankingTitle}>
          {t('revenue.ranking.title')}
        </h3>
        <Input
          className={styles.rankingSearch}
          placeholder={t('revenue.ranking.searchPlaceholder')}
          allowClear
          value={clinicSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          prefix={
            <SearchOutlined
              style={{ color: 'var(--admin-color-text-disabled)' }}
            />
          }
        />
      </div>

      {clinicRanking.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.rankingTable}>
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>{t('revenue.ranking.colClinic')}</th>
                <th>{t('revenue.ranking.colRevenue')}</th>
                <th>{t('revenue.ranking.colVisits')}</th>
                <th>{t('revenue.ranking.colPaid')}</th>
                <th>{t('revenue.ranking.colUnpaid')}</th>
              </tr>
            </thead>
            <tbody>
              {clinicRanking.map((clinic, index) => (
                <tr key={clinic.id}>
                  <td>
                    <span
                      className={`${styles.rankIndex} ${getRankClass(index)}`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <div className={styles.clinicInfo}>
                      <div className={styles.clinicAvatar}>
                        {clinic.avatarUrl ? (
                          <img
                            src={clinic.avatarUrl}
                            alt={clinic.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          getInitials(clinic.name)
                        )}
                      </div>
                      <div>
                        <div className={styles.clinicName}>{clinic.name}</div>
                        <div className={styles.clinicAddress}>
                          {clinic.address || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatVND(clinic.totalRevenue)}
                  </td>
                  <td>{clinic.totalVisits}</td>
                  <td>{clinic.paidInvoices}</td>
                  <td>{clinic.unpaidInvoices}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyWrapper}>
          <span className={styles.emptyText}>
            {t('revenue.empty.noClinicData')}
          </span>
        </div>
      )}
    </div>
  )
}
