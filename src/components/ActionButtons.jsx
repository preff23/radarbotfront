import React from 'react'
import { IconCalendar } from '@tabler/icons-react'
import styles from '../styles/portfolio.module.css'

export default function ActionButtons({ onCalendarClick }) {
  return (
    <nav className={styles.actions} aria-label="Навигация по разделам портфеля">
      <button className={styles.actionBtn} onClick={onCalendarClick}>
        <IconCalendar size={18} className={styles.actionIcon} />
        Календарь
      </button>

      {/* зарезервировано на будущее (пример):
      <button className={styles.actionBtn} onClick={onSignalsClick}>
        <IconSignals size={18} className={styles.actionIcon} />
        Сигналы
      </button>
      <button className={styles.actionBtn} onClick={onAiScoreClick}>
        <IconBrain size={18} className={styles.actionIcon} />
        Оценка ИИ
      </button>
      */}
    </nav>
  )
}
