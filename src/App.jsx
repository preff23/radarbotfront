import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  AppShell,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  ScrollArea,
  Select,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Notifications, notifications } from '@mantine/notifications'
import { IconPlus, IconTrash, IconRefresh, IconSearch } from '@tabler/icons-react'
import './App.css'
import { MINIAPP_REV } from './version' 

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const DEV_TELEGRAM_ID = import.meta.env.VITE_DEV_TELEGRAM_ID || '1'
const DEV_PHONE = import.meta.env.VITE_DEV_PHONE || ''

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('X-Telegram-Id') && DEV_TELEGRAM_ID) {
    headers.set('X-Telegram-Id', DEV_TELEGRAM_ID)
  }
  if (!headers.has('X-User-Phone') && DEV_PHONE) {
    headers.set('X-User-Phone', DEV_PHONE)
  }
  const tg = (window?.Telegram)?.WebApp;
  const tgId = tg?.initDataUnsafe?.user?.id;
  const usedId = tgId || import.meta.env.VITE_DEV_TELEGRAM_ID || '1';
  if (!headers.has('X-Telegram-Id') && tgId) {
    headers.set('X-Telegram-Id', String(tgId));
  }
  if (tg && typeof tg.ready === 'function') { try { tg.ready(); } catch (_) {} }
  const base = (API_BASE_URL && !API_BASE_URL.startsWith('http:') ? API_BASE_URL : '');
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;
  const url = new URL((base || "") + apiPath, window.location.origin);
  try { url.searchParams.set('tg_id', String(usedId)); } catch (_) {}
  window.__LAST_API_URL__ = url.toString();
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

function usePortfolio() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiRequest('/api/portfolio')
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refresh = async () => {
    await fetchData()
    notifications.show({ message: 'Портфель обновлён', color: 'green' })
  }

  return { data, loading, error, refresh }
}

function AccountTabs({ accounts, active, onChange }) {
  if (!accounts || accounts.length === 0) {
    return null
  }

  const tabs = accounts.map((acc) => ({
    value: acc.value,
    label: acc.label,
  }))

  return (
    <SegmentedControl
      fullWidth
      value={active}
      onChange={onChange}
      data={tabs}
      color="teal"
    />
  )
}

function PortfolioTable({ account, onEdit, onDelete }) {
  if (!account) {
    return <Text>Портфель пуст</Text>
  }

  const rows = account.positions.map((position) => (
    <Table.Tr key={position.id}>
      <Table.Td>
        <Stack gap={2}>
          <Text fw={500}>{position.name}</Text>
          <Group gap="xs">
            {position.ticker && <Badge variant="light" color="blue">{position.ticker}</Badge>}
            {position.isin && <Badge variant="light" color="gray">{position.isin}</Badge>}
            {position.fallback && <Badge variant="light" color="yellow">Справочник</Badge>}
          </Group>
        </Stack>
      </Table.Td>
      <Table.Td>{position.security_type || '—'}</Table.Td>
      <Table.Td>{position.quantity ?? '—'}</Table.Td>
      <Table.Td>{position.quantity_unit || 'шт'}</Table.Td>
      <Table.Td>{position.provider || '—'}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={() => onEdit(position)}>
            Изменить
          </Button>
          <ActionIcon variant="light" color="red" onClick={() => onDelete(position)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Бумага</Table.Th>
            <Table.Th>Тип</Table.Th>
            <Table.Th>Количество</Table.Th>
            <Table.Th>Ед.</Table.Th>
            <Table.Th>Источник</Table.Th>
            <Table.Th>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  )
}

function AddPositionModal({ opened, onClose, accounts, onSubmit }) {
  const [tab, setTab] = useState('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [form, setForm] = useState({
    account: accounts[0]?.value || 'default',
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
        account: accounts[0]?.value || 'default',
        name: '',
        ticker: '',
        isin: '',
        quantity: 1,
        quantity_unit: 'шт',
      })
    }
  }, [opened, accounts])

  const runSearch = async () => {
    if (!searchTerm.trim()) return
    setSearchLoading(true)
    try {
      const result = await apiRequest(`/api/portfolio/search?query=${encodeURIComponent(searchTerm.trim())}`)
      setSearchResults(result.results || [])
    } catch (err) {
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
    const accountMeta = accounts.find((acc) => acc.value === form.account)
    await onSubmit({
      account_id: accountMeta?.account_id || 'default',
      account_name: accountMeta?.label,
      name: form.name,
      ticker: form.ticker,
      isin: form.isin,
      quantity: form.quantity,
      quantity_unit: form.quantity_unit,
    })
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Добавить бумагу" size="lg" centered>
      <Stack>
        <Select
          label="Счёт"
          data={accounts}
          value={form.account}
          onChange={(value) => setForm((prev) => ({ ...prev, account: value }))}
        />
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
  const { data, loading, error, refresh } = usePortfolio()
  const accounts = useMemo(() => {
    if (!data?.accounts) return []
    return data.accounts.map((acc) => ({
      value: acc.internal_id === null ? 'default' : String(acc.internal_id),
      account_id: acc.account_id,
      label: acc.account_name || `Счёт ${acc.account_id}`,
      raw: acc,
    }))
  }, [data])

  const [activeAccount, setActiveAccount] = useState('default')
  const [addOpened, setAddOpened] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  useEffect(() => {
    if (accounts.length > 0 && !accounts.some((acc) => acc.value === activeAccount)) {
      setActiveAccount(accounts[0].value)
    }
  }, [accounts, activeAccount])

  const currentAccount = useMemo(() => {
    if (accounts.length === 0) return null
    const meta = accounts.find((acc) => acc.value === activeAccount) || accounts[0]
    return meta.raw
  }, [accounts, activeAccount])

  const handleAdd = async (payload) => {
    try {
      await apiRequest('/api/portfolio/position', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      notifications.show({ message: 'Позиция добавлена', color: 'green' })
      refresh()
    } catch (err) {
      notifications.show({ message: err.message, color: 'red' })
    }
  }

  const handleDelete = async (position) => {
    try {
      await apiRequest(`/api/portfolio/position/${position.id}`, { method: 'DELETE' })
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
      })
      notifications.show({ message: 'Позиция обновлена', color: 'green' })
      refresh()
    } catch (err) {
      notifications.show({ message: err.message, color: 'red' })
    }
  }

  return (
    <Stack style={{ minHeight: '100vh' }}>
      <AppShell
        padding="md"
        header={{ height: 64 }}
        styles={{ main: { backgroundColor: 'var(--mantine-color-body)' } }}
      >
        <AppShell.Header>
          <Group justify="space-between" px="md" py="sm">
            <Group gap="xs" align="center">
              <Title order={3}>Radar портфель</Title>
              <Text size="xs" c="dimmed">{MINIAPP_REV}</Text>
            </Group>
            <Group>
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={refresh}
              >
                Обновить
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddOpened(true)}
              >
                Добавить
              </Button>
            </Group>
          </Group>
        </AppShell.Header>
        <Box px="md" py="xs"><Text size="xs" c="dimmed" style={{wordBreak: "break-all", overflowWrap: "anywhere"}}>Debug: tgId={String((window?.Telegram)?.WebApp?.initDataUnsafe?.user?.id || '')} ·  · usedId={String(((window?.Telegram)?.WebApp?.initDataUnsafe?.user?.id) || import.meta.env.VITE_DEV_TELEGRAM_ID || "1")} · lastUrl={String(window.__LAST_API_URL__ || '')}</Text></Box>
        <AppShell.Main>
          <Notifications position="top-center" />
          <Box px="md" py="lg">
            {loading && (
              <Group justify="center">
                <Loader color="teal" />
              </Group>
            )}
            {error && (
              <Alert color="red" title="Ошибка">
                {error.message}
              </Alert>
            )}
            {!loading && !error && data && (
              <Stack gap="md">
                <AccountTabs
                  accounts={accounts}
                  active={activeAccount}
                  onChange={setActiveAccount}
                />
                {currentAccount ? (
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text fw={600}>{currentAccount.account_name || 'Портфель'}</Text>
                        <Text size="sm" c="dimmed">
                          {currentAccount.currency || '—'} · {currentAccount.positions.length} бумаг
                        </Text>
                      </Stack>
                    </Group>
                    <PortfolioTable
                      account={currentAccount}
                      onEdit={(pos) => setEditTarget(pos)}
                      onDelete={handleDelete}
                    />
                  </Stack>
                ) : (
                  <Text>Портфель пуст</Text>
                )}
              </Stack>
            )}
          </Box>
        </AppShell.Main>
      </AppShell>
      <AddPositionModal
        opened={addOpened}
        onClose={() => setAddOpened(false)}
        accounts={accounts}
        onSubmit={handleAdd}
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
