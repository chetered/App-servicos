# SERVIX — Arquitetura Completa do Sistema
## v1.0 — Documento Técnico Definitivo

---

## 1. VISÃO GERAL DA ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SERVIX PLATFORM                                    │
│                                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────────────┐   │
│  │  Mobile App  │   │  Admin Web   │   │    Future: Client Web (PWA)      │   │
│  │ React Native │   │   Next.js    │   │         Next.js                  │   │
│  │    + Expo    │   │     14       │   │                                  │   │
│  └──────┬───────┘   └──────┬───────┘   └────────────────┬─────────────────┘   │
│         │                  │                             │                     │
│         └──────────────────┼─────────────────────────────┘                     │
│                            │  HTTPS / REST API                                 │
│                            ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY LAYER                               │   │
│  │  Rate Limiting · CORS · SSL Termination · Auth Header Validation        │   │
│  └─────────────────────────────┬───────────────────────────────────────────┘   │
│                                │                                               │
│  ┌─────────────────────────────▼───────────────────────────────────────────┐   │
│  │                    NESTJS BACKEND (Modular Monolith)                    │   │
│  │                                                                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
│  │  │   auth   │ │  users   │ │providers │ │categories│ │    search    │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
│  │  │ bookings │ │recurrence│ │ payments │ │commission│ │   payouts    │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │   │
│  │  │  trust   │ │ reviews  │ │ support  │ │ notific. │ │  analytics   │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐  │   │
│  │  │localiz.  │ │  admin   │ │feat-flags│ │      marketplace         │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────────┘  │   │
│  └──────────────────┬──────────────────────────────────────────────────────┘   │
│                     │                                                          │
│         ┌───────────┼──────────────────┬──────────────────┐                   │
│         │           │                  │                  │                   │
│         ▼           ▼                  ▼                  ▼                   │
│  ┌────────────┐ ┌────────┐  ┌──────────────────┐  ┌────────────────────┐     │
│  │ PostgreSQL │ │ Redis  │  │   BullMQ Queues  │  │   MinIO / S3       │     │
│  │   (main)   │ │(cache) │  │ ┌──────────────┐ │  │  (Documents,       │     │
│  │            │ │        │  │ │  bookings    │ │  │   Avatars,         │     │
│  │ Prisma ORM │ │Sessions│  │ │  payments    │ │  │   Public Assets)   │     │
│  │            │ │Tokens  │  │ │  auth        │ │  │                    │     │
│  │            │ │Rate Lim│  │ │  notifications│ │  │                    │     │
│  └────────────┘ └────────┘  │ │  analytics   │ │  └────────────────────┘     │
│                             │ └──────────────┘ │                              │
│                             └──────────────────┘                              │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        EXTERNAL SERVICES                                 │  │
│  │  MercadoPago · Stripe · Firebase FCM · Twilio SMS · SMTP · Google Maps  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ARQUITETURA DE DOMÍNIOS (DDD-inspired)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOUNDED CONTEXTS                            │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │   IDENTITY CONTEXT  │    │     CATALOG CONTEXT          │   │
│  │                     │    │                              │   │
│  │  · User             │    │  · ServiceCategory           │   │
│  │  · UserProfile      │    │  · Service                   │   │
│  │  · AuthProvider     │    │  · ProviderService           │   │
│  │  · RefreshToken     │    │  · ProviderPricingRule        │   │
│  │  · Role / Permission│    │  · DisplacementRule          │   │
│  └─────────┬───────────┘    └──────────────────────────────┘   │
│            │                                                    │
│  ┌─────────▼───────────┐    ┌──────────────────────────────┐   │
│  │   SUPPLY CONTEXT    │    │     DEMAND CONTEXT           │   │
│  │                     │    │                              │   │
│  │  · Provider         │    │  · ServiceOrder              │   │
│  │  · ProviderDocument │    │  · OrderStatusHistory        │   │
│  │  · Verification     │    │  · RecurringServicePlan      │   │
│  │  · Availability     │    │  · PaymentSchedule           │   │
│  │  · Zone             │    │  · Address                   │   │
│  │  · TrustScore       │    │  · Coupon / CouponUsage      │   │
│  └─────────┬───────────┘    └──────────────┬───────────────┘   │
│            │                               │                   │
│  ┌─────────▼───────────────────────────────▼──────────────┐   │
│  │                  FINANCIAL CONTEXT                      │   │
│  │                                                         │   │
│  │  · Payment           · CommissionRule                   │   │
│  │  · PaymentSplit      · MonetizationLedger               │   │
│  │  · Refund            · Payout                           │   │
│  │  · PaymentMethod     · PaymentGatewayConfig             │   │
│  │  · TaxRule           · PaymentSchedule                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────┐   ┌────────────────────────────────┐    │
│  │  TRUST CONTEXT    │   │    OPERATIONS CONTEXT          │    │
│  │                   │   │                                │    │
│  │  · Review         │   │  · SupportTicket               │    │
│  │  · TrustScore     │   │  · TicketMessage               │    │
│  │  · Verification   │   │  · Dispute                     │    │
│  │  · SponsoredSlot  │   │  · AuditLog                    │    │
│  │  · PremiumSub     │   │  · Notification                │    │
│  └───────────────────┘   └────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                LOCALIZATION CONTEXT                       │  │
│  │  · Country · Currency · Locale · FeatureFlag · Setting   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. FLUXO DE DADOS — CONTRATAÇÃO IMEDIATA

```
CLIENT APP                    BACKEND                      GATEWAYS
    │                            │                             │
    │── POST /bookings/estimate ─►│                             │
    │                            │── calcPricing() ───────────►│
    │                            │   · servicePrice             │
    │                            │   · displacementFee          │
    │                            │   · urgencyFee (10%)         │
    │                            │   · platformFee (20%)        │
    │                            │   · couponDiscount           │
    │◄── PriceBreakdown ─────────│                             │
    │                            │                             │
    │── POST /bookings ─────────►│                             │
    │   { providerId,            │── checkConflict() ──────────┤
    │     serviceId,             │── createOrder(PENDING) ─────┤
    │     address,               │                             │
    │     paymentMethodId }      │── charge() ────────────────►│ MercadoPago
    │                            │                             │◄── { succeeded }
    │                            │── updateStatus(PAID) ───────┤
    │                            │── notifyProvider(push) ─────┤ Firebase FCM
    │                            │── scheduleTimeout(5min) ────┤ BullMQ
    │                            │── emitEvent(booking.created)┤
    │                            │── trackAnalytics() ─────────┤
    │◄── { booking, status:PAID }│                             │
    │                            │                             │
    ▼                            │                             │
PROVIDER APP                    │                             │
    │◄─── push notification ─────│                             │
    │── PATCH /bookings/:id/accept►│                            │
    │                            │── updateStatus(ACCEPTED) ───┤
    │                            │── notifyClient() ───────────┤ Firebase FCM
    │◄── { booking, status:ACCEPTED }                          │
    │                            │                             │
    │── PATCH /bookings/:id/complete►│                          │
    │                            │── updateStatus(COMPLETED) ──┤
    │                            │── processOrderPayout() ─────┤
    │                            │   · calcProviderAmount       │
    │                            │   · updateProviderWallet     │
    │                            │   · recordMonetization       │
    │                            │── notifyClient(review) ──────┤ Firebase FCM
    │◄── { booking, status:COMPLETED }
```

---

## 4. FLUXO DE PAGAMENTO E SPLIT

```
                         CHECKOUT
                            │
                     totalAmount = 240,00
                            │
              ┌─────────────┴──────────────┐
              │         PAYMENT            │
              │    MercadoPago / Stripe     │
              │  idempotencyKey: uuid       │
              └─────────────┬──────────────┘
                            │
                   ┌────────▼────────┐
                   │  Payment record  │
                   │  status: PENDING │
                   └────────┬────────┘
                            │
                  gateway.charge(240,00)
                            │
                   ┌────────▼────────┐
                   │  status:SUCCEEDED│
                   └────────┬────────┘
                            │
                    ON COMPLETION
                            │
              ┌─────────────┴──────────────┐
              │        PaymentSplit         │
              │                            │
              │  totalAmount:   R$ 240,00  │
              │  platformFee:   R$  48,00  │ ← 20% commission
              │  providerAmount:R$ 192,00  │ ← 80% to provider
              │                            │
              └─────────────┬──────────────┘
                            │
              ┌─────────────┴──────────────┐
              │     MonetizationLedger      │
              │                            │
              │  COMMISSION:    R$  48,00  │
              │  URGENCY_FEE:   R$   0,00  │
              │  INSURANCE_FEE: R$   0,00  │
              └─────────────┬──────────────┘
                            │
              ┌─────────────┴──────────────┐
              │  Provider Wallet Update     │
              │                            │
              │  pendingPayout: +192,00    │
              │  totalEarnings: +192,00    │
              │  totalCompletedJobs: +1    │
              └────────────────────────────┘
```

---

## 5. ARQUITETURA DE CAMADAS (Clean Architecture)

```
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  Controllers · DTOs · Validators · Response Transformers   │
│  Guards · Interceptors · Filters · Decorators              │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                    APPLICATION LAYER                       │
│  Services · Use Cases · Event Handlers · Queue Processors  │
│  Business Rules · Orchestration                            │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                     DOMAIN LAYER                           │
│  Entities · Value Objects · Domain Events · Interfaces     │
│  Business Invariants · Aggregates                          │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                      │
│  PrismaService · Redis · BullMQ · S3 · FCM · SMTP          │
│  Payment Gateways · External APIs · Config                 │
└────────────────────────────────────────────────────────────┘
```

---

## 6. PADRÕES ARQUITETURAIS ADOTADOS

| Padrão | Onde | Por quê |
|--------|------|---------|
| **Modular Monolith** | Backend geral | MVP rápido, extraível para microsserviços depois |
| **Repository via Prisma** | Acesso a dados | ORM type-safe, migrations versionadas |
| **Strategy Pattern** | Payment Gateways | Intercambiar MercadoPago/Stripe sem alterar core |
| **Factory Pattern** | GatewayFactory | Retorna gateway correto por país |
| **Observer/Events** | EventEmitter2 | Desacoplamento entre domínios (booking → analytics) |
| **Queue/Worker** | BullMQ | Operações assíncronas (timeout, notificações, webhooks) |
| **CQRS light** | Admin queries | Queries complexas separadas dos comandos |
| **Idempotency** | Payments | Nunca cobrar duas vezes o mesmo pedido |
| **Snapshot** | Order price | Preço imutável no momento da contratação |
| **Audit Trail** | AuditLog | Rastreabilidade total de mudanças críticas |
| **Feature Flags** | FeatureFlag | Ligar/desligar funcionalidades por país sem deploy |

---

## 7. ESTRATÉGIA DE CACHE (Redis)

```
┌──────────────────────────────────────────────────────────┐
│                    REDIS NAMESPACES                      │
│                                                          │
│  auth:blacklist:{token}     TTL: até expirar o token     │
│  auth:otp:{phone}           TTL: 600s (10min)            │
│  auth:ratelimit:{ip}        TTL: 60s (janela deslizante) │
│                                                          │
│  search:categories:{country} TTL: 300s (5min)           │
│  search:providers:{hash}    TTL: 60s                     │
│                                                          │
│  flag:{key}:{country}       TTL: 300s (sync com DB)     │
│                                                          │
│  session:{userId}           TTL: 3600s (1h)              │
│                                                          │
│  ranking:{providerId}       TTL: 3600s (recalc/hora)    │
└──────────────────────────────────────────────────────────┘
```

---

## 8. ESTRATÉGIA DE FILAS (BullMQ)

```
Queue: bookings
├── check-acceptance-timeout   (delay: 5min após criação)
├── send-reminder-24h          (delay: scheduledAt - 24h)
└── send-reminder-1h           (delay: scheduledAt - 1h)

Queue: payments
├── process-webhook            (imediato, retry 3x com backoff)
├── retry-failed-payout        (delay: 1h, max 3 tentativas)
└── reconcile-daily            (cron: todo dia às 02:00)

Queue: auth
└── cleanup-expired-tokens     (cron: todo dia às 03:00)

Queue: notifications
├── send-push                  (imediato)
├── send-email                 (imediato)
└── send-sms                   (imediato)

Queue: analytics
└── flush-events-batch         (cron: a cada 30s, batch de 100)

Queue: recurrence
└── generate-next-occurrence   (cron: todo dia às 06:00)
```

---

## 9. ESTRATÉGIA DE SEGURANÇA

```
REQUEST PIPELINE:
  ┌──────────────────────────────────────────────────┐
  │  1. SSL/TLS 1.3                                  │
  │  2. Rate Limiting (ThrottlerGuard)               │
  │     · Global: 100 req/60s por IP                 │
  │     · Auth: 5 tentativas/min por IP              │
  │     · OTP: 3 envios/min por telefone             │
  │  3. CORS (origins whitelist)                     │
  │  4. Helmet (security headers)                    │
  │  5. JWT Validation (JwtAuthGuard)                │
  │  6. RBAC (RolesGuard)                            │
  │  7. Input Validation (class-validator + Pipes)   │
  │  8. Business Rule Validation (Service Layer)     │
  └──────────────────────────────────────────────────┘

DATA PROTECTION:
  · Senhas: bcrypt rounds=12
  · Tokens: JWT HS256 + Refresh UUID rotation
  · PII: dados bancários criptografados (AES-256)
  · Logs: dados sensíveis mascarados
  · S3: documentos em bucket privado, acesso por URL assinada

ANTIFRAUDE (preparado):
  · Velocity check: max pedidos por usuário/hora
  · Device fingerprint (futuro)
  · Score de risco por transação (ML futuro)
  · Blacklist de dispositivos
```

---

## 10. OBSERVABILIDADE

```
LOGS (Winston — JSON estruturado):
  {
    "timestamp": "2025-01-01T10:00:00.000Z",
    "level": "info",
    "requestId": "abc-123",
    "userId": "user-456",
    "method": "POST",
    "path": "/api/v1/bookings",
    "statusCode": 201,
    "duration": 145,
    "module": "BookingsService"
  }

MÉTRICAS (futuro: Prometheus + Grafana):
  · http_requests_total
  · http_request_duration_seconds
  · booking_created_total
  · payment_succeeded_total
  · payment_failed_total
  · queue_depth_gauge

TRACING (futuro: OpenTelemetry + Jaeger):
  · request → controller → service → db
  · trace_id propagado em todos os logs
  · span por chamada externa (gateway, SMS, FCM)

HEALTH CHECKS:
  GET /api/v1/health
  {
    "status": "ok",
    "checks": {
      "database": "ok",
      "redis": "ok",
      "queue": "ok"
    }
  }
```

---

## 11. ESTRATÉGIA DE ESCALABILIDADE

```
MVP (1-10k usuários):
  · 1 instância backend
  · 1 PostgreSQL (single node)
  · 1 Redis (single node)
  · MinIO local ou S3 managed

Crescimento (10k-100k usuários):
  · Backend: 2-4 instâncias (load balancer)
  · PostgreSQL: primary + 1 read replica
  · Redis: single node com maior RAM
  · CDN para assets públicos

Escala (100k-1M usuários):
  · Backend: horizontal scaling (Kubernetes)
  · PostgreSQL: primary + 2 read replicas + PgBouncer
  · Redis: cluster mode
  · Filas: Redis Cluster para BullMQ
  · Separar domínios mais pesados em microsserviços:
    - payments-service (crítico, isolado)
    - notifications-service (alto volume)
    - analytics-service (heavy writes)

Internacional (multi-região):
  · Deploy por região (BR, MX, AR)
  · PostgreSQL multi-AZ por região
  · CDN global
  · Gateway por país
```

---

## 12. DECISÕES TÉCNICAS E JUSTIFICATIVAS

| Decisão | Alternativa | Justificativa |
|---------|-------------|---------------|
| **NestJS** | Express, Fastify | DI nativo, módulos, decorators, Swagger automático |
| **Prisma** | TypeORM, Drizzle | Type safety, migrations, schema-first, DX excelente |
| **PostgreSQL** | MySQL, MongoDB | ACID, JSONB, suporte futuro a PostGIS, reputação |
| **Redis** | Memcached | Estruturas ricas (sorted sets para ranking), pub/sub |
| **BullMQ** | SQS, RabbitMQ | Redis-based, sem infra extra no MVP, retry built-in |
| **React Native + Expo** | Flutter, Native | One codebase iOS+Android, Expo managed, OTA updates |
| **Next.js 14** | Remix, Vite+React | SSR, file-based routing, Vercel deploy, App Router |
| **Modular Monolith** | Microsserviços | MVP mais rápido, mesma separação de domínios, extraível |
| **Gateway Abstraction** | Stripe direto | Multi-país desde o dia 1, sem vendor lock-in |
| **EventEmitter interno** | Kafka, NATS | Suficiente para MVP, migrar para Kafka quando escalar |
| **MinIO** | AWS S3 direto | S3-compatível, roda local sem custo, mesmo SDK |
| **JWT + Refresh** | Sessions | Stateless, funciona em mobile, rotação de segurança |
