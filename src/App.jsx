import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  AppShell,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  NumberInput,
  ScrollArea,
  Select,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  Transition,
  Paper,
  Divider,
  Tooltip,
  Avatar,
  Progress,
  Container,
  Center,
  Grid,
  ThemeIcon,
  RingProgress,
  Skeleton,
  Flex,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { Notifications, notifications } from '@mantine/notifications'
import { 
  IconPlus, 
  IconTrash, 
  IconRefresh, 
  IconSearch, 
  IconEdit, 
  IconTrendingUp, 
  IconTrendingDown, 
  IconMinus, 
  IconPhone, 
  IconLogin, 
  IconLogout,
  IconWallet,
  IconChartLine,
  IconCoins,
  IconDiamond,
  IconStar,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconSettings,
  IconX
} from '@tabler/icons-react'
import './App.css'
import { MINIAPP_REV } from './version' 

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

// Get real user data from Telegram WebApp
function getUserData() {
  const tg = window?.Telegram?.WebApp
  console.log('=== Telegram WebApp Debug ===')
  console.log('Telegram WebApp object:', tg)
  console.log('initDataUnsafe:', tg?.initDataUnsafe)
  console.log('user:', tg?.initDataUnsafe?.user)
  console.log('initData:', tg?.initData)
  console.log('================================')
  
  // Try to get user data from Telegram WebApp
  let user = null
  if (tg?.initDataUnsafe?.user) {
    user = tg.initDataUnsafe.user
    console.log('Using initDataUnsafe.user:', user)
  } else if (tg?.initData) {
    try {
      const urlParams = new URLSearchParams(tg.initData)
      const userParam = urlParams.get('user')
      if (userParam) {
        user = JSON.parse(decodeURIComponent(userParam))
        console.log('Parsed user from initData:', user)
      }
    } catch (e) {
      console.error('Error parsing initData:', e)
    }
  }

  // If we have user data from Telegram, use it
  if (user && user.id) {
    return {
      telegram_id: String(user.id),
      phone: user.phone_number || null,
      username: user.username || 'user'
    }
  }

  // Fallback: use data from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const tgId = urlParams.get('tg_id') || urlParams.get('telegram_id')
  const phone = urlParams.get('phone') || urlParams.get('phone_number')
  
  if (tgId && phone) {
    console.log('Using URL parameters:', { tgId, phone })
    return {
      telegram_id: String(tgId),
      phone: phone,
      username: 'user'
    }
  }

  // Last resort: return null to show login form
  console.log('No user data available, showing login form')
  return null
}

async function apiRequest(path, options = {}, userPhone = null) {
  const userData = getUserData()
  
  // Use userPhone from state if provided, otherwise try Telegram data
  const phone = userPhone || userData?.phone
  const telegramId = userData?.telegram_id
  
  if (!phone) {
    throw new Error('User not authenticated')
  }
  
  const headers = new Headers(options.headers || {})
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  
  // Use phone from parameter or Telegram data
  if (telegramId) {
    headers.set('X-Telegram-Id', telegramId)
  }
  headers.set('X-User-Phone', phone)
  
  const tg = window?.Telegram?.WebApp
  if (tg && typeof tg.ready === 'function') { 
    try { tg.ready(); } catch (_) {} 
  }
  
  const base = (API_BASE_URL && !API_BASE_URL.startsWith('http:') ? API_BASE_URL : '');
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;
  const url = new URL((base || "") + apiPath, window.location.origin);
  
  // Add user data to query params for proxy compatibility
  try { 
    url.searchParams.set('tg_id', userData.telegram_id)
    url.searchParams.set('phone', userData.phone)
  } catch (_) {}
  
  window.__LAST_API_URL__ = url.toString();
  window.__USER_DATA__ = userData; // For debugging
  
  const response = await fetch(url.toString(), {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${text || 'API request failed'} [${response.status}] ${url?.toString?.() || ''}`)
  }
  
  if (response.status === 204) {
    return null
  }
  
  return response.json()
}

function usePortfolio(userPhone = null) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    if (!userPhone) return
    
    setLoading(true)
    setError(null)
    try {
      const result = await apiRequest('/api/portfolio', {}, userPhone)
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userPhone])

  const refresh = async () => {
    await fetchData()
    notifications.show({ message: 'Портфель обновлён', color: 'green' })
  }

  return { data, loading, error, refresh }
}

function PhoneConfirmationForm({ detectedPhone, onConfirm, onReject }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return

    console.log('=== PHONE CONFIRMATION FORM SUBMIT ===')
    console.log('Original phone input:', phone)
    setLoading(true)
    try {
      // Normalize phone number - remove all non-digits first
      let digitsOnly = phone.replace(/\D/g, '')
      let normalizedPhone = ''
      
      // Handle different formats
      if (digitsOnly.length === 10) {
        // 9151731545 -> +79151731545
        normalizedPhone = '+7' + digitsOnly
      } else if (digitsOnly.length === 11) {
        if (digitsOnly.startsWith('8')) {
          // 89151731545 -> +79151731545
          normalizedPhone = '+7' + digitsOnly.substring(1)
        } else if (digitsOnly.startsWith('7')) {
          // 79151731545 -> +79151731545
          normalizedPhone = '+' + digitsOnly
        } else {
          // Other 11 digits -> +7 + digits
          normalizedPhone = '+7' + digitsOnly
        }
      } else if (digitsOnly.length === 9) {
        // 915173154 -> +7915173154 (incomplete number, but let's try)
        normalizedPhone = '+7' + digitsOnly
      } else {
        // Fallback - just add +7
        normalizedPhone = '+7' + digitsOnly
      }
      
      console.log('Original phone:', phone)
      console.log('Digits only:', digitsOnly)
      console.log('Normalized phone:', normalizedPhone)

      // Try to find user by phone
      console.log('Trying to login with phone:', normalizedPhone)
      const response = await fetch(`/api/portfolio?phone=${encodeURIComponent(normalizedPhone)}`)
      
      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response text:', responseText)
      
      if (response.ok) {
        onConfirm(normalizedPhone)
        notifications.show({ message: 'Вход выполнен успешно', color: 'green' })
      } else {
        try {
          const errorData = JSON.parse(responseText)
          notifications.show({ message: `Ошибка: ${errorData.detail || 'Пользователь не найден'}`, color: 'red' })
        } catch {
          notifications.show({ message: 'Пользователь с таким номером не найден. Зарегистрируйтесь в боте.', color: 'red' })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      notifications.show({ message: `Ошибка при входе: ${error.message}`, color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Center>
        <Card shadow="sm" padding="xl" radius="md" withBorder style={{ width: '100%', maxWidth: 400 }}>
          <Stack gap="md" align="center">
            <Avatar size="xl" color="blue" variant="light">
              <IconPhone size={32} />
            </Avatar>
            <Title order={2} ta="center">Подтвердите номер телефона</Title>
            <Text size="sm" c="dimmed" ta="center">
              Мы определили ваш номер как <Text fw={600} c="blue">{detectedPhone}</Text>
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Это ваш номер телефона?
            </Text>
            
            <Group gap="md" justify="center">
              <Button
                color="green"
                leftSection={<IconPhone size={16} />}
                onClick={() => onConfirm(detectedPhone)}
              >
                Да, это мой номер
              </Button>
              <Button
                variant="outline"
                color="red"
                onClick={onReject}
              >
                Нет, другой номер
              </Button>
            </Group>
            
            <Divider label="Или введите другой номер" labelPosition="center" />
            
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Stack gap="md">
                <TextInput
                  label="Номер телефона"
                  placeholder="8 915 173 15 45 или +79151731545"
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  leftSection={<IconPhone size={16} />}
                  description="Принимаются любые форматы: 8 915 173 15 45, 79151731545, +79151731545"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  leftSection={<IconLogin size={16} />}
                  loading={loading}
                >
                  Войти с этим номером
                </Button>
              </Stack>
            </form>
            
            <Text size="xs" c="dimmed" ta="center">
              Если вы еще не регистрировались, отправьте /start боту
            </Text>
          </Stack>
        </Card>
      </Center>
    </Container>
  )
}

function LoginForm({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    console.log('=== HANDLE SUBMIT CALLED ===')
    console.log('Event:', e)
    console.log('Phone before preventDefault:', phone)
    
    e.preventDefault()
    
    console.log('After preventDefault')
    console.log('Phone trim check:', phone.trim())
    
    if (!phone.trim()) {
      console.log('Phone is empty, returning')
      return
    }

    console.log('=== LOGIN FORM SUBMIT ===')
    console.log('Original phone input:', phone)
    setLoading(true)
    try {
      // Normalize phone number - remove all non-digits first
      let digitsOnly = phone.replace(/\D/g, '')
      let normalizedPhone = ''
      
      // Handle different formats
      if (digitsOnly.length === 10) {
        // 9151731545 -> +79151731545
        normalizedPhone = '+7' + digitsOnly
      } else if (digitsOnly.length === 11) {
        if (digitsOnly.startsWith('8')) {
          // 89151731545 -> +79151731545
          normalizedPhone = '+7' + digitsOnly.substring(1)
        } else if (digitsOnly.startsWith('7')) {
          // 79151731545 -> +79151731545
          normalizedPhone = '+' + digitsOnly
        } else {
          // Other 11 digits -> +7 + digits
          normalizedPhone = '+7' + digitsOnly
        }
      } else if (digitsOnly.length === 9) {
        // 915173154 -> +7915173154 (incomplete number, but let's try)
        normalizedPhone = '+7' + digitsOnly
      } else {
        // Fallback - just add +7
        normalizedPhone = '+7' + digitsOnly
      }
      
      console.log('Original phone:', phone)
      console.log('Digits only:', digitsOnly)
      console.log('Normalized phone:', normalizedPhone)

      // Try to find user by phone
      console.log('Trying to login with phone:', normalizedPhone)
      const response = await fetch(`/api/portfolio?phone=${encodeURIComponent(normalizedPhone)}`)
      
      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response text:', responseText)
      
      if (response.ok) {
        onLogin(normalizedPhone)
        notifications.show({ message: 'Вход выполнен успешно', color: 'green' })
      } else {
        try {
          const errorData = JSON.parse(responseText)
          notifications.show({ message: `Ошибка: ${errorData.detail || 'Пользователь не найден'}`, color: 'red' })
        } catch {
          notifications.show({ message: 'Пользователь с таким номером не найден. Зарегистрируйтесь в боте.', color: 'red' })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      notifications.show({ message: `Ошибка при входе: ${error.message}`, color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Center>
        <Card shadow="sm" padding="xl" radius="md" withBorder style={{ width: '100%', maxWidth: 400 }}>
          <Stack gap="md" align="center">
            <Avatar size="xl" color="blue" variant="light">
              <IconPhone size={32} />
            </Avatar>
            <Title order={2} ta="center">Вход в Radar портфель</Title>
            <Text size="sm" c="dimmed" ta="center">
              Введите номер телефона, который вы использовали при регистрации в боте
            </Text>
            
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Stack gap="md">
                <TextInput
                  label="Номер телефона"
                  placeholder="8 915 173 15 45 или +79151731545"
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  leftSection={<IconPhone size={16} />}
                  description="Принимаются любые форматы: 8 915 173 15 45, 79151731545, +79151731545"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  leftSection={<IconLogin size={16} />}
                  loading={loading}
                >
                  Войти
                </Button>
              </Stack>
            </form>
            
            <Text size="xs" c="dimmed" ta="center">
              Если вы еще не регистрировались, отправьте /start боту
            </Text>
          </Stack>
        </Card>
      </Center>
    </Container>
  )
}

function AccountTabs({ accounts, active, onChange }) {
  // Убираем табы аккаунтов - используем только один портфель
  return null
}

function PortfolioTable({ account, onEdit, onDelete }) {
  const theme = useMantineTheme()
  
  if (!account) {
    return (
      <Card 
        p="xl" 
        radius="xl" 
        style={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white'
        }}
      >
        <Stack gap="lg" align="center">
          <ThemeIcon size={80} radius="xl" variant="light" color="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <IconWallet size={40} />
          </ThemeIcon>
          <Stack gap="xs">
            <Text size="xl" fw={700} c="white">Портфель пуст</Text>
            <Text size="md" c="rgba(255,255,255,0.8)">
              Добавьте ценные бумаги, чтобы начать отслеживать свой портфель
            </Text>
          </Stack>
        </Stack>
      </Card>
    )
  }

  const getSecurityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bond': return <IconChartLine size={20} />
      case 'stock': return <IconTrendingUp size={20} />
      case 'etf': return <IconCoins size={20} />
      default: return <IconDiamond size={20} />
    }
  }

  const getSecurityColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'bond': return 'blue'
      case 'stock': return 'green'
      case 'etf': return 'purple'
      default: return 'gray'
    }
  }

  return (
    <ScrollArea style={{ height: '65vh' }} scrollbarSize={6}>
      <Grid gutter="md">
        {account.positions.map((position, index) => (
          <Grid.Col key={position.id} span={12}>
            <Transition
              mounted={true}
              transition="slide-up"
              duration={300}
              timingFunction="ease-out"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {(styles) => (
                <Card
                  shadow="xl"
                  padding="lg"
                  radius="2xl"
                  style={{
                    ...styles,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.6) 100%)',
                    border: '1px solid rgba(0, 212, 170, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 212, 170, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.2)'
                  }}
                >
                  {/* Неоновая полоса сверху */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${theme.colors[getSecurityColor(position.security_type)][6]} 0%, ${theme.colors[getSecurityColor(position.security_type)][4]} 100%)`,
                      borderRadius: '16px 16px 0 0',
                      boxShadow: `0 0 10px ${theme.colors[getSecurityColor(position.security_type)][4]}40`
                    }}
                  />
                  
                  <Stack gap="md">
                    {/* Верхняя строка: иконка + название + количество */}
                    <Flex gap="md" align="flex-start">
                      <Box
                        style={{
                          width: '48px',
                          height: '48px',
                          background: `linear-gradient(135deg, rgba(${theme.colors[getSecurityColor(position.security_type)][6].replace('#', '').match(/.{2}/g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2) 0%, rgba(${theme.colors[getSecurityColor(position.security_type)][4].replace('#', '').match(/.{2}/g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1) 100%)`,
                          borderRadius: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 8px 20px ${theme.colors[getSecurityColor(position.security_type)][4]}40, 0 0 15px ${theme.colors[getSecurityColor(position.security_type)][4]}20`,
                          flexShrink: 0,
                          border: `1px solid ${theme.colors[getSecurityColor(position.security_type)][4]}40`,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        {getSecurityIcon(position.security_type)}
                      </Box>
                      
                      <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={700} size="lg" c="white" style={{ 
                          wordBreak: 'break-word',
                          lineHeight: 1.2,
                          maxHeight: '2.4em',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          letterSpacing: '-0.01em',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                          {position.name}
                        </Text>
                        
                        <Flex gap="sm" align="center" wrap="wrap">
                          <Flex gap="xs" align="center">
                            <Box
                              style={{
                                width: '20px',
                                height: '20px',
                                background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 160, 133, 0.2) 100%)',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(0, 212, 170, 0.4)',
                                boxShadow: '0 0 8px rgba(0, 212, 170, 0.3)'
                              }}
                            >
                              <IconCoins size={12} color="#00d4aa" />
                            </Box>
                            <Text fw={600} size="md" c="#00d4aa" style={{ 
                              letterSpacing: '-0.01em',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}>
                              {position.quantity || 0} {position.quantity_unit || 'шт'}
                            </Text>
                          </Flex>
                        </Flex>
                      </Stack>
                      
                      <Flex gap="xs">
                        <Tooltip label="Редактировать" position="top">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="md"
                            radius="xl"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(position)
                            }}
                            style={{ 
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 8px rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Удалить" position="top">
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="md"
                            radius="xl"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(position)
                            }}
                            style={{ 
                              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(238, 90, 82, 0.1) 100%)',
                              border: '1px solid rgba(255, 107, 107, 0.4)',
                              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3), 0 0 8px rgba(255, 107, 107, 0.1)',
                              color: '#ff6b6b',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Flex>
                    </Flex>
                    
                    {/* Нижняя строка: бейджи и дополнительная информация */}
                    <Flex gap="xs" align="center" wrap="wrap">
                      {position.ticker && (
                        <Box
                          style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            boxShadow: '0 0 8px rgba(59, 130, 246, 0.2)',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Text size="sm" fw={700} c="#3b82f6" style={{ 
                            letterSpacing: '0.01em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                          }}>
                            {position.ticker}
                          </Text>
                        </Box>
                      )}
                      {position.security_type && (
                        <Box
                          style={{
                            background: `linear-gradient(135deg, rgba(${theme.colors[getSecurityColor(position.security_type)][6].replace('#', '').match(/.{2}/g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2) 0%, rgba(${theme.colors[getSecurityColor(position.security_type)][4].replace('#', '').match(/.{2}/g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1) 100%)`,
                            border: `1px solid ${theme.colors[getSecurityColor(position.security_type)][4]}40`,
                            borderRadius: '10px',
                            padding: '6px 12px',
                            boxShadow: `0 0 8px ${theme.colors[getSecurityColor(position.security_type)][4]}20`,
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Text size="sm" fw={700} c={getSecurityColor(position.security_type)} style={{ 
                            letterSpacing: '0.01em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                          }}>
                            {position.security_type}
                          </Text>
                        </Box>
                      )}
                      {position.fallback && (
                        <Box
                          style={{
                            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(245, 101, 101, 0.1) 100%)',
                            border: '1px solid rgba(251, 146, 60, 0.4)',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            boxShadow: '0 0 8px rgba(251, 146, 60, 0.2)',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Flex gap="xs" align="center">
                            <IconStar size={12} color="#fb923c" />
                            <Text size="sm" fw={700} c="#fb923c" style={{ 
                              letterSpacing: '0.01em',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}>
                              Fallback
                            </Text>
                          </Flex>
                        </Box>
                      )}
                      {position.provider && (
                        <Box
                          style={{
                            background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(75, 85, 99, 0.1) 100%)',
                            border: '1px solid rgba(107, 114, 128, 0.4)',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            boxShadow: '0 0 8px rgba(107, 114, 128, 0.2)',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <Text size="sm" fw={600} c="#6b7280" style={{ 
                            letterSpacing: '0.01em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                          }}>
                            {position.provider}
                          </Text>
                        </Box>
                      )}
                      {position.isin && (
                        <Text size="sm" c="rgba(255,255,255,0.6)" style={{ 
                          fontFamily: 'monospace', 
                          letterSpacing: '0.02em',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          {position.isin}
                        </Text>
                      )}
                    </Flex>
                  </Stack>
                </Card>
              )}
            </Transition>
          </Grid.Col>
        ))}
      </Grid>
    </ScrollArea>
  )
}

function AddPositionModal({ opened, onClose, accounts, onSubmit, userPhone }) {
  const [tab, setTab] = useState('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [form, setForm] = useState({
    account: 'manual', // Всегда используем manual аккаунт
    name: '',
    ticker: '',
    isin: '',
    quantity: 1,
    quantity_unit: 'шт',
  })

  useEffect(() => {
    if (!opened) {
      setTab('search')
      setSearchTerm('')
      setSearchResults([])
      setSearchLoading(false)
      setForm({
        account: 'manual', // Всегда используем manual аккаунт
        name: '',
        ticker: '',
        isin: '',
        quantity: 1,
        quantity_unit: 'шт',
      })
    }
  }, [opened, accounts])

  const runSearch = async () => {
    console.log('=== RUN SEARCH ===')
    console.log('Search term:', searchTerm)
    console.log('User phone:', userPhone)
    
    if (!searchTerm.trim()) {
      console.log('Search term is empty, returning')
      return
    }
    
    setSearchLoading(true)
    try {
      const url = `/api/portfolio/search?query=${encodeURIComponent(searchTerm.trim())}`
      console.log('Search URL:', url)
      
      const result = await apiRequest(url, {}, userPhone)
      console.log('Search result:', result)
      
      setSearchResults(result.results || [])
    } catch (err) {
      console.error('Search error:', err)
      notifications.show({ message: 'Не удалось выполнить поиск', color: 'red' })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectSearchResult = (item) => {
    setForm((prev) => ({
      ...prev,
      name: item.name || prev.name,
      ticker: item.ticker || prev.ticker,
      isin: item.isin || prev.isin,
      quantity: item.quantity ?? prev.quantity,
      quantity_unit: item.quantity_unit || prev.quantity_unit,
    }))
    setTab('manual')
  }

  const handleSubmit = async () => {
    console.log('=== ADD POSITION SUBMIT ===')
    console.log('Form data:', form)
    console.log('Accounts:', accounts)
    
    const accountMeta = accounts.find((acc) => acc.value === form.account)
    console.log('Account meta:', accountMeta)
    
    const payload = {
      account_id: accountMeta?.account_id || 'manual',
      account_name: accountMeta?.label,
      name: form.name,
      ticker: form.ticker,
      isin: form.isin,
      quantity: form.quantity,
      quantity_unit: form.quantity_unit,
    }
    
    console.log('Payload to send:', payload)
    
    try {
      await onSubmit(payload)
    onClose()
    } catch (error) {
      console.error('Error submitting position:', error)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Добавить бумагу" size="lg" centered>
      <Stack>
        <SegmentedControl
          fullWidth
          value={tab}
          onChange={setTab}
          data={[
            { label: 'Поиск', value: 'search' },
            { label: 'Вручную', value: 'manual' },
          ]}
        />

        {tab === 'search' && (
          <Stack>
            <TextInput
              label="Поиск бумаги"
              placeholder="Введите тикер или название"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              rightSection={<IconSearch size={16} />}
            />
            <Group>
              <Button onClick={runSearch} loading={searchLoading} leftSection={<IconSearch size={16} />}>
                Найти
              </Button>
              <Button variant="subtle" onClick={() => setTab('manual')}>
                Перейти к ручному вводу
              </Button>
            </Group>
            <Stack gap="sm">
              {searchResults.map((item) => (
                <Box
                  key={`${item.ticker || item.isin || item.name}`}
                  p="sm"
                  style={{
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSelectSearchResult(item)}
                >
                  <Group justify="space-between">
                    <Stack gap={2}>
                      <Text fw={500}>{item.name || 'Без названия'}</Text>
                      {item.description && <Text size="sm" c="dimmed">{item.description}</Text>}
                    </Stack>
                    <Group gap="xs">
                      {item.ticker && <Badge color="blue" variant="light">{item.ticker}</Badge>}
                      {item.isin && <Badge color="gray" variant="light">{item.isin}</Badge>}
                    </Group>
                  </Group>
                </Box>
              ))}
            </Stack>
          </Stack>
        )}

        {tab === 'manual' && (
          <Stack>
        <TextInput
          label="Название"
          placeholder="Например, Газпром"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.currentTarget.value }))}
        />
        <TextInput
          label="Тикер"
          placeholder="GAZP"
          value={form.ticker}
          onChange={(event) => setForm((prev) => ({ ...prev, ticker: event.currentTarget.value }))}
        />
        <TextInput
          label="ISIN"
          placeholder="RU000A0JXE06"
          value={form.isin}
          onChange={(event) => setForm((prev) => ({ ...prev, isin: event.currentTarget.value }))}
        />
        <NumberInput
          label="Количество"
          min={0}
          decimalScale={2}
          value={form.quantity}
          onChange={(value) => setForm((prev) => ({ ...prev, quantity: Number(value) }))}
        />
        <TextInput
          label="Единица измерения"
          value={form.quantity_unit}
          onChange={(event) => setForm((prev) => ({ ...prev, quantity_unit: event.currentTarget.value }))}
        />
          </Stack>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Отменить</Button>
          <Button onClick={handleSubmit} leftSection={<IconPlus size={16} />}>Сохранить</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function EditPositionModal({ opened, onClose, position, onSubmit }) {
  const [quantity, setQuantity] = useState(position?.quantity ?? 0)
  const [unit, setUnit] = useState(position?.quantity_unit || 'шт')

  useEffect(() => {
    if (opened && position) {
      setQuantity(position.quantity ?? 0)
      setUnit(position.quantity_unit || 'шт')
    }
  }, [opened, position])

  const handleSubmit = async () => {
    await onSubmit({ quantity, quantity_unit: unit })
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Редактировать позицию" centered>
      <Stack>
        <Text>{position?.name}</Text>
        <NumberInput
          label="Количество"
          min={0}
          decimalScale={2}
          value={quantity}
          onChange={(value) => setQuantity(Number(value))}
        />
        <TextInput
          label="Единица измерения"
          value={unit}
          onChange={(event) => setUnit(event.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Отменить</Button>
          <Button onClick={handleSubmit}>Сохранить</Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default function App() {
  console.log('App component rendering...')
  
  const [userPhone, setUserPhone] = useState(null)
  const [showPhoneConfirmation, setShowPhoneConfirmation] = useState(false)
  const [detectedPhone, setDetectedPhone] = useState(null)

  const handleLogout = () => {
    setUserPhone(null)
    setShowPhoneConfirmation(false)
    setDetectedPhone(null)
    notifications.show({ message: 'Вы вышли из профиля', color: 'blue' })
  }
  
  // Check if user is authenticated
  const telegramData = getUserData()
  const isAuthenticated = userPhone || (telegramData && !showPhoneConfirmation)
  
  console.log('=== AUTH DEBUG ===')
  console.log('userPhone:', userPhone)
  console.log('telegramData:', telegramData)
  console.log('showPhoneConfirmation:', showPhoneConfirmation)
  console.log('isAuthenticated:', isAuthenticated)
  console.log('==================')

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = window?.Telegram?.WebApp
    if (tg) {
      console.log('Initializing Telegram WebApp...')
      tg.ready()
      tg.expand()
      console.log('Telegram WebApp initialized')
    }
  }, [])

  // Check if we need to show phone confirmation
  useEffect(() => {
    if (telegramData && !userPhone && !showPhoneConfirmation) {
      setDetectedPhone(telegramData.phone)
      setShowPhoneConfirmation(true)
    }
  }, [telegramData, userPhone, showPhoneConfirmation])
  
  const { data, loading, error, refresh } = usePortfolio(userPhone)
  const accounts = useMemo(() => {
    if (!data?.accounts) return []
    // Всегда используем только manual аккаунт
    const manualAccount = data.accounts.find(acc => acc.account_id === 'manual')
    if (manualAccount) {
      return [{
        value: 'manual',
        account_id: 'manual',
        label: 'Портфель',
        raw: manualAccount,
      }]
    }
    return []
  }, [data])

  const [activeAccount, setActiveAccount] = useState('manual')
  const [addOpened, setAddOpened] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  useEffect(() => {
    if (accounts.length > 0 && !accounts.some((acc) => acc.value === activeAccount)) {
      setActiveAccount('manual')
    }
  }, [accounts, activeAccount])

  const currentAccount = useMemo(() => {
    if (accounts.length === 0) return null
    const meta = accounts.find((acc) => acc.value === 'manual') || accounts[0]
    return meta.raw
  }, [accounts, activeAccount])

  const handleAdd = async (payload) => {
    try {
      await apiRequest('/api/portfolio/position', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, userPhone)
      notifications.show({ message: 'Позиция добавлена', color: 'green' })
      refresh()
    } catch (err) {
      notifications.show({ message: err.message, color: 'red' })
    }
  }

  const handleDelete = async (position) => {
    try {
      await apiRequest(`/api/portfolio/position/${position.id}`, { method: 'DELETE' }, userPhone)
      notifications.show({ message: 'Позиция удалена', color: 'green' })
      refresh()
    } catch (err) {
      notifications.show({ message: err.message, color: 'red' })
    }
  }

  const handleUpdate = async (position, payload) => {
    try {
      await apiRequest(`/api/portfolio/position/${position.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }, userPhone)
      notifications.show({ message: 'Позиция обновлена', color: 'green' })
      refresh()
    } catch (err) {
      notifications.show({ message: err.message, color: 'red' })
    }
  }

  // Show phone confirmation form if Telegram data is available
  if (showPhoneConfirmation && detectedPhone) {
  return (
      <Stack style={{ minHeight: '100vh' }}>
        <AppShell
          padding="md"
          header={{ height: 64 }}
          styles={{ main: { backgroundColor: 'var(--mantine-color-body)' } }}
        >
          <AppShell.Header
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderBottom: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <Group justify="center" px="md" py="md">
              <Group gap="sm" align="center">
                <Avatar
                  size="md"
                  color="white"
                  variant="filled"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  📊
                </Avatar>
                <Stack gap={0}>
                  <Title order={3} c="white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Radar портфель
                  </Title>
                  <Text size="xs" c="rgba(255,255,255,0.8)">
                    Подтверждение номера
                  </Text>
                </Stack>
              </Group>
            </Group>
          </AppShell.Header>
          <AppShell.Main>
            <PhoneConfirmationForm 
              detectedPhone={detectedPhone}
              onConfirm={(phone) => {
                setUserPhone(phone)
                setShowPhoneConfirmation(false)
              }}
              onReject={() => {
                setShowPhoneConfirmation(false)
              }}
            />
          </AppShell.Main>
        </AppShell>
      </Stack>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <Stack style={{ minHeight: '100vh' }}>
        <AppShell
          padding="md"
          header={{ height: 64 }}
          styles={{ main: { backgroundColor: 'var(--mantine-color-body)' } }}
        >
          <AppShell.Header
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderBottom: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <Group justify="center" px="md" py="md">
              <Group gap="sm" align="center">
                <Avatar
                  size="md"
                  color="white"
                  variant="filled"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  📊
                </Avatar>
                <Stack gap={0}>
                  <Title order={3} c="white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Radar портфель
                  </Title>
                  <Text size="xs" c="rgba(255,255,255,0.8)">
                    Вход в систему
                  </Text>
                </Stack>
              </Group>
            </Group>
          </AppShell.Header>
          <AppShell.Main>
            <LoginForm onLogin={setUserPhone} />
          </AppShell.Main>
        </AppShell>
      </Stack>
    )
  }

  return (
    <Stack style={{ minHeight: '100vh' }}>
      <AppShell
        padding="md"
        header={{ height: 80 }}
        styles={{ 
          main: { 
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            minHeight: '100vh'
          } 
        }}
      >
        <AppShell.Header
          style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            borderBottom: '1px solid rgba(0, 212, 170, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 212, 170, 0.1)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Неоновые декоративные элементы */}
          <Box
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(0, 212, 170, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(20px)'
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '60px',
              height: '60px',
              background: 'radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(15px)'
            }}
          />
          
          <Container size="xl" h="100%" px="lg" py="lg" style={{ position: 'relative', zIndex: 1 }}>
            <Flex justify="space-between" align="center" h="100%" wrap="wrap" gap="sm">
              {/* Левая часть - брендинг */}
              <Flex align="center" gap="md" style={{ minWidth: 0, flex: 1 }}>
                <Box
                  style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 160, 133, 0.1) 100%)',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 212, 170, 0.3)',
                    boxShadow: '0 8px 24px rgba(0, 212, 170, 0.3), 0 0 20px rgba(0, 212, 170, 0.1)',
                    flexShrink: 0
                  }}
                >
                  <IconDiamond size={28} color="#00d4aa" />
                </Box>
                <Stack gap="xs" style={{ minWidth: 0, flex: 1 }}>
                  <Text 
                    size="xl" 
                    fw={900} 
                    c="white" 
                    style={{ 
                      letterSpacing: '-0.01em',
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      lineHeight: 1.1
                    }}
                  >
                    Radar портфель
                  </Text>
                  <Text 
                    size="sm" 
                    c="rgba(255,255,255,0.7)" 
                    fw={500}
                    style={{ letterSpacing: '0.01em' }}
                  >
                    {data?.user ? `Аккаунт: ${data.user.phone || data.user.telegram_id || 'не определен'}` : 'Загрузка...'}
                  </Text>
                </Stack>
              </Flex>
              
              {/* Правая часть - кнопки */}
              <Flex gap="sm" align="center" wrap="nowrap">
                <Button
                  variant="filled"
                  size="md"
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setAddOpened(true)}
                  radius="xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 160, 133, 0.1) 100%)',
                    border: '1px solid rgba(0, 212, 170, 0.4)',
                    color: '#00d4aa',
                    fontWeight: '700',
                    fontSize: '14px',
                    height: '44px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    boxShadow: '0 8px 24px rgba(0, 212, 170, 0.3), 0 0 20px rgba(0, 212, 170, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00a085 0%, #007a6b 100%)'
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 212, 170, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #00d4aa 0%, #00a085 100%)'
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 212, 170, 0.4)'
                  }}
                >
                  Добавить
                </Button>
                <Button
                  variant="filled"
                  size="md"
                  leftSection={<IconLogout size={18} />}
                  onClick={handleLogout}
                  radius="xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(238, 90, 82, 0.1) 100%)',
                    border: '1px solid rgba(255, 107, 107, 0.4)',
                    color: '#ff6b6b',
                    fontWeight: '700',
                    fontSize: '14px',
                    height: '44px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3), 0 0 20px rgba(255, 107, 107, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ee5a52 0%, #e74c3c 100%)'
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 107, 107, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)'
                  }}
                >
                  Выйти
                </Button>
              </Flex>
            </Flex>
          </Container>
        </AppShell.Header>
        <AppShell.Main>
          <Notifications position="top-center" />
          <Container size="xl" px="lg" py="lg">
            {loading && (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="xl" color="blue" />
                  <Text size="lg" fw={500} c="dimmed">Загрузка портфеля...</Text>
                </Stack>
              </Center>
            )}
            {error && (
              <Alert 
                color="red" 
                title="Ошибка" 
                icon={<IconX size={16} />}
                radius="xl"
                style={{ marginBottom: '1rem' }}
              >
                {error.message}
              </Alert>
            )}
            {!loading && !error && data && (
              <Stack gap="xl">
                <AccountTabs
                  accounts={accounts}
                  active={activeAccount}
                  onChange={setActiveAccount}
                />
                {currentAccount ? (
                  <Stack gap="md">
                    <Card 
                      shadow="xl" 
                      padding="xl" 
                      radius="2xl"
                      style={{
                        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 30%, #16213e 70%, #0f3460 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      {/* Декоративные элементы */}
                      <Box
                        style={{
                          position: 'absolute',
                          top: '-40px',
                          right: '-40px',
                          width: '80px',
                          height: '80px',
                          background: 'radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)',
                          borderRadius: '50%'
                        }}
                      />
                      <Box
                        style={{
                          position: 'absolute',
                          bottom: '-30px',
                          left: '-30px',
                          width: '60px',
                          height: '60px',
                          background: 'radial-gradient(circle, rgba(255,107,107,0.1) 0%, transparent 70%)',
                          borderRadius: '50%'
                        }}
                      />
                      
                      <Stack gap="xl" style={{ position: 'relative', zIndex: 1 }}>
                        <Flex align="center" gap="lg">
                          <Box
                            style={{
                              width: '64px',
                              height: '64px',
                              background: 'linear-gradient(135deg, rgba(0,212,170,0.2) 0%, rgba(0,160,133,0.1) 100%)',
                              borderRadius: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(0,212,170,0.3)',
                              boxShadow: '0 10px 30px rgba(0,212,170,0.2)',
                              flexShrink: 0
                            }}
                          >
                            <IconWallet size={32} color="white" />
                          </Box>
                          <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
                            <Text size="2xl" fw={900} c="white" style={{ 
                              letterSpacing: '-0.01em',
                              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                              lineHeight: 1.1
                            }}>
                              Портфель
                            </Text>
                            <Text size="md" c="rgba(255,255,255,0.8)" fw={500} style={{ 
                              letterSpacing: '0.01em',
                              lineHeight: 1.4
                            }}>
                              Ваш инвестиционный профиль
                            </Text>
                          </Stack>
                        </Flex>
                        
                        <Flex gap="md" wrap="wrap" align="center">
                          <Box
                            style={{
                              background: 'rgba(0,212,170,0.15)',
                              border: '1px solid rgba(0,212,170,0.3)',
                              borderRadius: '14px',
                              padding: '8px 16px',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <Text size="sm" fw={700} c="white" style={{ letterSpacing: '0.01em' }}>
                              {currentAccount.currency || 'RUB'}
                            </Text>
                          </Box>
                          <Box
                            style={{
                              background: 'rgba(255,107,107,0.15)',
                              border: '1px solid rgba(255,107,107,0.3)',
                              borderRadius: '14px',
                              padding: '8px 16px',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <Text size="sm" fw={700} c="white" style={{ letterSpacing: '0.01em' }}>
                              {currentAccount.positions.length} бумаг
                            </Text>
                          </Box>
                        </Flex>
                        
                        {currentAccount.portfolio_value && (
                          <Stack gap="md" align="center">
                            <Text size="sm" c="rgba(255,255,255,0.7)" fw={600} style={{ 
                              letterSpacing: '0.01em',
                              textTransform: 'uppercase'
                            }}>
                              Общая стоимость
                            </Text>
                            <Text fw={900} size="3xl" c="white" style={{ 
                              textShadow: '0 4px 12px rgba(0,0,0,0.6)',
                              letterSpacing: '-0.01em',
                              lineHeight: 1
                            }}>
                              {currentAccount.portfolio_value.toLocaleString()} ₽
                            </Text>
                            <Text size="sm" c="rgba(255,255,255,0.6)" fw={500} style={{ 
                              letterSpacing: '0.01em',
                              textTransform: 'uppercase'
                            }}>
                              Текущая оценка
                            </Text>
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                    <PortfolioTable
                      account={currentAccount}
                      onEdit={(pos) => setEditTarget(pos)}
                      onDelete={handleDelete}
                    />
                  </Stack>
                ) : (
                  <Card
                    shadow="sm"
                    padding="xl"
                    radius="md"
                    withBorder
                    style={{ textAlign: 'center' }}
                  >
                    <Stack gap="md">
                      <Avatar size="xl" color="gray" variant="light">
                        <IconMinus size={32} />
                      </Avatar>
                      <Text size="lg" fw={500} c="dimmed">Портфель пуст</Text>
                      <Text size="sm" c="dimmed">Добавьте ценные бумаги для начала работы</Text>
                    </Stack>
                  </Card>
                )}
              </Stack>
            )}
          </Container>
        </AppShell.Main>
      </AppShell>
      <AddPositionModal
        opened={addOpened}
        onClose={() => setAddOpened(false)}
        accounts={accounts}
        onSubmit={handleAdd}
        userPhone={userPhone}
      />
      <EditPositionModal
        opened={!!editTarget}
        onClose={() => setEditTarget(null)}
        position={editTarget}
        onSubmit={(payload) => editTarget && handleUpdate(editTarget, payload)}
      />
    </Stack>
  )
}
