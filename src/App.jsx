import React, { useState, useEffect, useMemo } from 'react'
import {
  IconDiamond, 
  IconPlus, 
  IconLogout,
  IconWallet,
  IconCoins,
  IconEdit, 
  IconTrash, 
  IconStar,
  IconMinus,
  IconCalendar
} from '@tabler/icons-react'
import PortfolioDetailsModal from './PortfolioDetailsModal'
import { formatCurrency } from './utils/format'
import { 
  Loader, 
  Center, 
  Stack, 
  Text, 
  Button, 
  Card, 
  Flex, 
  Box, 
  Group, 
  ActionIcon, 
  Tooltip, 
  Transition, 
  ScrollArea,
  Modal,
  TextInput,
  Select,
  NumberInput,
  Tabs,
  Alert,
  Avatar
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { MINIAPP_REV } from './version'
import CalendarPage from './CalendarPage' 

// API functions
async function fetchSecurityDetails(isin, phone) {
  try {
    console.log('Fetching security details for ISIN:', isin)
    const response = await fetch(`/api/portfolio/security/${encodeURIComponent(isin)}/details?phone=${encodeURIComponent(phone)}`)
    console.log('Security details response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Security details API Error:', response.status, errorText)
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    console.log('Security details data:', data)
    return data
  } catch (error) {
    console.error('Failed to fetch security details:', error)
    throw error
  }
}

async function fetchPortfolio(phone) {
  try {
    console.log('Fetching portfolio from /api/portfolio with phone:', phone)
    const response = await fetch(`/api/portfolio?phone=${encodeURIComponent(phone)}`)
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    console.log('Portfolio data:', data)
    return data
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    throw error
  }
}

async function addPosition(position, phone) {
  try {
    console.log('=== ADD POSITION API ===')
    console.log('Position:', position)
    console.log('Phone:', phone)
    
    const url = `/api/portfolio/position?phone=${encodeURIComponent(phone)}`
    console.log('API URL:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(position)
    })
    
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)
      throw new Error(`Failed to add position: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log('API Response:', result)
    return result
  } catch (error) {
    console.error('Error adding position:', error)
    throw error
  }
}

async function updatePosition(id, position, phone) {
  try {
    const response = await fetch(`/api/portfolio/position/${id}?phone=${encodeURIComponent(phone)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(position)
    })
    if (!response.ok) throw new Error('Failed to update position')
    return await response.json()
  } catch (error) {
    console.error('Error updating position:', error)
    throw error
  }
}

async function deletePosition(id, phone) {
  try {
    const response = await fetch(`/api/portfolio/position/${id}?phone=${encodeURIComponent(phone)}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete position')
    return await response.json()
  } catch (error) {
    console.error('Error deleting position:', error)
    throw error
  }
}

// Security type icons
function getSecurityIcon(type) {
  switch (type?.toLowerCase()) {
    case 'bond': return <IconCoins size={20} color="var(--brand)" />
    case 'share': return <IconStar size={20} color="var(--brand-2)" />
    case 'etf': return <IconDiamond size={20} color="var(--ok)" />
    default: return <IconCoins size={20} color="var(--muted)" />
  }
}

function getSecurityColor(type) {
  switch (type?.toLowerCase()) {
    case 'bond': return 'var(--brand)'
    case 'share': return 'var(--brand-2)'
    case 'etf': return 'var(--ok)'
    default: return 'var(--muted)'
  }
}

// Login Form Component
function LoginForm({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return

    setLoading(true)
    try {
      // Normalize phone number
      const normalizedPhone = phone.replace(/\D/g, '')
      if (normalizedPhone.startsWith('7')) {
        onLogin(`+${normalizedPhone}`)
      } else if (normalizedPhone.startsWith('8')) {
        onLogin(`+7${normalizedPhone.slice(1)}`)
        } else {
        onLogin(`+7${normalizedPhone}`)
      }
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось войти в систему',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="empty-state">
          <div className="empty-state__icon">
            <IconDiamond size={40} />
          </div>
          <h2 className="empty-state__title">Добро пожаловать в Radar</h2>
          <p className="empty-state__description">
            Введите номер телефона для входа в систему
          </p>
          
          <form onSubmit={handleSubmit} style={{ maxWidth: '300px', margin: '0 auto' }}>
                <TextInput
              placeholder="+7 (999) 123-45-67"
                  value={phone}
              onChange={(e) => setPhone(e.target.value)}
              size="lg"
              style={{ marginBottom: '20px' }}
              styles={{
                input: {
                  background: 'var(--chip)',
                  border: '1px solid var(--stroke)',
                  color: 'var(--text)',
                  '&:focus': {
                    borderColor: 'var(--brand)',
                    boxShadow: 'var(--brand-glow)'
                  }
                }
              }}
                />
                <Button
                  type="submit"
              className="btn btn--primary"
                  loading={loading}
              fullWidth
                >
              Войти
                </Button>
            </form>
        </div>
      </div>
    </div>
  )
}

// Portfolio Hero Component
function PortfolioHero({ account }) {
  if (!account) return null

  return (
    <div className="card card--glow">
      <div className="portfolio-hero__header">
        <div className="portfolio-hero__icon">
          <IconWallet size={32} color="white" />
        </div>
        <div>
          <h2 className="card__title">Портфель</h2>
          <p className="card__meta">Ваш инвестиционный профиль</p>
        </div>
      </div>
      
      <div className="portfolio-hero__stats">
        <div className="chip chip--ok">
          <IconCoins size={12} />
          {account.currency || 'RUB'}
        </div>
        <div className="chip">
          {account.positions?.length || 0} бумаг
        </div>
      </div>
      
      {account.portfolio_value && (
        <div className="text-center">
          <p className="card__meta">Общая стоимость</p>
          <h3 className="card__title" style={{ fontSize: '24px', margin: '8px 0 0 0' }}>
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: account.currency || 'RUB',
              minimumFractionDigits: 0
            }).format(account.portfolio_value)}
          </h3>
        </div>
      )}
    </div>
  )
}

// Asset Card Component
function AssetCard({ position, onEdit, onDelete, userPhone }) {
  const [details, setDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const loadDetails = async () => {
    if (!position.isin || details || loadingDetails) return
    
    setLoadingDetails(true)
    try {
      const data = await fetchSecurityDetails(position.isin, userPhone)
      setDetails(data)
    } catch (error) {
      console.error('Failed to load security details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const toggleDetails = () => {
    if (!details && !loadingDetails) {
      loadDetails()
    }
    setShowDetails(!showDetails)
  }

  return (
    <div className="card asset-card">
      <div className="asset-card__header" onClick={toggleDetails} style={{ cursor: 'pointer' }}>
        <div className="asset-card__icon" style={{ color: getSecurityColor(position.security_type) }}>
          {getSecurityIcon(position.security_type)}
        </div>
        <div className="asset-card__content">
          <h4 className="card__title">{position.name}</h4>
          <p className="card__meta">
            {position.ticker && `${position.ticker} • `}
            {position.security_type}
          </p>
        </div>
        <div className="asset-card__actions">
          <Tooltip label="Редактировать">
            <ActionIcon
              className="btn btn--ghost btn--icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(position)
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Удалить">
            <ActionIcon
              className="btn btn--ghost btn--icon"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(position)
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>
      
      <div className="asset-card__footer">
        <div className="chip">
          <IconCoins size={12} />
          {position.quantity} шт
        </div>
        {position.isin && (
          <div className="chip" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {position.isin}
          </div>
        )}
        {position.fallback && (
          <div className="chip chip--warn">
            <IconStar size={12} />
            Fallback
          </div>
        )}
        {position.provider && (
          <div className="chip">
            {position.provider}
          </div>
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="asset-card__details">
          {loadingDetails ? (
            <div className="text-center" style={{ padding: '20px' }}>
              <Loader size="sm" />
              <p className="card__meta" style={{ marginTop: '10px' }}>Загрузка деталей...</p>
            </div>
          ) : details ? (
            <div className="details-grid">
              {/* Price Information */}
              {details.price && (
                <div className="details-section">
                  <h5 className="details-title">Цена</h5>
                  <div className="details-row">
                    <span className="details-label">Текущая:</span>
                    <span className="details-value">
                      {details.price.last ? (() => {
                        // Для облигаций показываем цену в рублях, для акций - как есть
                        if (details.security_type === 'bond' && details.bond_info?.face_value) {
                          const priceInRubles = (details.price.last / 100) * details.bond_info.face_value;
                          return `${priceInRubles.toFixed(2)} ${details.price.currency || 'RUB'}`;
                        } else {
                          return `${details.price.last.toFixed(2)} ${details.price.currency || 'RUB'}`;
                        }
                      })() : 'Н/Д'}
                    </span>
                  </div>
                  {details.price.change_day_pct && (
                    <div className="details-row">
                      <span className="details-label">Изменение:</span>
                      <span className={`details-value ${details.price.change_day_pct >= 0 ? 'positive' : 'negative'}`}>
                        {details.price.change_day_pct >= 0 ? '+' : ''}{details.price.change_day_pct.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {/* Для облигаций показываем также цену в процентах от номинала */}
                  {details.security_type === 'bond' && details.price.last && (
                    <div className="details-row">
                      <span className="details-label">% от номинала:</span>
                      <span className="details-value">
                        {details.price.last.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bond Information */}
              {details.bond_info && (
                <div className="details-section">
                  <h5 className="details-title">Облигация</h5>
                  {details.bond_info.ytm && (
                    <div className="details-row">
                      <span className="details-label">YTM:</span>
                      <span className="details-value positive">{details.bond_info.ytm.toFixed(2)}%</span>
                    </div>
                  )}
                  {details.bond_info.duration && (
                    <div className="details-row">
                      <span className="details-label">Дюрация:</span>
                      <span className="details-value">{details.bond_info.duration.toFixed(0)} дней</span>
                    </div>
                  )}
                  {details.bond_info.face_value && (
                    <div className="details-row">
                      <span className="details-label">Номинал:</span>
                      <span className="details-value">{details.bond_info.face_value.toFixed(2)} {details.price?.currency || 'RUB'}</span>
                    </div>
                  )}
                  {/* Показываем цену в процентах от номинала для облигаций */}
                  {details.price?.last && (
                    <div className="details-row">
                      <span className="details-label">Цена:</span>
                      <span className="details-value">
                        {details.price.last.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {details.bond_info.coupon_rate && (
                    <div className="details-row">
                      <span className="details-label">Купон:</span>
                      <span className="details-value">{details.bond_info.coupon_rate.toFixed(2)}%</span>
                    </div>
                  )}
                  {details.bond_info.maturity_date && (
                    <div className="details-row">
                      <span className="details-label">Погашение:</span>
                      <span className="details-value">
                        {new Date(details.bond_info.maturity_date).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Share Information */}
              {details.share_info && (
                <div className="details-section">
                  <h5 className="details-title">Акция</h5>
                  {details.share_info.sector && (
                    <div className="details-row">
                      <span className="details-label">Сектор:</span>
                      <span className="details-value">{details.share_info.sector}</span>
                    </div>
                  )}
                  {details.share_info.dividend_value && (
                    <div className="details-row">
                      <span className="details-label">Дивиденды:</span>
                      <span className="details-value">{details.share_info.dividend_value.toFixed(2)} {details.price?.currency || 'RUB'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Rating Information */}
              {details.rating && (
                <div className="details-section">
                  <h5 className="details-title">Рейтинг</h5>
                  <div className="details-row">
                    <span className="details-label">Рейтинг:</span>
                    <span className="details-value">{details.rating.rating}</span>
                  </div>
                  {details.rating.rating_agency && (
                    <div className="details-row">
                      <span className="details-label">Агентство:</span>
                      <span className="details-value">{details.rating.rating_agency}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Trading Information */}
              {details.trading && (
                <div className="details-section">
                  <h5 className="details-title">Торговля</h5>
                  {details.trading.volume && (
                    <div className="details-row">
                      <span className="details-label">Объем:</span>
                      <span className="details-value">
                        {new Intl.NumberFormat('ru-RU').format(details.trading.volume)}
                      </span>
                    </div>
                  )}
                  {details.trading.board && (
                    <div className="details-row">
                      <span className="details-label">Площадка:</span>
                      <span className="details-value">{details.trading.board}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center" style={{ padding: '20px' }}>
              <p className="card__meta">Детальная информация недоступна</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Asset List Component
function AssetList({ account, onEdit, onDelete, userPhone }) {
  if (!account?.positions?.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state__icon">
            <IconMinus size={40} />
          </div>
          <h3 className="empty-state__title">Портфель пуст</h3>
          <p className="empty-state__description">
            Добавьте ценные бумаги для начала работы
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {account.positions.map((position, index) => (
        <Transition
          key={position.id}
          mounted={true}
          transition="slide-up"
          duration={300}
          timingFunction="ease-out"
          style={{ transitionDelay: `${index * 50}ms` }}
        >
          {(styles) => (
            <div style={styles}>
              <AssetCard
                position={position}
                onEdit={onEdit}
                onDelete={onDelete}
                userPhone={userPhone}
              />
            </div>
          )}
        </Transition>
      ))}
    </div>
  )
}

// Add Position Modal
function AddPositionModal({ opened, onClose, onSubmit, userPhone }) {
  const [formData, setFormData] = useState({
    search: '',
    quantity: 1
  })
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSecurity, setSelectedSecurity] = useState(null)

  // Search for securities
  const handleSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setSelectedSecurity(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/portfolio/search?query=${encodeURIComponent(query.trim())}&phone=${encodeURIComponent(userPhone)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Search results:', data)
      
      // Transform API results to our format and filter for Russian securities only
      const results = data.results
        ?.map(item => ({
          name: item.name || item.shortname || 'Неизвестно',
          ticker: item.ticker || item.secid || '',
          isin: item.isin || '',
          type: item.type === 'share' ? 'share' : 'bond',
          provider: item.description?.includes('Справочник') ? 'BondReference' : 'MOEX',
          description: item.description || ''
        }))
        .filter(item => {
          // Filter for Russian securities only
          const isin = item.isin?.toUpperCase() || ''
          const ticker = item.ticker?.toUpperCase() || ''
          const name = item.name?.toUpperCase() || ''
          
          // Russian ISIN starts with RU
          if (isin.startsWith('RU')) {
            return true
          }
          
          // Exclude foreign ISINs (US, DE, GB, etc.)
          if (isin && (isin.startsWith('US') || isin.startsWith('DE') || isin.startsWith('GB') || 
                      isin.startsWith('FR') || isin.startsWith('IT') || isin.startsWith('ES') ||
                      isin.startsWith('NL') || isin.startsWith('CH') || isin.startsWith('CA') ||
                      isin.startsWith('JP') || isin.startsWith('CN') || isin.startsWith('KR'))) {
            return false
          }
          
          // Russian tickers on MOEX (common patterns)
          if (ticker && (
            ticker.startsWith('RU') || // Russian bonds
            ['GAZP', 'SBER', 'LKOH', 'NVTK', 'ROSN', 'TATN', 'MAGN', 'NLMK', 'CHMF', 'PLZL', 'RUAL', 'YNDX', 'OZON', 'QIWI', 'POLY', 'AFLT', 'AERO', 'FIVE', 'DSKY', 'MAIL', 'VKCO', 'TCSG', 'LENT', 'MGNT', 'MVID', 'PHOR', 'RENI', 'RTKM', 'SELG', 'SMLT', 'TATNP', 'TRNFP', 'UPRO', 'VSMO', 'WTCM', 'YAKG'].includes(ticker)
          )) {
            return true
          }
          
          // Exclude foreign company names
          if (name && (
            name.includes('INC.') || name.includes('CORP.') || name.includes('LTD.') ||
            name.includes('LLC') || name.includes('COMPANY') || name.includes('ENTERPRISE') ||
            name.includes('GROUP') || name.includes('HOLDINGS') || name.includes('INTERNATIONAL')
          )) {
            return false
          }
          
          // If no ISIN or ticker, check if it's from BondReference (usually Russian)
          if (item.provider === 'BondReference') {
            return true
          }
          
          // If it's from MOEX and has Russian-sounding name, include it
          if (item.provider === 'MOEX' && name && (
            name.includes('ОФЗ') || name.includes('ОБЛИГАЦИЯ') || name.includes('АКЦИЯ') ||
            name.includes('ГАЗПРОМ') || name.includes('СБЕРБАНК') || name.includes('ЛУКОЙЛ') ||
            name.includes('РОСНЕФТЬ') || name.includes('ТАТНЕФТЬ') || name.includes('МАГНИТ') ||
            name.includes('НОВАТЭК') || name.includes('НЛМК') || name.includes('ЧЕРКИЗОВО') ||
            name.includes('ПОЛЮС') || name.includes('РУСАЛ') || name.includes('ЯНДЕКС') ||
            name.includes('ОЗОН') || name.includes('КИВИ') || name.includes('АЭРОФЛОТ') ||
            name.includes('МАГНИТ') || name.includes('ЛЕНТА') || name.includes('МЕГАФОН') ||
            name.includes('МТС') || name.includes('БИЛАЙН') || name.includes('РОСТЕЛЕКОМ')
          )) {
            return true
          }
          
          return false
        }) || []
      
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      notifications.show({
        title: 'Ошибка поиска',
        message: 'Не удалось найти ценные бумаги',
        color: 'red'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e) => {
    console.log('=== HANDLE SUBMIT CALLED ===')
    console.log('Event:', e)
    e.preventDefault()
    console.log('=== FORM SUBMIT ===')
    console.log('Selected security:', selectedSecurity)
    console.log('Form data:', formData)
    console.log('User phone:', userPhone)
    
    if (!selectedSecurity) {
      console.log('No security selected')
      notifications.show({
        title: 'Ошибка',
        message: 'Выберите ценную бумагу из результатов поиска',
        color: 'red'
      })
      return
    }

    if (!formData.quantity || formData.quantity < 1) {
      console.log('Invalid quantity:', formData.quantity)
      notifications.show({
        title: 'Ошибка',
        message: 'Введите корректное количество',
        color: 'red'
      })
      return
    }

    console.log('Calling onSubmit with data:', {
      name: selectedSecurity.name,
      ticker: selectedSecurity.ticker,
      security_type: selectedSecurity.type,
      quantity: formData.quantity,
      isin: selectedSecurity.isin,
      provider: selectedSecurity.provider
    })

    try {
      await onSubmit({
        account_id: 'manual',
        account_name: 'Портфель',
        currency: 'RUB',
        name: selectedSecurity.name,
        ticker: selectedSecurity.ticker,
        security_type: selectedSecurity.type,
        quantity: formData.quantity,
        quantity_unit: 'шт',
        isin: selectedSecurity.isin
      })
      
      console.log('Position added successfully')
      setFormData({ search: '', quantity: 1 })
      setSearchResults([])
      setSelectedSecurity(null)
      onClose()
    } catch (error) {
      console.error('Error adding position:', error)
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось добавить позицию',
        color: 'red'
      })
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Добавить ценную бумагу"
      size="md"
      styles={{
        content: {
          background: 'var(--panel)',
          border: '1px solid var(--stroke)'
        },
        header: {
          background: 'var(--panel)',
          borderBottom: '1px solid var(--stroke)'
        },
        title: {
          color: 'var(--text)'
        }
      }}
    >
      <form onSubmit={(e) => {
        console.log('=== FORM SUBMIT EVENT ===')
        console.log('Event:', e)
        handleSubmit(e)
      }}>
        <Stack gap="md">
          <TextInput
            label="Поиск по названию или ISIN"
            placeholder="Введите название или ISIN ценной бумаги..."
            value={formData.search}
            onChange={(e) => {
              const query = e.target.value
              setFormData({ ...formData, search: query })
              handleSearch(query)
            }}
            required
            rightSection={isSearching ? <Loader size={16} /> : null}
            styles={{
              input: {
                background: 'var(--chip)',
                border: '1px solid var(--stroke)',
                color: 'var(--text)'
              },
              label: { color: 'var(--text)' }
            }}
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {searchResults.map((security, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onClick={() => setSelectedSecurity(security)}
                  style={{
                    padding: '12px',
                    border: selectedSecurity?.isin === security.isin ? '2px solid var(--brand)' : '1px solid var(--stroke)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    background: selectedSecurity?.isin === security.isin ? 'rgba(45, 227, 195, 0.1)' : 'var(--chip)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                    {security.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {security.ticker && `${security.ticker} • `}
                    {security.isin && `${security.isin} • `}
                    {security.type === 'bond' ? 'Облигация' : 'Акция'}
                    {security.provider && ` • ${security.provider}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedSecurity && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(45, 227, 195, 0.1)', 
              border: '1px solid var(--brand)', 
              borderRadius: '8px',
              marginBottom: '8px'
            }}>
              <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                Выбрано: {selectedSecurity.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {selectedSecurity.ticker && `${selectedSecurity.ticker} • `}
                {selectedSecurity.isin && `${selectedSecurity.isin} • `}
                {selectedSecurity.type === 'bond' ? 'Облигация' : 'Акция'}
                {selectedSecurity.provider && ` • ${selectedSecurity.provider}`}
              </div>
            </div>
          )}
          
          <NumberInput
            label="Количество"
            value={formData.quantity}
            onChange={(value) => setFormData({ ...formData, quantity: value || 1 })}
            min={1}
            styles={{
              input: {
                background: 'var(--chip)',
                border: '1px solid var(--stroke)',
                color: 'var(--text)'
              },
              label: { color: 'var(--text)' }
            }}
          />
          
          <Group justify="flex-end" gap="md">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!selectedSecurity}
              onClick={(e) => {
                console.log('=== BUTTON CLICKED ===')
                console.log('Event:', e)
                console.log('Selected security:', selectedSecurity)
                console.log('Form data:', formData)
                console.log('Button disabled:', !selectedSecurity)
                // Don't prevent default, let form submit naturally
              }}
            >
              Добавить {!selectedSecurity ? '(выберите ценную бумагу)' : ''}
            </button>
        </Group>
      </Stack>
      </form>
    </Modal>
  )
}

// Edit Position Modal
function EditPositionModal({ opened, onClose, position, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    quantity: 1,
    security_type: 'bond',
    isin: '',
    provider: 'manual'
  })

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name || '',
        ticker: position.ticker || '',
        quantity: position.quantity || 1,
        security_type: position.security_type || 'bond',
        isin: position.isin || '',
        provider: position.provider || 'manual'
      })
    }
  }, [position])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
    onClose()
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить позицию',
        color: 'red'
      })
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Редактировать ценную бумагу"
      size="md"
      styles={{
        content: {
          background: 'var(--panel)',
          border: '1px solid var(--stroke)'
        },
        header: {
          background: 'var(--panel)',
          borderBottom: '1px solid var(--stroke)'
        },
        title: {
          color: 'var(--text)'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            styles={{
              input: {
                background: 'var(--chip)',
                border: '1px solid var(--stroke)',
                color: 'var(--text)'
              },
              label: { color: 'var(--text)' }
            }}
          />
          
          <TextInput
            label="Тикер"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
            styles={{
              input: {
                background: 'var(--chip)',
                border: '1px solid var(--stroke)',
                color: 'var(--text)'
              },
              label: { color: 'var(--text)' }
            }}
          />
          
          <Select
            label="Тип"
            value={formData.security_type}
            onChange={(value) => setFormData({ ...formData, security_type: value })}
            data={[
              { value: 'bond', label: 'Облигация' },
              { value: 'share', label: 'Акция' },
              { value: 'etf', label: 'ETF' }
            ]}
            styles={{
              input: {
                background: 'var(--chip)',
                border: '1px solid var(--stroke)',
                color: 'var(--text)'
              },
              label: { color: 'var(--text)' }
            }}
          />
          
        <NumberInput
          label="Количество"
            value={formData.quantity}
            onChange={(value) => setFormData({ ...formData, quantity: value || 1 })}
            min={1}
            styles={{
              input: {
                background: 'var(--chip)',
                border: '1px solid var(--stroke)',
                color: 'var(--text)'
              },
              label: { color: 'var(--text)' }
            }}
          />
          
        <TextInput
            label="ISIN"
            value={formData.isin}
            onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
            styles={{
              input: {
                background: 'var(--chip)',
                border: '1px solid var(--stroke)',
                color: 'var(--text)'
              },
              label: { color: 'var(--text)' }
            }}
          />
          
          <Group justify="flex-end" gap="md">
            <Button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="btn btn--primary"
            >
              Сохранить
            </Button>
        </Group>
      </Stack>
      </form>
    </Modal>
  )
}

// Main App Component
export default function App() {
  const [userPhone, setUserPhone] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addOpened, setAddOpened] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [currentPage, setCurrentPage] = useState('portfolio')
  const [portfolioDetailsOpened, setPortfolioDetailsOpened] = useState(false)

  // Получаем account из data
  const account = data?.accounts?.[0]

  // Безопасный расчет суммы портфеля
  const portfolioAmount = useMemo(() => {
    if (!account?.holdings) return '—'
    
    console.log('Portfolio holdings:', account.holdings)
    
    const sum = account.holdings.reduce((acc, holding) => {
      // Используем правильные поля из API
      const quantity = holding.raw_quantity || holding.quantity || 0
      const price = holding.price || 0
      const marketValue = holding.market_value || (quantity * price)
      
      console.log('Holding:', {
        name: holding.name || holding.ticker || holding.isin,
        raw_quantity: holding.raw_quantity,
        quantity: holding.quantity,
        price: holding.price,
        market_value: holding.market_value,
        calculated: quantity * price
      })
      
      return acc + marketValue
    }, 0)
    
    console.log('Total portfolio sum:', sum)
    return formatCurrency(sum, 'RUB')
  }, [account?.holdings])

  // Подсчет количества бумаг
  const papersCount = useMemo(() => {
    if (!account?.holdings) return 0
    
    const count = account.holdings.reduce((acc, holding) => {
      const quantity = holding.raw_quantity || holding.quantity || 0
      return acc + quantity
    }, 0)
    
    console.log('Papers count:', count)
    return count
  }, [account?.holdings])

  // Load portfolio data
  useEffect(() => {
    if (userPhone) {
      loadPortfolio()
    }
  }, [userPhone])

  const loadPortfolio = async () => {
    setLoading(true)
    try {
      console.log('Loading portfolio for phone:', userPhone)
      const portfolioData = await fetchPortfolio(userPhone)
      console.log('Portfolio data received:', portfolioData)
      setData(portfolioData)
    } catch (error) {
      console.error('Error loading portfolio:', error)
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить портфель',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (phone) => {
    setUserPhone(phone)
  }

  const handleLogout = () => {
    setUserPhone(null)
    setData(null)
  }

  const handleAdd = async (position) => {
    console.log('=== HANDLE ADD ===')
    console.log('Position data:', position)
    console.log('User phone:', userPhone)
    
    try {
      console.log('Calling addPosition...')
      const result = await addPosition(position, userPhone)
      console.log('addPosition result:', result)
      
      console.log('Reloading portfolio...')
      await loadPortfolio()
      console.log('Portfolio reloaded')
      
      notifications.show({
        title: 'Успешно',
        message: 'Позиция добавлена',
        color: 'green'
      })
    } catch (error) {
      console.error('Error in handleAdd:', error)
      console.error('Error details:', error.message)
      notifications.show({
        title: 'Ошибка',
        message: `Не удалось добавить позицию: ${error.message}`,
        color: 'red'
      })
      throw error
    }
  }

  const handleUpdate = async (position, payload) => {
    try {
      await updatePosition(position.id, payload, userPhone)
      await loadPortfolio()
      notifications.show({
        title: 'Успешно',
        message: 'Позиция обновлена',
        color: 'green'
      })
    } catch (error) {
      throw error
    }
  }

  const handleDelete = async (position) => {
    if (!confirm('Удалить эту позицию?')) return
    
    try {
      await deletePosition(position.id, userPhone)
      await loadPortfolio()
      notifications.show({
        title: 'Успешно',
        message: 'Позиция удалена',
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить позицию',
        color: 'red'
      })
    }
  }

  // Show login form if not authenticated
  if (!userPhone) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Show loading state
  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <div className="header__bar">
            <div className="header__brand">
              <div className="header__logo">
                <IconDiamond size={24} color="white" />
              </div>
              <div>
                <h1 className="header__title">Radar портфель</h1>
                <p className="card__meta">Загрузка...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="xl" color="var(--brand)" />
              <Text size="lg" fw={500} c="var(--muted)">Загрузка портфеля...</Text>
                </Stack>
          </Center>
        </div>
      </div>
    )
  }

  const userPhoneMasked = userPhone ? userPhone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5') : ''

  // Show calendar page if currentPage is 'calendar'
  if (currentPage === 'calendar') {
    return (
      <div className="app">
        <CalendarPage 
          onBack={() => setCurrentPage('portfolio')} 
          userPhone={userPhone}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="page">
        <header className="tg-header">
          <div className="hdr-left">
            <div className="hdr-account">
              <div className="hdr-caption">Аккаунт:</div>
              <div className="hdr-phone">{userPhoneMasked || 'Загрузка...'}</div>
            </div>
          </div>
          <div className="hdr-actions">
            <button
              className="btn btn--primary"
              onClick={() => setAddOpened(true)}
            >
              <IconPlus size={16} />
              Добавить
            </button>
            <button
              className="btn btn--danger"
              onClick={handleLogout}
            >
              <IconLogout size={16} />
              Выйти
            </button>
          </div>
        </header>

        {!data ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state__icon">
                <Loader size={40} />
              </div>
              <h3 className="empty-state__title">Загрузка портфеля...</h3>
              <p className="empty-state__description">
                Получаем данные вашего портфеля
              </p>
            </div>
          </div>
        ) : account ? (
          <section className="portfolio-card is-sticky no-x-scroll">
            <div className="pc-left">
              <div className="pc-icon">
                <IconWallet size={20} />
              </div>
              <div className="pc-info">
                <div className="pc-top">
                  <h2 className="pc-title">Портфель</h2>
                  <div className="pc-chips">
                    <span className="chip">RUB</span>
                    <span className="chip">{papersCount} бумаг</span>
                  </div>
                </div>
                <div className="pc-bottom">
                  <span className="pc-caption">Общая стоимость</span>
                  <strong className="pc-amount">{portfolioAmount}</strong>
                </div>
              </div>
            </div>
            <div className="pc-cta">
              <button 
                className="btn-calendar" 
                onClick={() => setCurrentPage('calendar')}
              >
                <IconCalendar size={16} />
                Календарь
              </button>
            </div>
          </section>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state__icon">
                <IconMinus size={40} />
              </div>
              <h3 className="empty-state__title">Портфель не найден</h3>
              <p className="empty-state__description">
                Не удалось загрузить данные портфеля. Попробуйте обновить страницу.
              </p>
              <Button
                className="btn btn--primary"
                onClick={loadPortfolio}
                style={{ marginTop: '16px' }}
              >
                Обновить
              </Button>
            </div>
          </div>
        )}

        <div className="list-scroll">
          {data && account && (
            <AssetList
              account={account}
              onEdit={(pos) => setEditTarget(pos)}
              onDelete={handleDelete}
              userPhone={userPhone}
            />
          )}
        </div>
      </div>

      <AddPositionModal
        opened={addOpened}
        onClose={() => setAddOpened(false)}
        onSubmit={handleAdd}
        userPhone={userPhone}
      />
      
      <EditPositionModal
        opened={!!editTarget}
        onClose={() => setEditTarget(null)}
        position={editTarget}
        onSubmit={(payload) => editTarget && handleUpdate(editTarget, payload)}
      />

      <PortfolioDetailsModal
        opened={portfolioDetailsOpened}
        onClose={() => setPortfolioDetailsOpened(false)}
        account={account}
      />
    </div>
  )
}
