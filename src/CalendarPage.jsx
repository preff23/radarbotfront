import React from 'react'
import { IconArrowLeft } from '@tabler/icons-react'

export default function CalendarPage({ onBack }) {
  return (
    <div className="cal">
      <header className="cal-header">
        <h1>Календарь выплат</h1>
        <div className="cal-controls">
          <button className="chip chip--ghost" aria-label="prev">{'‹'}</button>
          <div className="month-pill">Сентябрь 2025</div>
          <button className="chip chip--ghost" aria-label="next">{'›'}</button>
        </div>

        <div className="cal-filters">
          <button className="chip is-on">Все</button>
          <button className="chip">Купоны</button>
          <button className="chip">Погашения</button>
          <button className="chip">Оферты</button>
        </div>
      </header>

      <section className="cal-list">
        {/* Мок-данные для демонстрации */}
        {[1, 5, 12, 18, 27].map((day, i) => (
          <div key={i} className="cal-group">
            <div className="cal-date">{String(day).padStart(2, '0')}.09.2025 • Пн</div>

            <article className="pay-card">
              <div className="pay-left">
                <div className="pill pill--market">MOEX</div>
                <div className="title">КЛС-ТРЕЙД БО-03</div>
                <div className="subtitle">RU000A10ATB6 • купон</div>
              </div>
              <div className="pay-right">
                <div className="amount">15,50 ₽</div>
                <div className="note">на 1 облигацию</div>
              </div>
            </article>

            <article className="pay-card is-red">
              <div className="pay-left">
                <div className="pill pill--market">MOEX</div>
                <div className="title">Роделен1Р4</div>
                <div className="subtitle">RU000A105SK4 • погашение</div>
              </div>
              <div className="pay-right">
                <div className="amount">1 000,00 ₽</div>
                <div className="note">номинал</div>
              </div>
            </article>
          </div>
        ))}
      </section>

      <footer className="cal-footer">
        <button className="btn btn--primary" onClick={onBack}>
          <IconArrowLeft size={16} />
          К портфелю
        </button>
      </footer>
    </div>
  )
}
