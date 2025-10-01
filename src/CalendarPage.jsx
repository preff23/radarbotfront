import React, { useState, useEffect } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'

export default function CalendarPage({ onBack, userPhone }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPeriod, setCurrentPeriod] = useState('30')

  // Load calendar data
  useEffect(() => {
    loadCalendarData()
  }, [currentPeriod, userPhone])

  const loadCalendarData = async () => {
    if (!userPhone) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/portfolio/calendar?phone=${encodeURIComponent(userPhone)}&period=${currentPeriod}`)
      if (!response.ok) {
        throw new Error(`API Error ${response.status}`)
      }
      
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Failed to load calendar data:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = (period) => {
    switch (period) {
      case '30': return '30 дней'
      case '90': return '90 дней'
      case 'all': return 'Все выплаты'
      default: return '30 дней'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const weekday = weekdays[date.getDay()]
    
    return `${day}.${month}.${year} • ${weekday}`
  }

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'coupon': return 'купон'
      case 'maturity': return 'погашение'
      case 'dividend': return 'дивиденд'
      default: return type
    }
  }

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'coupon': return ''
      case 'maturity': return 'is-red'
      case 'dividend': return ''
      default: return ''
    }
  }

  const getProviderLabel = (provider) => {
    switch (provider) {
      case 'TBANK': return 'T-Bank'
      case 'MOEX': return 'MOEX'
      default: return provider || 'MOEX'
    }
  }

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = event.date.split('T')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {})

  return (
    <div className="cal">
      <header className="cal-header">
        <div className="cal-header-top">
          <h1>Календарь выплат</h1>
          <button className="btn btn--ghost" onClick={onBack}>
            <IconArrowLeft size={16} />
            К портфелю
          </button>
        </div>
        <div className="cal-filters">
          <button 
            className={`chip ${currentPeriod === '30' ? 'is-on' : ''}`}
            onClick={() => setCurrentPeriod('30')}
          >
            30 дней
          </button>
          <button 
            className={`chip ${currentPeriod === '90' ? 'is-on' : ''}`}
            onClick={() => setCurrentPeriod('90')}
          >
            90 дней
          </button>
          <button 
            className={`chip ${currentPeriod === 'all' ? 'is-on' : ''}`}
            onClick={() => setCurrentPeriod('all')}
          >
            Все выплаты
          </button>
        </div>
      </header>

      <section className="cal-list">
        {loading ? (
          <div className="text-center" style={{ padding: '40px 20px' }}>
            <div className="loading-spinner"></div>
            <div className="loading-text">
              Загрузка календаря выплат...
            </div>
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center" style={{ padding: '40px 20px' }}>
            <h3 className="empty-state__title">Нет выплат</h3>
            <p className="empty-state__description">
              В этом месяце нет запланированных выплат по вашим ценным бумагам
            </p>
          </div>
        ) : (
          Object.entries(groupedEvents)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, dayEvents]) => (
              <div key={date} className="cal-group">
                <div className="cal-date">{formatDate(dayEvents[0].date)}</div>
                
                {dayEvents.map((event, index) => (
                  <article key={index} className={`pay-card ${getEventTypeColor(event.type)}`}>
                    <div className="pay-left">
                      <div className="pill pill--market">{getProviderLabel(event.provider)}</div>
                      <div className="title">{event.security_name}</div>
                      <div className="subtitle">
                        {event.ticker} • {getEventTypeLabel(event.type)}
                      </div>
                    </div>
                    <div className="pay-right">
                      <div className="amount">
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: event.currency,
                          minimumFractionDigits: 2
                        }).format(event.total_amount)}
                      </div>
                      <div className="note">
                        {event.quantity} шт • {event.amount.toFixed(2)} {event.currency} за шт
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))
        )}
      </section>
    </div>
  )
}
