import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatVND } from '../../../../../utils/currencyFormat'
import styles from '../adminRevenue.module.css'

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
        background: 'var(--admin-color-surface-card)',
        border: '1px solid var(--admin-color-border)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: 'var(--admin-shadow-md)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: 'var(--admin-color-text-secondary)',
        }}
      >
        {formatDateLabel(label)}
      </p>
      {payload.map((entry, i) => (
        <p
          key={i}
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            fontWeight: 600,
            color: entry.color,
          }}
        >
          {entry.name}: {formatVND(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function AdminRevenueChart({
  dailyRevenue,
  periodOptions,
  period,
  onPeriodChange,
}) {
  const { t } = useTranslation('admin')

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartCardHeader}>
        <h3 className={styles.chartCardTitle}>
          {t('revenue.chart.title')}
        </h3>
        {periodOptions && (
          <div className={styles.periodTabs}>
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.periodTab} ${
                  period === opt.key ? styles.periodTabActive : ''
                }`}
                onClick={() => onPeriodChange(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.chartLegend}>
        <span>
          <span
            className={styles.legendDot}
            style={{ background: 'var(--admin-revenue-chart-line)' }}
          />
          {t('revenue.chart.revenueLegend')}
        </span>
      </div>
      {dailyRevenue.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyRevenue}>
            <defs>
              <linearGradient
                id="adminRevenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--admin-revenue-primary)"
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor="var(--admin-revenue-primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--admin-color-border)"
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              fontSize={12}
              stroke="var(--admin-color-text-secondary)"
            />
            <YAxis
              tickFormatter={formatCurrencyShort}
              fontSize={12}
              stroke="var(--admin-color-text-secondary)"
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name={t('revenue.chart.revenueLegend')}
              stroke="var(--admin-revenue-primary)"
              strokeWidth={2}
              fill="url(#adminRevenueGradient)"
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
  )
}
