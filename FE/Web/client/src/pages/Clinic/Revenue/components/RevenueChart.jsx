import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getVeterinarySpecialtyLabel } from '../../../../utils/enumLabel'
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import styles from '../revenue.module.css'

const PIE_COLORS = ['#4672b4', '#faad14', '#52c41a', '#8c8c8c']

const formatCurrencyShort = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value
}

const formatDateLabel = (dateStr) => {
  const d = dayjs(dateStr)
  return d.isValid() ? d.format('DD.MM') : dateStr
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {formatDateLabel(label)}
      </p>
      {payload.map((entry, i) => (
        <p
          key={i}
          style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: entry.color }}
        >
          {entry.name}: {Number(entry.value).toLocaleString('vi-VN')} đ
        </p>
      ))}
    </div>
  )
}

export default function RevenueChart({ dailyRevenue, enrichedRecords }) {
  const { t } = useTranslation('clinic')

  const serviceDistribution = useMemo(() => {
    const map = {}
    const records = enrichedRecords?.filter((r) => r.invoice?.status === 'PAID') || []

    records.forEach((r) => {
      const specialty = r.veterinarian?.specialty || 'OTHER'
      if (!map[specialty]) map[specialty] = { name: specialty, value: 0 }
      map[specialty].value += r.invoice?.totalAmount || 0
    })

    return Object.values(map)
  }, [enrichedRecords])

  const specialtyLabel = (key) => {
    if (key === 'OTHER') return t('revenue.specialty.other')
    return getVeterinarySpecialtyLabel(key)
  }

  return (
    <div className={styles.chartsRow}>
      {/* Line/Area Chart - Doanh thu theo ngày */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>
          {t('revenue.chart.dailyTitle')}
        </h3>
        <div className={styles.chartLegend}>
          <span>
            <span
              className={styles.legendDot}
              style={{ background: 'var(--page-revenue-chart-line)' }}
            />
            {t('revenue.chart.revenueLegend')}
          </span>
          <span>
            <span
              className={styles.legendDot}
              style={{ background: 'var(--page-revenue-chart-secondary)' }}
            />
            {t('revenue.chart.countLegend')}
          </span>
        </div>
        {dailyRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyRevenue}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4672b4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4672b4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                fontSize={12}
                stroke="#8c8c8c"
              />
              <YAxis
                tickFormatter={formatCurrencyShort}
                fontSize={12}
                stroke="#8c8c8c"
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name={t('revenue.chart.revenueLegend')}
                stroke="#4672b4"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.emptyWrapper}>
            <span className={styles.emptyText}>
              {t('revenue.empty.noChartData')}
            </span>
          </div>
        )}
      </div>

      {/* Pie Chart - Theo loại dịch vụ */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartCardTitle}>
          {t('revenue.chart.serviceTitle')}
        </h3>
        {serviceDistribution.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {serviceDistribution.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => `${Number(v).toLocaleString('vi-VN')} đ`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.pieLegend}>
              {serviceDistribution.map((entry, index) => (
                <span key={entry.name} className={styles.pieLegendItem}>
                  <span
                    className={styles.legendDot}
                    style={{
                      background: PIE_COLORS[index % PIE_COLORS.length],
                    }}
                  />
                  {specialtyLabel(entry.name)}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyWrapper}>
            <span className={styles.emptyText}>
              {t('revenue.empty.noServiceData')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
