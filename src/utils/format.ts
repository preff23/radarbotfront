export function formatCurrency(value: number, currency = 'RUB') {
  if (!isFinite(value)) return '—';
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency, 
    maximumFractionDigits: 2 
  }).format(value);
}
