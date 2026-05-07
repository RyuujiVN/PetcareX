import { Empty, Input, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import styles from '../activity.module.css'

export default function ClinicActivityRankingTable({
  clinicRanking,
  clinicSearch,
  onSearchChange,
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
      dataIndex: 'visits',
      key: 'visits',
      align: 'right',
      render: (v) => Number(v || 0).toLocaleString('vi-VN'),
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
          <div className={styles.filterRow}>
            <Input
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
