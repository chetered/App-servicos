// Shared TypeScript types across API, Web and Mobile

// ─── API Response Envelope ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  perPage?: number;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;        // userId
  email?: string;
  phone?: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface OtpRequestDto {
  recipient: string;  // email ou phone
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
}

// ─── User Types ──────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  email?: string;
  phone?: string;
  status: string;
  profile?: UserProfileDto;
  createdAt: string;
}

export interface UserProfileDto {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  birthDate?: string;
}

export interface UserAddressDto {
  id: string;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

// ─── Provider Types ───────────────────────────────────────────────────────────

export interface ProviderDto {
  id: string;
  userId: string;
  bio?: string;
  verificationStatus: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  isAvailable: boolean;
  serviceRadiusKm: number;
  overallRating: number;
  totalReviews: number;
  totalCompletions: number;
  completionRate: number;
  acceptanceRate: number;
  subscriptionPlan: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'PREMIUM';
  categories: CategoryDto[];
}

export interface ProviderSearchResult extends ProviderDto {
  distanceKm: number;
  matchScore: number;
  matchBreakdown?: MatchScoreBreakdown;
  estimatedPriceCents?: number;
  profile: UserProfileDto;
  availability: AvailabilitySlot[];
}

export interface MatchScoreBreakdown {
  distanceScore: number;
  ratingScore: number;
  completionScore: number;
  acceptanceScore: number;
  availabilityScore: number;
  trustScore: number;
  recurrenceBonus: number;
  priceCompetitiveness: number;
  newProviderBoost: number;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// ─── Category Types ───────────────────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  commissionRate: number;
  children?: CategoryDto[];
}

// ─── Booking Types ────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_AUTHORIZED'
  | 'CONFIRMED'
  | 'PROVIDER_EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_CLIENT'
  | 'CANCELLED_PROVIDER'
  | 'CANCELLED_SYSTEM'
  | 'DISPUTED'
  | 'REFUNDED';

export interface BookingDto {
  id: string;
  clientId: string;
  providerId: string;
  status: BookingStatus;
  scheduledAt: string;
  completedAt?: string;
  subtotalCents: number;
  discountCents: number;
  serviceFee: number;
  totalCents: number;
  clientNotes?: string;
  address?: UserAddressDto;
  provider?: ProviderDto;
  review?: ReviewDto;
  payment?: PaymentSummaryDto;
  createdAt: string;
}

export interface CreateBookingDto {
  providerId: string;
  serviceId?: string;
  addressId: string;
  scheduledAt: string;
  clientNotes?: string;
  couponCode?: string;
}

export interface RecurringBookingDto {
  id: string;
  providerId: string;
  frequencyDays: number;
  preferredTime: string;
  isActive: boolean;
  nextOccurrence: string;
}

// ─── Payment Types ────────────────────────────────────────────────────────────

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO' | 'WALLET';

export interface PaymentSummaryDto {
  id: string;
  method: PaymentMethod;
  status: string;
  amountCents: number;
  pixCode?: string;
  pixExpiresAt?: string;
  paidAt?: string;
}

export interface InitiatePaymentDto {
  bookingId: string;
  method: PaymentMethod;
  cardToken?: string;
  installments?: number;
}

// ─── Review Types ─────────────────────────────────────────────────────────────

export interface ReviewDto {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  reviewer?: UserProfileDto;
  response?: ReviewResponseDto;
  createdAt: string;
}

export interface ReviewResponseDto {
  id: string;
  content: string;
  createdAt: string;
}

export interface CreateReviewDto {
  bookingId: string;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface NotificationDto {
  id: string;
  channel: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  referenceId?: string;
  referenceType?: string;
  readAt?: string;
  createdAt: string;
}

// ─── Search / Matching ────────────────────────────────────────────────────────

export interface SearchProvidersDto {
  categoryId: string;
  latitude: number;
  longitude: number;
  scheduledAt: string;
  radiusKm?: number;
}

export interface SearchProvidersResponse {
  providers: ProviderSearchResult[];
  meta: {
    total: number;
    searchId: string;
    latencyMs: number;
  };
}

// ─── Analytics Events (from BLOCO D) ─────────────────────────────────────────

export type AnalyticsEventName =
  | 'search.performed'
  | 'search.provider_viewed'
  | 'search.provider_clicked'
  | 'booking.initiated'
  | 'booking.created'
  | 'booking.provider_accepted'
  | 'booking.provider_rejected'
  | 'booking.completed'
  | 'booking.cancelled_provider'
  | 'review.submitted'
  | 'recurrence.created'
  | 'provider.location_updated';

export interface TrackEventDto {
  eventName: AnalyticsEventName;
  properties?: Record<string, unknown>;
  sessionId?: string;
}
