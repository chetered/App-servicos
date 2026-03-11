import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Currency ──────────────────────────────────────────────────────

export function formatCurrency(amountCents: number, currency = 'BRL'): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `R$ ${amount.toFixed(2)}`;
  }
}

export function formatCurrencyCompact(amountCents: number): string {
  const amount = amountCents / 100;
  if (amount >= 1000) return `R$ ${(amount / 1000).toFixed(1)}k`;
  return formatCurrency(amountCents);
}

// ── Dates ─────────────────────────────────────────────────────────

export function formatDate(dateStr: string, pattern = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(dateStr), pattern, { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "dd/MM/yyyy 'às' HH:mm");
}

export function formatRelative(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Hoje às ${format(date, 'HH:mm')}`;
    if (isTomorrow(date)) return `Amanhã às ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Ontem às ${format(date, 'HH:mm')}`;
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function formatScheduledAt(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const dayLabel = isToday(date) ? 'Hoje' : isTomorrow(date) ? 'Amanhã' : format(date, "EEE, dd/MM", { locale: ptBR });
    return `${dayLabel} às ${format(date, 'HH:mm')}`;
  } catch {
    return dateStr;
  }
}

// ── Distance ──────────────────────────────────────────────────────

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) { return deg * (Math.PI / 180); }

// ── Status labels ─────────────────────────────────────────────────

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago — aguardando confirmação',
  ACCEPTED: 'Confirmado',
  SCHEDULED: 'Agendado',
  IN_TRANSIT: 'Profissional a caminho',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED_BY_CLIENT: 'Cancelado por você',
  CANCELLED_BY_PROVIDER: 'Cancelado pelo profissional',
  IN_DISPUTE: 'Em disputa',
  REFUNDED: 'Reembolsado',
};

export const BOOKING_STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: '#F59E0B',
  PAID: '#3B82F6',
  ACCEPTED: '#3B82F6',
  SCHEDULED: '#6C47FF',
  IN_TRANSIT: '#8B5CF6',
  IN_PROGRESS: '#10B981',
  COMPLETED: '#22C55E',
  CANCELLED_BY_CLIENT: '#6B7280',
  CANCELLED_BY_PROVIDER: '#EF4444',
  IN_DISPUTE: '#F97316',
  REFUNDED: '#6B7280',
};

// ── Rating ────────────────────────────────────────────────────────

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function ratingStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

// ── Text ─────────────────────────────────────────────────────────

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function getI18nValue(value: any, locale = 'pt-BR'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] ?? value['pt-BR'] ?? Object.values(value)[0] ?? '';
}
