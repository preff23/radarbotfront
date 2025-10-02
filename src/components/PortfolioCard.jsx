import React from 'react'
import { IconWallet } from '@tabler/icons-react'
import styles from '../styles/portfolio.module.css'

export default function PortfolioCard({ 
  totalFormatted, 
  onInfoClick 
}) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div className={styles.icon} aria-hidden>
          <IconWallet size={20} />
        </div>
        <h2 className={styles.title}>Портфель</h2>
      </header>

      <div className={styles.costRow}>
        <span className={styles.costLabel}>Общая стоимость</span>
        <span className={styles.costValue} data-testid="portfolio-total">
          {totalFormatted}
        </span>
        {onInfoClick && (
          <button 
            className={styles.infoBtn}
            onClick={onInfoClick}
            aria-label="Подробнее"
          >
            ⓘ
          </button>
        )}
      </div>
    </section>
  )
}
