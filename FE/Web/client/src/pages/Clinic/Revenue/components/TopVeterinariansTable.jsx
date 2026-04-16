import { useTranslation } from 'react-i18next'
import { getVeterinarySpecialtyLabel } from '../../../../utils/enumLabel'
import styles from '../revenue.module.css'

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

export default function TopVeterinariansTable({ veterinarians }) {
  const { t } = useTranslation('clinic')
  const currentMonth = new Date().getMonth() + 1
  const title = t('revenue.topVets.titleMonthly', { month: currentMonth })

  if (!veterinarians?.length) {
    return (
      <div className={styles.topVetsCard}>
        <h3 className={styles.topVetsTitle}>{title}</h3>
        <div className={styles.emptyWrapper}>
          <span className={styles.emptyText}>
            {t('revenue.empty.noVetData')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.topVetsCard}>
      <h3 className={styles.topVetsTitle}>{title}</h3>
      <table className={styles.topVetsTable}>
        <thead>
          <tr>
            <th>{t('revenue.topVets.doctor')}</th>
            <th>{t('revenue.topVets.records')}</th>
          </tr>
        </thead>
        <tbody>
          {veterinarians.map((vet) => (
            <tr key={vet.id}>
              <td>
                <div className={styles.vetInfo}>
                  {vet.avatarUrl ? (
                    <img
                      src={vet.avatarUrl}
                      alt={vet.fullName}
                      className={styles.vetAvatarImg}
                    />
                  ) : (
                    <div className={styles.vetAvatar}>
                      {getInitials(vet.fullName)}
                    </div>
                  )}
                  <div>
                    <div className={styles.vetName}>{vet.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {getVeterinarySpecialtyLabel(vet.specialty)}
                    </div>
                  </div>
                </div>
              </td>
              <td>{vet.recordCount ?? vet.totalAppointment ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
