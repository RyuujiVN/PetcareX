import { Empty, Input, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import styles from '../activity.module.css'

const formatGrowth = (pct) => {
  if (pct === null || pct === undefined) return '—'
  const rounded = Math.round(pct * 10) / 10
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}%`
}

export default function ClinicActivityRankingTable({
  clinicRanking,
  clinicSearch,
  onSearchChange,
  periodOptions,
  period,
  onPeriodChange,
}) {
  const { t } = useTranslation('admin')

  const columns = [
    {
      title: '#',
      key: 'rank',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: t('activity.ranking.colName'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('activity.ranking.colAddress'),
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: t('activity.ranking.colCurrent'),
      dataIndex: 'currentVisits',
      key: 'currentVisits',
      align: 'right',
      render: (v) => Number(v || 0).toLocaleString('vi-VN'),
    },
    {
      title: t('activity.ranking.colPrevious'),
      dataIndex: 'previousVisits',
      key: 'previousVisits',
      align: 'right',
      render: (v) => Number(v || 0).toLocaleString('vi-VN'),
    },
    {
      title: t('activity.ranking.colGrowth'),
      dataIndex: 'growthPct',
      key: 'growthPct',
      align: 'right',
      render: (v) => {
        if (v === null || v === undefined) return <span className={styles.growthNeutral}>—</span>
        const cls = v > 0 ? styles.growthUp : v < 0 ? styles.growthDown : styles.growthNeutral
        return <span className={cls}>{formatGrowth(v)}</span>
      },
    },
    {
      title: t('activity.ranking.colStatus'),
      dataIndex: 'active',
      key: 'active',
      align: 'center',
      render: (active) => (
        <span className={`${styles.statusBadge} ${active ? styles.statusActive : styles.statusInactive}`}>
          {active ? t('activity.ranking.statusActive') : t('activity.ranking.statusInactive')}
        </span>
      ),
    },
  ]

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{t('activity.ranking.title')}</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {periodOptions ? (
            <div className={styles.periodTabs}>
              {periodOptions.map((opt) => (
                <button
                  key={opt.key}
                  className={`${styles.periodTab} ${period === opt.key ? styles.periodTabActive : ''}`}
                  onClick={() => onPeriodChange(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
          <Input.Search
            className={styles.searchInput}
            placeholder={t('activity.ranking.searchPlaceholder')}
            allowClear
            value={clinicSearch}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={clinicRanking}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: <Empty description={t('activity.ranking.empty')} /> }}
        size="middle"
      />
    </div>
  )
}
