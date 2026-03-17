// ─── Currency ────────────────────────────────────────────────────────────────

/** Formata centavos para Real Brasileiro. Ex: 15000 → "R$ 150,00" */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/** Converte reais para centavos. Ex: 150.50 → 15050 */
export function toBRLCents(reais: number): number {
  return Math.round(reais * 100);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/** Formata data para pt-BR. Ex: "2024-12-25" → "25/12/2024" */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

/** Formata data e hora. Ex: "25/12/2024 às 14:30" */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Retorna "há X minutos/horas/dias" */
export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'agora mesmo';
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} h`;
  return `há ${Math.floor(seconds / 86400)} dias`;
}

// ─── Geolocation ─────────────────────────────────────────────────────────────

/**
 * Calcula distância em km entre dois pontos geográficos (Haversine).
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Formata distância de forma legível. Ex: 0.8 → "800 m", 1.5 → "1,5 km" */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

// ─── Strings ─────────────────────────────────────────────────────────────────

/** Gera slug de uma string. Ex: "Limpeza Residencial" → "limpeza-residencial" */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Formata CPF. Ex: "12345678901" → "123.456.789-01" */
export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/** Formata telefone BR. Ex: "11987654321" → "(11) 98765-4321" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

/** Mascara dados sensíveis. Ex: "test@email.com" → "te**@email.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]!) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9]!)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]!) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]!);
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

// ─── Idempotency ─────────────────────────────────────────────────────────────

/** Gera chave de idempotência para operações financeiras */
export function generateIdempotencyKey(prefix: string, ...parts: string[]): string {
  return `${prefix}_${parts.join('_')}_${Date.now()}`;
}

// ─── Rating ──────────────────────────────────────────────────────────────────

/**
 * Calcula média bayesiana de rating.
 * Evita que poucos ratings 5★ dominem sobre muitos 4.5★.
 */
export function bayesianRating(
  rating: number,
  totalReviews: number,
  priorMean = 4.0,
  confidenceReviews = 20,
): number {
  return (confidenceReviews * priorMean + rating * totalReviews) / (confidenceReviews + totalReviews);
}

/** Renderiza estrelas como string. Ex: 4.5 → "★★★★½" */
export function ratingToStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}
