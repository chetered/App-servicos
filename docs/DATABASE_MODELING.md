# SERVIX — Database Modeling

> PostgreSQL 16 + Prisma ORM
> Multi-country, Multi-currency, Recurrence-ready
> v1.0

---

## 1. Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVIX — ER DIAGRAM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

USERS & AUTH DOMAIN
───────────────────
  ┌──────────────┐   1:1   ┌─────────────┐
  │     User     │────────▶│ UserProfile │
  │              │         └─────────────┘
  │ id (PK)      │   1:N   ┌──────────────────┐
  │ email        │────────▶│  RefreshToken    │
  │ phone        │         └──────────────────┘
  │ passwordHash │   1:N   ┌──────────────────────────┐
  │ roles[]      │────────▶│ EmailVerificationToken   │
  │ authProvider │         └──────────────────────────┘
  │ googleId     │   1:1   ┌──────────────┐
  │ appleId      │────────▶│   Provider   │
  └──────────────┘         └──────────────┘
         │ 1:N
         │────▶ Address[]
         │────▶ PaymentMethod[]
         │────▶ ServiceOrder[] (as client)
         │────▶ Review[] (as author & target)
         │────▶ SupportTicket[] (as reporter)
         │────▶ Notification[]
         │────▶ AuditLog[]
         │────▶ AnalyticsEvent[]

PROVIDER DOMAIN
───────────────
  ┌───────────────────┐
  │     Provider      │
  │                   │
  │ id (PK)           │
  │ userId (FK→User)  │
  │ status            │
  │ averageRating     │
  │ rankingScore      │
  │ currentLat/Lng    │
  │ serviceRadiusKm   │
  │ isAvailableNow    │
  │ isPremium         │
  │ totalEarnings     │
  │ pendingPayout     │
  └───────────────────┘
         │
         │ 1:N ──▶ ProviderDocument[]
         │ 1:1 ──▶ ProviderVerification
         │ 1:N ──▶ ProviderService[] (junction: Provider↔Service)
         │ 1:N ──▶ ProviderPricingRule[] (junction: Provider↔Service)
         │ 1:N ──▶ ProviderAvailability[]
         │ 1:N ──▶ ProviderZone[]
         │ 1:1 ──▶ DisplacementRule
         │ 1:N ──▶ ServiceOrder[] (as provider)
         │ 1:N ──▶ Payout[]
         │ 1:N ──▶ SponsoredSlot[]
         │ 1:1 ──▶ PremiumSubscription
         │ 1:N ──▶ ProviderRankingScore[]

CATALOG DOMAIN
──────────────
  ┌─────────────────────┐   self-ref   ┌─────────────────────┐
  │   ServiceCategory   │◀────────────▶│  ServiceCategory    │
  │                     │  (hierarchy) │    (subcategory)    │
  │ id (PK)             │              └─────────────────────┘
  │ slug (UNIQUE)       │
  │ name (JSON i18n)    │   1:N
  │ parentId (FK self)  │──────▶ Service[]
  │ isActive            │
  └─────────────────────┘

  ┌──────────────┐
  │   Service    │
  │              │
  │ id (PK)      │
  │ categoryId   │──▶ ServiceCategory
  │ slug (UNIQUE)│
  │ name (JSON)  │
  │ defaultPrice │
  │ customFields │ ◀─ JSON schema for booking form
  └──────────────┘
         │
         │ N:M ──▶ Provider[] (via ProviderService)
         │ 1:N ──▶ ProviderPricingRule[]
         │ 1:N ──▶ ServiceOrder[]
         │ 1:N ──▶ CommissionRule[]

ORDER DOMAIN (Core Aggregate)
─────────────────────────────
  ┌─────────────────────────────┐
  │        ServiceOrder         │
  │                             │
  │ id (PK)                     │
  │ clientId (FK→User)          │
  │ providerId (FK→Provider)    │
  │ serviceId (FK→Service)      │
  │ bookingType                 │
  │ status                      │
  │ scheduledAt                 │
  │ addressId (FK→Address)      │
  │ ── PRICE SNAPSHOT ──        │
  │ servicePrice                │
  │ displacementFee             │
  │ urgencyFee                  │
  │ platformFee                 │
  │ couponDiscount              │
  │ insuranceFee                │
  │ totalAmount                 │
  │ currency                    │
  │ priceBreakdown (JSON)       │
  │ idempotencyKey (UNIQUE)     │
  │ recurringPlanId (FK)        │
  └─────────────────────────────┘
         │
         │ 1:N ──▶ OrderStatusHistory[]
         │ 1:N ──▶ Payment[]
         │ 1:1 ──▶ Review
         │ 1:1 ──▶ SupportTicket
         │ 1:1 ──▶ Dispute
         │ 1:1 ──▶ PaymentSplit
         │ 1:N ──▶ MonetizationLedger[]

PAYMENT DOMAIN
──────────────
  ┌─────────────────────┐   1:N   ┌──────────────────┐
  │      Payment        │────────▶│     Refund       │
  │                     │         └──────────────────┘
  │ id (PK)             │   1:1   ┌──────────────────┐
  │ orderId (FK)        │────────▶│  PaymentSplit    │
  │ amount              │         │                  │
  │ status              │         │ totalAmount      │
  │ gatewayName         │         │ platformAmount   │
  │ gatewayTxId (UNIQ)  │         │ providerAmount   │
  │ idempotencyKey(UNQ) │         │ commissionRate   │
  └─────────────────────┘         └──────────────────┘

  PaymentSplit ──▶ MonetizationLedger[] (per revenue source)

RECURRENCE DOMAIN
─────────────────
  ┌────────────────────────┐   1:N   ┌─────────────────┐
  │  RecurringServicePlan  │────────▶│ PaymentSchedule │
  │                        │         └─────────────────┘
  │ id (PK)                │   1:N
  │ clientId               │────────▶ ServiceOrder[] (executions)
  │ providerId             │
  │ serviceId              │
  │ frequency              │
  │ status                 │
  │ nextScheduledAt        │
  └────────────────────────┘

MULTI-COUNTRY DOMAIN
────────────────────
  ┌──────────────┐
  │   Country    │
  │              │
  │ id (PK)      │
  │ code (UNIQ)  │
  │ currencyCode │
  │ defaultLocale│
  │ isActive     │
  └──────────────┘
         │
         │ 1:N ──▶ CountryCategory[] ──▶ ServiceCategory
         │ 1:N ──▶ PaymentGatewayConfig[]
         │ 1:N ──▶ CommissionRule[]
         │ 1:N ──▶ TaxRule[]
         │ 1:N ──▶ FeatureFlag[]
         │ 1:N ──▶ UserProfile[]
```

---

## 2. Domain Boundaries (Bounded Contexts)

| Domain | Tables | Owns |
|--------|--------|------|
| **Auth** | users, user_profiles, refresh_tokens, email_verification_tokens | Identity, sessions |
| **Provider** | providers, provider_documents, provider_verifications, provider_services, provider_pricing_rules, provider_availability, provider_zones, displacement_rules, provider_ranking_scores | Provider lifecycle |
| **Catalog** | service_categories, services, country_categories | Service taxonomy |
| **Booking** | service_orders, order_status_history | Order lifecycle |
| **Payment** | payments, refunds, payment_splits, payment_methods, payment_gateway_configs | Money movement |
| **Financial** | payouts, commission_rules, monetization_ledger | Revenue & splits |
| **Recurrence** | recurring_service_plans, payment_schedules | Subscription logic |
| **Trust** | trust_scores, reviews, provider_verifications | Quality signals |
| **Support** | support_tickets, ticket_messages, disputes | Issue resolution |
| **Marketing** | coupons, coupon_usages, sponsored_slots, premium_subscriptions | Growth & monetization |
| **Platform** | countries, tax_rules, feature_flags, settings | Global config |
| **Analytics** | analytics_events, audit_logs, notifications | Observability |

---

## 3. Critical Fields & Constraints

### 3.1 Idempotency Keys
```sql
-- Prevents double charges at DB level
ALTER TABLE payments ADD CONSTRAINT payments_idempotency_key_unique UNIQUE (idempotency_key);
ALTER TABLE service_orders ADD CONSTRAINT service_orders_idempotency_key_unique UNIQUE (idempotency_key);
ALTER TABLE refunds ADD CONSTRAINT refunds_idempotency_key_unique UNIQUE (idempotency_key);
```

**Pattern:** `{orderId}:{clientId}:{timestamp}` — generated by BookingsService before calling PaymentsService.

### 3.2 Price Snapshot Immutability
All price fields on `service_orders` are **copied at creation time** and never updated:

```
servicePrice    = provider's pricingRule.basePrice (at booking time)
displacementFee = DisplacementService.calculate() result
urgencyFee      = 15% of servicePrice if IMMEDIATE booking
platformFee     = calculated from CommissionRule
couponDiscount  = Coupon.discountValue applied
insuranceFee    = fixed or % if client opted in
totalAmount     = sum of all above
```

This ensures dispute resolution always reflects what was charged.

### 3.3 Gateway Transaction ID Uniqueness
```sql
ALTER TABLE payments ADD CONSTRAINT payments_gateway_tx_unique UNIQUE (gateway_transaction_id);
```

Prevents webhook reprocessing from creating duplicate payment records.

### 3.4 Soft Financial Data
`bankAccountInfo` on Provider is stored as JSON and **must be encrypted at application layer** before persisting. Never expose raw bank data via API.

---

## 4. Index Strategy

### Performance Indexes

```sql
-- Most common query: providers by geo location + status
CREATE INDEX idx_providers_geo ON providers (current_latitude, current_longitude, status)
  WHERE status = 'ACTIVE' AND is_available_now = true;

-- Orders by client (order history screen)
CREATE INDEX idx_orders_client ON service_orders (client_id, status, created_at DESC);

-- Orders by provider (provider dashboard)
CREATE INDEX idx_orders_provider ON service_orders (provider_id, status, scheduled_at);

-- Analytics hot queries
CREATE INDEX idx_analytics_type_time ON analytics_events (type, occurred_at DESC);
CREATE INDEX idx_analytics_actor ON analytics_events (actor_id, occurred_at DESC);

-- Notifications per user (unread count badge)
CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read)
  WHERE is_read = false;

-- Active coupons lookup
CREATE INDEX idx_coupons_active ON coupons (code, is_active, expires_at)
  WHERE is_active = true;

-- Upcoming payment schedules (scheduler job)
CREATE INDEX idx_payment_schedules_pending ON payment_schedules (scheduled_for, status)
  WHERE status = 'PENDING';

-- Provider ranking for search
CREATE INDEX idx_providers_ranking ON providers (ranking_score DESC, status)
  WHERE status = 'ACTIVE';
```

### Full-Text Search Indexes (pg_trgm)
```sql
-- Enable extension (done in init.sql)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Search providers by name
CREATE INDEX idx_users_fullname_trgm ON users USING GIN (full_name gin_trgm_ops);

-- Search services by name (JSON field — needs generated column or view)
```

---

## 5. Data Flow: Booking Creation

```
Client Request → BookingsService.create()
│
├── 1. Validate provider availability
│   └── SELECT FROM provider_availability WHERE dayOfWeek = ? AND time BETWEEN startTime AND endTime
│
├── 2. Check conflict
│   └── SELECT FROM service_orders
│       WHERE provider_id = ? AND status IN ('ACCEPTED','IN_PROGRESS','SCHEDULED')
│       AND scheduled_at BETWEEN (? - 1h) AND (? + 1h)
│
├── 3. Calculate price
│   └── SELECT FROM provider_pricing_rules WHERE provider_id = ? AND service_id = ?
│   └── SELECT FROM displacement_rules WHERE provider_id = ?
│   └── SELECT FROM commission_rules WHERE (service_id = ? OR category_id = ?) AND is_active = true
│   └── SELECT FROM coupons WHERE code = ? AND is_active = true AND expires_at > NOW()
│
├── 4. $transaction {
│   ├── INSERT INTO service_orders (price snapshot copied)
│   ├── INSERT INTO addresses (snapshot copy for order)
│   ├── INSERT INTO order_status_history (status=PENDING_PAYMENT)
│   └── UPDATE coupons SET used_count = used_count + 1 WHERE id = ?
│   }
│
├── 5. Charge via PaymentsService
│   ├── CHECK: SELECT FROM payments WHERE idempotency_key = ? (if exists, return it)
│   ├── INSERT INTO payments (status=PENDING)
│   ├── CALL gateway.charge()
│   └── UPDATE payments SET status=SUCCEEDED, gateway_transaction_id = ?
│
├── 6. $transaction {
│   ├── UPDATE service_orders SET status = PAID
│   └── INSERT INTO order_status_history (status=PAID)
│   }
│
├── 7. emit('booking.created') → AnalyticsService records event
└── 8. BullMQ: schedule acceptance timeout job (5min)
```

---

## 6. Data Flow: Payment Split (Order Completion)

```
Order COMPLETED event → CommissionsService.processOrderPayout()
│
├── 1. Calculate split
│   totalAmount = service_orders.total_amount
│   commissionRate = commission_rules.percentage (snapshot at booking time)
│   platformAmount = totalAmount * commissionRate / 100
│   providerAmount = totalAmount - platformAmount
│
├── 2. INSERT INTO payment_splits {
│   orderId, paymentId, totalAmount,
│   platformAmount, providerAmount, commissionRate
│   }
│
├── 3. UPDATE providers SET
│   total_earnings = total_earnings + providerAmount
│   pending_payout = pending_payout + providerAmount
│   total_completed_jobs = total_completed_jobs + 1
│
└── 4. INSERT INTO monetization_ledger (one row per source):
    ├── { source: COMMISSION, amount: commissionAmount }
    ├── { source: URGENCY_FEE, amount: urgencyFee } (if applicable)
    ├── { source: DISPLACEMENT_FEE, amount: displacementFee } (if applicable)
    └── { source: INSURANCE_FEE, amount: insuranceFee } (if applicable)
```

---

## 7. Recurrence Data Flow

```
RecurringServicePlan
  ├── frequency: WEEKLY | BIWEEKLY | MONTHLY
  ├── nextScheduledAt: DateTime
  └── paymentSchedules: PaymentSchedule[]
        ├── { scheduledFor: 2024-01-08, status: PROCESSED, orderId: 'ord-1' }
        ├── { scheduledFor: 2024-01-15, status: PENDING }
        └── { scheduledFor: 2024-01-22, status: PENDING }

@Cron('0 6 * * *') RecurrenceSchedulerService runs daily:
  SELECT FROM payment_schedules
  WHERE status = 'PENDING' AND scheduled_for <= NOW()

  For each due schedule:
  ├── Create ServiceOrder (same as manual booking, bookingType=RECURRING)
  ├── Charge via PaymentsService (idempotencyKey = planId:scheduleId)
  ├── UPDATE payment_schedules SET status=PROCESSED, orderId=newOrderId
  ├── UPDATE recurring_service_plans SET
  │   completed_occurrences += 1
  │   next_scheduled_at = calculated next date
  └── If totalOccurrences reached → UPDATE status = COMPLETED
```

---

## 8. Multi-Country Config Resolution

```
Request with countryCode header →
│
├── PaymentGatewayConfig WHERE country_code = ? AND is_default = true
│   └── Returns: gatewayName (MERCADOPAGO | STRIPE | PAGSEGURO)
│   └── GatewayFactory instantiates correct IPaymentGateway impl
│
├── CommissionRule WHERE country_id = ? AND is_active = true
│   ORDER BY priority DESC
│   └── Most specific rule wins (service > category > country default)
│
├── TaxRule WHERE country_id = ? AND is_active = true
│   └── Applied on top of platform fee
│
└── FeatureFlag WHERE key = ? AND country_id = ? AND status = 'ENABLED'
    └── e.g., 'pix_enabled' → show PIX payment method
```

---

## 9. Trust Score Components

```
TrustScore (userId UNIQUE) — recalculated weekly by TrustSchedulerService

overallScore = weighted average:
├── identityScore (25%) ← from ProviderVerification.identity_score
├── behaviorScore (25%) ← 100 - (disputes_decided_against / total_orders * 100)
├── ratingScore   (25%) ← Provider.average_rating / 5 * 100
└── completionScore(25%)← Provider.completion_rate

Triggers:
  ├── Review published → recalculate ratingScore
  ├── Dispute decided → recalculate behaviorScore
  └── Document approved → recalculate identityScore
```

---

## 10. Ranking Algorithm

```
ProviderRankingScore — updated daily by RankingSchedulerService

score = (
  ratingScore     * 0.35 +  -- Average rating (1-5 → 0-100)
  acceptanceScore * 0.20 +  -- % of requests accepted (last 30d)
  completionScore * 0.20 +  -- % orders completed (last 90d)
  responseScore   * 0.15 +  -- Fast response = high score
  recurrenceScore * 0.05 +  -- % recurring clients
  reliabilityScore * 0.05   -- No late cancellations
)

Final ranking score in search:
  rankingScore * sponsoredSlot.boostFactor (if active)
  * isPremium ? 1.1 : 1.0
```

---

## 11. Analytics Event Schema

All events follow the same shape for BI compatibility:

```typescript
{
  type: string;          // 'booking_created' | 'search_performed' | 'checkout_started' | ...
  actorId?: string;      // User ID (nullable for anonymous)
  actorType?: string;    // 'USER' | 'PROVIDER' | 'SYSTEM'
  entityType?: string;   // 'ORDER' | 'PROVIDER' | 'CATEGORY' | 'COUPON'
  entityId?: string;     // ID of the entity
  properties?: Json;     // Event-specific payload
  sessionId?: string;    // Mobile/web session
  deviceType?: string;   // 'MOBILE_IOS' | 'MOBILE_ANDROID' | 'WEB'
  appVersion?: string;   // '1.2.3'
  countryCode?: string;  // 'BR' | 'US'
  city?: string;         // 'São Paulo'
  occurredAt: DateTime;  // Server-side timestamp
}
```

Standard event types:
| Event | Trigger | Key Properties |
|-------|---------|----------------|
| `search_performed` | User searches providers | query, categoryId, location, results_count |
| `provider_viewed` | Provider profile opened | providerId, source |
| `checkout_started` | User starts booking | serviceId, providerId, bookingType |
| `booking_created` | Order confirmed | orderId, amount, providerId |
| `booking_accepted` | Provider accepts | orderId, responseTimeMs |
| `booking_completed` | Order done | orderId, duration |
| `review_submitted` | Rating given | orderId, rating |
| `payment_processed` | Payment done | paymentId, gateway, method |
| `coupon_applied` | Coupon used | couponCode, discount |
| `provider_registered` | New provider | providerId |

---

## 12. Soft Delete Strategy

No generic soft delete — per-domain decisions:

| Table | Strategy | Reason |
|-------|----------|--------|
| users | `isBanned` flag | Legal: must retain data |
| providers | `status = SUSPENDED/REJECTED` | Audit trail |
| service_orders | No delete | Financial record |
| payments | No delete | PCI compliance |
| reviews | `isFlagged` → moderator removes | Content moderation |
| coupons | `isActive = false` | Deactivation, not deletion |
| feature_flags | `status = DISABLED` | Toggle, not delete |
| notifications | TTL job cleans >90d | Storage management |
| analytics_events | TTL or archive >1y | Partition by month |

---

## 13. Migration Strategy

```
Prisma migrations (tracked in prisma/migrations/):
├── 0001_initial          — All base tables
├── 0002_add_trust_score  — TrustScore + indexes
├── 0003_add_recurrence   — RecurringServicePlan + PaymentSchedule
├── 0004_add_sponsored    — SponsoredSlot + PremiumSubscription
└── (future migrations)

Rules:
1. NEVER drop columns in production — mark as deprecated, migrate data, then drop in next cycle
2. ALWAYS add columns as nullable or with DEFAULT — no-downtime deploys
3. Data migrations run as separate scripts (prisma/scripts/), not in schema migrations
4. Financial table alterations require dual-write period + validation
```

---

## 14. Partitioning Plan (Post-MVP)

For scale, partition heavy tables by time:

```sql
-- analytics_events: partition by month (expected >1M rows/month)
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- audit_logs: partition by quarter
-- notifications: partition by month + TTL cleanup job
-- order_status_history: partition by year (append-only, never updated)
```

---

## 15. Backup & Retention Policy

| Table Group | Retention | Backup |
|-------------|-----------|--------|
| financial (payments, splits, ledger) | 10 years | Daily + WAL streaming |
| orders | 7 years | Daily + WAL streaming |
| users, providers | Indefinite (or legal deletion request) | Daily |
| analytics_events | 2 years hot, archive cold | Daily |
| audit_logs | 7 years | Daily |
| notifications | 90 days | Weekly |
| refresh_tokens | 30 days (TTL job) | Not required |
