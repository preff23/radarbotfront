import React, { useState, useEffect } from 'react'
import {
  IconDiamond, 
  IconPlus, 
  IconLogout,
  IconWallet,
  IconCoins,
  IconEdit, 
  IconTrash, 
  IconStar,
  IconMinus
} from '@tabler/icons-react'
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

// API functions
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
    const response = await fetch(`/api/portfolio/position?phone=${encodeURIComponent(phone)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(position)
    })
    if (!response.ok) throw new Error('Failed to add position')
    return await response.json()
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
function AssetCard({ position, onEdit, onDelete }) {
  return (
    <div className="card asset-card">
      <div className="asset-card__header">
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
              onClick={() => onEdit(position)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Удалить">
            <ActionIcon
              className="btn btn--ghost btn--icon"
              onClick={() => onDelete(position)}
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
    </div>
  )
}

// Asset List Component
function AssetList({ account, onEdit, onDelete }) {
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
    name: '',
    ticker: '',
    quantity: 1,
    security_type: 'bond',
    isin: '',
    provider: 'manual'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
      setFormData({
        name: '',
        ticker: '',
        quantity: 1,
        security_type: 'bond',
        isin: '',
        provider: 'manual'
      })
    onClose()
    } catch (error) {
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
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
        <TextInput
          label="Название"
            placeholder="ОФЗ 26207"
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
            placeholder="SU26207RMFS6"
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
            placeholder="RU000A0JX0J2"
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
              Добавить
            </Button>
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
    try {
      await addPosition(position, userPhone)
      await loadPortfolio()
      notifications.show({
        title: 'Успешно',
        message: 'Позиция добавлена',
        color: 'green'
      })
    } catch (error) {
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

  // Get the first account (manual portfolio)
  const account = data?.accounts?.[0]
  const userPhoneMasked = userPhone ? userPhone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5') : ''

  return (
    <div className="app">
      <header className="tg-header">
        <div className="hdr-left">
          <div className="hdr-caption">Аккаунт:</div>
          <div className="hdr-phone">{userPhoneMasked || 'Загрузка...'}</div>
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

      <section className="hero-wrap">
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
          <PortfolioHero account={account} />
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
      </section>

      <main className="scroll-area">
        {data && account && (
          <AssetList
            account={account}
            onEdit={(pos) => setEditTarget(pos)}
            onDelete={handleDelete}
          />
        )}
      </main>

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
    </div>
  )
}
