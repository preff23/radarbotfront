import React, { useState, useEffect } from 'react'
import { IconArrowLeft, IconLoader } from '@tabler/icons-react'

export default function CalendarPage({ onBack, userPhone }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Load calendar data
  useEffect(() => {
    loadCalendarData()
  }, [currentMonth, currentYear, userPhone])

  const loadCalendarData = async () => {
    if (!userPhone) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/portfolio/calendar?phone=${encodeURIComponent(userPhone)}&month=${currentMonth}&year=${currentYear}`)
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

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const getMonthName = (month) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    return months[month - 1]
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
        <h1>Календарь выплат</h1>
        <div className="cal-controls">
          <button 
            className="chip chip--ghost" 
            aria-label="prev"
            onClick={() => navigateMonth('prev')}
          >
            {'‹'}
          </button>
          <div className="month-pill">
            {getMonthName(currentMonth)} {currentYear}
          </div>
          <button 
            className="chip chip--ghost" 
            aria-label="next"
            onClick={() => navigateMonth('next')}
          >
            {'›'}
          </button>
        </div>
      </header>

      <section className="cal-list">
        {loading ? (
          <div className="text-center" style={{ padding: '40px 20px' }}>
            <IconLoader size={40} className="animate-spin" />
            <p className="card__meta" style={{ marginTop: '16px' }}>
              Загрузка календаря выплат...
            </p>
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

      <footer className="cal-footer">
        <button className="btn btn--primary" onClick={onBack}>
          <IconArrowLeft size={16} />
          К портфелю
        </button>
      </footer>
    </div>
  )
}
