# BLOCO C — Arquitetura Futura de Microsserviços

## 1. QUANDO MIGRAR (Sinais de Trigger)

### Contexto: Começar com Monólito Modular

A abordagem correta para um marketplace em estágio inicial é **não usar microsserviços**. Comece com um monólito modular bem estruturado (NestJS com módulos isolados, shared kernel mínimo). A migração deve ser uma decisão estratégica baseada em evidências, não uma escolha arquitetural antecipada.

### Sinais que Justificam a Migração

#### Sinais de Time
- **Time > 15 engenheiros**: Conway's Law — se o time tem subequipes com responsabilidades distintas, a arquitetura deve refletir isso
- **Deploys causando conflito**: Mais de 3 equipes precisam coordenar deploys por semana
- **Onboarding > 2 semanas**: Novos engenheiros demoram muito para entender o sistema

#### Sinais de Volume
- **GMV > R$ 5M/mês**: Volume financeiro justifica isolamento do serviço de pagamentos
- **Transações > 50k/dia**: Gargalos de banco de dados no monólito
- **Usuários ativos > 100k**: Necessidade de escala diferenciada por componente

#### Sinais de Deploy
- **Frequência**: Precisa de deploy independente para componentes críticos (ex: notificações não devem esperar deploy de pagamentos)
- **Disponibilidade**: SLAs diferentes por componente (pagamentos 99.99% vs analytics 99.9%)

#### Análise de Custo/Benefício

| Custo da Migração | Benefício Esperado |
|---|---|
| 3-6 meses de engenharia | Deploy independente por serviço |
| Complexidade operacional (K8s, Service Mesh) | Escala granular |
| Latência de rede adicional | Isolamento de falhas |
| Debugging distribuído | Autonomia de times |
| Consistência eventual | Tecnologias diferentes por serviço |

**Regra prática**: Só migre quando o custo de **NÃO** migrar (lentidão, conflitos, outages) superar o custo da migração.

---

## 2. SEQUÊNCIA DE EXTRAÇÃO DE SERVIÇOS

### Padrão: Strangler Fig

O **Strangler Fig Pattern** (Martin Fowler) é a abordagem recomendada:
1. Novo serviço é criado em paralelo ao monólito
2. O tráfego é gradualmente redirecionado pelo API Gateway
3. O monólito "murcha" enquanto os microsserviços crescem
4. Nunca há um "big bang rewrite"

```
Mês 6-12:
[Monólito] → [API Gateway] → Extrai Notification Service
                            → Extrai Payment Service

Mês 12-18:
[Monólito Menor] → [API Gateway] → Notification Service
                                  → Payment Service
                                  → Extrai Identity Service
                                  → Extrai Booking Service

Mês 18-24:
[Core Monólito] → [API Gateway] → 8 Serviços Independentes
```

### Ordem de Extração e Rationale

| Ordem | Serviço | Razão | Risco |
|---|---|---|---|
| 1 | Notification Service | Sem estado de negócio, fácil de isolar | Baixo |
| 2 | Payment Service | Compliance, SLA 99.99%, auditoría | Médio |
| 3 | Identity Service | Reutilizável, gateway de autenticação | Médio |
| 4 | Booking Service | Core business, maior volume | Alto |
| 5 | Provider Service | Dados densos, matching dependency | Médio |
| 6 | Catalog Service | Read-heavy, cache-friendly | Baixo |
| 7 | Review Service | Eventual consistency OK | Baixo |
| 8 | Support Service | Baixa criticidade | Baixo |

### Avaliação de Risco por Serviço

**Notification Service** (Risco: BAIXO)
- Sem transações financeiras
- Falhas não são críticas (retry OK)
- Interface clara: recebe evento, envia mensagem

**Payment Service** (Risco: MÉDIO-ALTO)
- Dados financeiros sensíveis
- Integração com gateways (PagSeguro, Stripe)
- Precisa de 2-phase commit ou Saga pattern
- Requer isolamento total de rede

**Booking Service** (Risco: ALTO)
- Core do negócio
- Muitas dependências (inventory, pricing, notification, payment)
- Consistência forte necessária para estado do booking
- Necessita Saga pattern completo

---

## 3. MICROSSERVIÇOS DETALHADOS

### Identity Service

**Responsabilidade**: Autenticação, autorização, gestão de sessões e tokens

**Banco próprio**: PostgreSQL (users, roles, permissions, sessions, tokens)

**APIs expostas**:
- REST: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/verify-otp`
- gRPC: `ValidateToken(token) → UserClaims`, `GetUserPermissions(userId) → Permissions[]`

**Eventos emitidos**:
- `user.logged_in`, `user.logged_out`, `user.account_locked`, `token.revoked`

**Eventos consumidos**:
- `user.profile_updated` (para invalidar claims cacheadas)

**Consistência**: Forte — tokens devem ser validados em tempo real

**Observabilidade**:
- Métricas: login_attempts/s, token_validation_latency_p99, failed_auth_rate
- Alertas: failed_auth_rate > 10%, login_latency > 200ms

**Risco de acoplamento**: ALTO — todos os serviços dependem dele; deve ser extremamente estável

---

### User Service

**Responsabilidade**: Perfis de usuário, preferências, endereços, gestão de consentimento

**Banco próprio**: PostgreSQL (user_profiles, user_preferences, user_addresses, user_consents)

**APIs expostas**:
- REST: `GET /users/:id/profile`, `PUT /users/:id/profile`, `GET /users/:id/addresses`
- gRPC: `GetUserProfile(userId) → UserProfile`, `GetUserAddresses(userId) → Address[]`

**Eventos emitidos**:
- `user.profile_updated`, `user.address_added`, `user.deleted`

**Eventos consumidos**:
- `user.registered` (from Identity Service — cria perfil inicial)

**Consistência**: Eventual — perfil pode ter lag de segundos

**Observabilidade**:
- Métricas: profile_read_latency, address_geocoding_errors
- Cache: Redis com TTL 5min para perfis frequentemente acessados

**Risco de acoplamento**: MÉDIO

---

### Provider Service

**Responsabilidade**: Perfis de prestadores, verificação de documentos, disponibilidade, localização em tempo real

**Banco próprio**: PostgreSQL + PostGIS (provider_profiles, provider_documents, provider_availability, provider_locations)

**APIs expostas**:
- REST: `GET /providers/:id`, `PUT /providers/:id/availability`, `POST /providers/:id/location`
- gRPC: `GetProviderScore(providerId) → MatchingScore`, `GetAvailableProviders(lat, lng, categoryId, date) → Provider[]`

**Eventos emitidos**:
- `provider.verified`, `provider.suspended`, `provider.location_updated`, `provider.availability_changed`

**Eventos consumidos**:
- `booking.completed` (atualiza completion_rate), `review.published` (atualiza rating)

**Consistência**: Eventual para rating/stats, Forte para disponibilidade

**Observabilidade**:
- Métricas: providers_available_by_zone, verification_queue_size, location_update_lag
- PostGIS queries para busca geoespacial

**Risco de acoplamento**: MÉDIO-ALTO (usado pelo Search e Booking)

---

### Catalog Service

**Responsabilidade**: Categorias, serviços oferecidos por prestadores, preços, imagens

**Banco próprio**: PostgreSQL + Elasticsearch (para search)

**APIs expostas**:
- REST: `GET /categories`, `GET /categories/:id/services`, `GET /providers/:id/services`
- gRPC: `GetServiceDetails(serviceId) → Service`, `GetCategoryTree() → Category[]`

**Eventos emitidos**:
- `service.published`, `service.price_updated`, `service.deactivated`

**Eventos consumidos**:
- `provider.suspended` (desativa serviços do prestador)

**Consistência**: Eventual — mudanças de preço propagam em ~30s

**Observabilidade**:
- Cache hit rate para listagens de categorias (esperado > 95%)
- Elasticsearch index health

**Risco de acoplamento**: BAIXO (read-heavy, poucas dependências)

---

### Search & Discovery Service

**Responsabilidade**: Busca de prestadores por categoria/localização/disponibilidade, ranking, sugestões

**Banco próprio**: Elasticsearch + Redis (cache de resultados)

**APIs expostas**:
- REST: `GET /search?q=limpeza&lat=-23.5&lng=-46.6&date=2024-03-15`
- gRPC: `SearchProviders(SearchRequest) → RankedProviders[]`

**Eventos emitidos**:
- `search.performed`, `search.provider_clicked`

**Eventos consumidos**:
- `provider.verified`, `provider.location_updated`, `review.published`, `booking.completed`

**Consistência**: Eventual — índice atualizado assincronamente

**Observabilidade**:
- Métricas: search_latency_p99, zero_results_rate, click_through_rate
- Alertas: zero_results_rate > 20% para uma categoria

**Risco de acoplamento**: MÉDIO (consome dados de múltiplos serviços)

---

### Pricing Service

**Responsabilidade**: Cálculo de preços, taxas de serviço, preços dinâmicos, urgência, validação de cupons

**Banco próprio**: PostgreSQL (pricing_rules, service_fees, surge_configs)

**APIs expostas**:
- REST: `POST /pricing/calculate` (recebe serviceId, addressId, scheduledAt, couponCode)
- gRPC: `CalculatePrice(PriceRequest) → PriceBreakdown`

**Eventos emitidos**:
- `pricing.surge_activated`, `pricing.surge_deactivated`

**Eventos consumidos**:
- `zone.demand_spike` (ativa preço dinâmico), `coupon.created`

**Consistência**: Forte — preço calculado antes do booking deve ser o mesmo no checkout

**Observabilidade**:
- Métricas: price_calculation_latency, coupon_validation_errors, surge_factor_by_zone

**Risco de acoplamento**: MÉDIO (chamado síncronamente no fluxo de checkout)

---

### Booking Service

**Responsabilidade**: Criação e gestão do ciclo de vida de bookings, agendamento, recorrências

**Banco próprio**: PostgreSQL (bookings, booking_timeline, booking_tracking, recurring_bookings)

**APIs expostas**:
- REST: `POST /bookings`, `GET /bookings/:id`, `POST /bookings/:id/cancel`, `POST /bookings/:id/start`, `POST /bookings/:id/complete`
- gRPC: `GetBookingStatus(bookingId) → BookingStatus`, `GetProviderSchedule(providerId, date) → TimeSlots[]`

**Eventos emitidos**:
- `booking.created`, `booking.confirmed`, `booking.cancelled`, `booking.completed`, `booking.started`

**Eventos consumidos**:
- `payment.captured` (confirma booking), `payment.failed` (cancela booking)

**Consistência**: Forte — usa Saga pattern para coordenação com Payment

**Saga de Booking**:
```
1. booking.created → reserva slot no Provider Service
2. payment.authorized → confirma booking
3. booking.confirmed → emite notificação
4. [On failure] → libera slot + estorna pagamento
```

**Observabilidade**:
- Métricas: booking_completion_rate, avg_booking_value, cancellation_rate_by_reason

**Risco de acoplamento**: MUITO ALTO — centro do sistema

---

### Recurrence Service

**Responsabilidade**: Gestão de bookings recorrentes, geração automática de próximas ocorrências

**Banco próprio**: PostgreSQL (recurring_bookings, recurrence_schedule)

**APIs expostas**:
- REST: `POST /recurrences`, `GET /recurrences/:id`, `DELETE /recurrences/:id`
- Cron interno: executa diariamente para gerar próximos bookings

**Eventos emitidos**:
- `recurrence.booking_generated`, `recurrence.cancelled`, `recurrence.paused`

**Eventos consumidos**:
- `booking.cancelled` (pausa recorrência se cancelamento consecutivo)

**Consistência**: Eventual

**Observabilidade**:
- Métricas: recurrence_active_count, auto_booking_success_rate, recurrence_churn_rate

**Risco de acoplamento**: MÉDIO

---

### Payment Orchestration Service

**Responsabilidade**: Orquestração de pagamentos, integração com gateways, gestão de reembolsos

**Banco próprio**: PostgreSQL (payments, payment_attempts, refunds) — isolado por compliance PCI-DSS

**APIs expostas**:
- REST: `POST /payments/authorize`, `POST /payments/:id/capture`, `POST /payments/:id/refund`
- gRPC: `GetPaymentStatus(paymentId) → PaymentStatus`

**Eventos emitidos**:
- `payment.authorized`, `payment.captured`, `payment.failed`, `payment.refunded`

**Eventos consumidos**:
- `booking.created` (inicia autorização), `chargeback.received`

**Consistência**: Forte + Idempotência garantida (idempotency keys em todos os endpoints)

**Observabilidade**:
- Métricas: payment_success_rate, gateway_latency, refund_rate, chargeback_rate
- Alertas: payment_success_rate < 95%, chargeback_rate > 1%

**Risco de acoplamento**: ALTO (compliance, sem esse serviço nada funciona)

---

### Commission Service

**Responsabilidade**: Cálculo de comissões, regras por categoria/prestador/tier

**Banco próprio**: PostgreSQL (commissions, commission_rules, commission_tiers)

**APIs expostas**:
- gRPC: `CalculateCommission(bookingId, amount) → CommissionBreakdown`

**Eventos emitidos**:
- `commission.calculated`, `commission.adjusted`

**Eventos consumidos**:
- `booking.completed` (calcula comissão), `subscription.changed` (atualiza taxa)

**Consistência**: Eventual

**Risco de acoplamento**: BAIXO

---

### Payout Service

**Responsabilidade**: Repasse financeiro para prestadores, agendamento de transferências

**Banco próprio**: PostgreSQL (payouts, payout_schedules, bank_accounts)

**APIs expostas**:
- REST: `GET /providers/:id/payouts`, `POST /payouts/schedule`
- Cron interno: D+1, D+7, D+14 (conforme configuração do prestador)

**Eventos emitidos**:
- `payout.scheduled`, `payout.processed`, `payout.failed`

**Eventos consumidos**:
- `commission.calculated`, `booking.completed`

**Consistência**: Forte (operações financeiras)

**Observabilidade**:
- Métricas: payout_success_rate, payout_processing_time, failed_payout_rate

**Risco de acoplamento**: MÉDIO

---

### Trust & Safety Service

**Responsabilidade**: Detecção de fraude, gestão de disputas, content moderation, bloqueios

**Banco próprio**: PostgreSQL (disputes, content_flags, risk_scores, blocked_identities)

**APIs expostas**:
- REST: `POST /disputes`, `POST /flags`, `GET /risk-score/:userId`
- gRPC: `EvaluateRisk(UserId, ActionType) → RiskScore`

**Eventos emitidos**:
- `user.suspended`, `booking.disputed`, `fraud.detected`

**Eventos consumidos**:
- `payment.failed` (incrementa score de risco), `booking.cancelled` (padrões anômalos), `review.submitted`

**Consistência**: Eventual para risk scores, Forte para suspensões

**Observabilidade**:
- Métricas: dispute_rate, fraud_detection_rate, false_positive_rate

**Risco de acoplamento**: MÉDIO (transversal ao sistema)

---

### Review Service

**Responsabilidade**: Gestão de avaliações, moderação, cálculo de agregados

**Banco próprio**: PostgreSQL (reviews, review_responses, review_aggregates)

**APIs expostas**:
- REST: `POST /reviews`, `GET /providers/:id/reviews`, `POST /reviews/:id/response`
- gRPC: `GetProviderRating(providerId) → RatingAggregate`

**Eventos emitidos**:
- `review.published`, `review.hidden`, `provider.rating_updated`

**Eventos consumidos**:
- `booking.completed` (permite review), `trust.review_flagged` (oculta review)

**Consistência**: Eventual — rating atualiza em ~1min após nova review

**Observabilidade**:
- Métricas: review_submission_rate, moderation_queue_size, avg_rating_by_category

**Risco de acoplamento**: BAIXO

---

### Support Service

**Responsabilidade**: Tickets de suporte, FAQ, chatbot de 1º nível

**Banco próprio**: PostgreSQL (support_tickets, ticket_messages, knowledge_base)

**APIs expostas**:
- REST: `POST /tickets`, `GET /tickets/:id`, `POST /tickets/:id/messages`

**Eventos emitidos**:
- `ticket.created`, `ticket.resolved`, `ticket.escalated`

**Eventos consumidos**:
- `booking.disputed` (cria ticket automaticamente), `user.payment_failed` (cria ticket)

**Consistência**: Eventual

**Risco de acoplamento**: BAIXO

---

### Notification Service

**Responsabilidade**: Envio de push, email, SMS, WhatsApp, gestão de preferências de notificação

**Banco próprio**: PostgreSQL + Redis (notification_queue, delivery_status)

**APIs expostas**:
- gRPC: `SendNotification(NotificationRequest) → DeliveryId`
- REST: `GET /users/:id/notifications`, `POST /users/:id/notifications/read`

**Eventos emitidos**:
- `notification.sent`, `notification.delivered`, `notification.failed`

**Eventos consumidos**:
- TODOS os eventos relevantes do sistema (booking.confirmed, payment.captured, etc.)

**Providers integrados**: FCM (push), SendGrid (email), Twilio (SMS), Meta Business API (WhatsApp)

**Consistência**: Eventual — at-least-once delivery com deduplicação

**Observabilidade**:
- Métricas: delivery_rate_by_channel, unsubscribe_rate, notification_latency

**Risco de acoplamento**: BAIXO (puro consumidor de eventos)

---

### Localization Service

**Responsabilidade**: Gestão de áreas de serviço, zonas, configurações por cidade

**Banco próprio**: PostgreSQL + PostGIS (service_areas, service_zones, city_configs)

**APIs expostas**:
- gRPC: `GetZoneForLocation(lat, lng) → Zone`, `GetCityConfig(cityId) → Config`
- REST: `GET /areas`, `GET /areas/:id/zones`

**Eventos emitidos**:
- `area.launched`, `zone.surge_activated`

**Risco de acoplamento**: BAIXO-MÉDIO

---

### Campaign & Promotions Service

**Responsabilidade**: Gestão de campanhas, cupons, referrals, programa de fidelidade

**Banco próprio**: PostgreSQL (campaigns, coupons, coupon_usages, referrals)

**APIs expostas**:
- REST: `POST /coupons/validate`, `POST /referrals/apply`
- gRPC: `ValidateCoupon(code, userId, bookingAmount) → DiscountResult`

**Eventos emitidos**:
- `coupon.applied`, `referral.reward_earned`

**Eventos consumidos**:
- `booking.completed` (trigger para referral rewards)

**Consistência**: Forte para uso de cupons (sem uso duplo)

**Risco de acoplamento**: MÉDIO

---

### Analytics Ingestion Service

**Responsabilidade**: Coleta e armazenamento de eventos de analytics, ETL para data warehouse

**Banco próprio**: ClickHouse ou BigQuery (analytics_events, funnels, cohorts)

**APIs expostas**:
- REST: `POST /events` (tracking de clientes)
- Kafka consumer: todos os eventos do sistema

**Eventos consumidos**: TODOS (via Kafka topics)

**Consistência**: Eventual — dados podem ter lag de minutos

**Risco de acoplamento**: MUITO BAIXO (somente consumidor)

---

### Marketplace Intelligence Service

**Responsabilidade**: Insights de negócio, relatórios, dashboards operacionais, matching score computation

**Banco próprio**: PostgreSQL + Redis (provider_metrics, demand_forecasts, matching_features)

**APIs expostas**:
- gRPC: `GetProviderMatchingScore(providerId, context) → Score`
- REST: `GET /insights/demand-forecast?zone=xyz&date=2024-03-15`

**Eventos emitidos**:
- `matching.score_updated`, `demand.forecast_updated`

**Risco de acoplamento**: BAIXO (mostly read)

---

### Admin Ops Service

**Responsabilidade**: Painel administrativo, moderação, operações manuais, configurações do sistema

**Banco próprio**: Sem banco próprio — chama APIs dos outros serviços com permissões elevadas

**APIs expostas**:
- REST: Todos os endpoints de admin dos outros serviços via proxy + permissões

**Risco de acoplamento**: ALTO (depende de todos os serviços) — mas nunca em critical path

---

## 4. INFRAESTRUTURA DISTRIBUÍDA

### API Gateway

```yaml
# Kong configuração exemplo
services:
  - name: identity-service
    url: http://identity-service:3000
    routes:
      - name: auth-route
        paths:
          - /auth
    plugins:
      - name: rate-limiting
        config:
          second: 10
          minute: 300
      - name: jwt
        config:
          secret_is_base64: false
```

**Responsabilidades do Gateway**:
- Rate limiting por cliente/IP
- JWT validation (delegado ao Identity Service via plugin)
- Request routing
- SSL termination
- API versioning (v1, v2)
- Response caching para endpoints read-only
- Observabilidade (distributed tracing headers)

### Service Mesh (Istio)

```yaml
# VirtualService para Booking Service
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: booking-service
spec:
  hosts:
    - booking-service
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: booking-service
            subset: v2
          weight: 100
    - route:
        - destination:
            host: booking-service
            subset: v1
          weight: 90
        - destination:
            host: booking-service
            subset: v2
          weight: 10
```

### Service-to-Service Auth (mTLS + JWT)

```
┌─────────────────┐    mTLS tunnel     ┌─────────────────┐
│  Booking        │ ──────────────────→ │  Payment        │
│  Service        │  service JWT token  │  Service        │
│  (certificate)  │                     │  (certificate)  │
└─────────────────┘                     └─────────────────┘
```

- **mTLS**: Isito gerencia certificados automaticamente via cert-manager
- **Service JWT**: Token de curta duração (5min) assinado pelo Identity Service para chamadas S2S
- **Zero Trust**: Nenhum serviço confia em outro sem autenticação explícita

### Event Bus: Estrutura de Tópicos Kafka

```
# Naming convention: {domain}.{entity}.{action}
# Partitioning: by entity ID para ordering guarantees

marketplace.booking.created          # Particionado por booking_id
marketplace.booking.status_changed   # Particionado por booking_id
marketplace.payment.captured         # Particionado por payment_id
marketplace.payment.failed           # Particionado por payment_id
marketplace.provider.location_updated # Particionado por provider_id
marketplace.review.published         # Particionado por provider_id
marketplace.user.registered          # Particionado por user_id
marketplace.notification.requested   # Particionado por user_id

# Dead Letter Queues
marketplace.booking.created.dlq
marketplace.payment.captured.dlq
```

**Configurações de Retenção**:
- Eventos de negócio (booking, payment): 30 dias
- Eventos de analytics: 7 dias
- Eventos de localização: 1 dia

### Saga Pattern — Booking Saga

```typescript
// Choreography-based Saga usando Kafka
// Sem orquestrador central — cada serviço reage a eventos

class BookingCreatedHandler {
  async handle(event: BookingCreatedEvent) {
    // Payment Service reage a booking.created
    const auth = await paymentGateway.authorize({
      amount: event.totalCents,
      bookingId: event.bookingId,
      userId: event.clientId
    });

    if (auth.success) {
      await eventBus.publish('marketplace.payment.authorized', { bookingId: event.bookingId });
    } else {
      await eventBus.publish('marketplace.payment.failed', { bookingId: event.bookingId });
    }
  }
}

class PaymentAuthorizedHandler {
  async handle(event: PaymentAuthorizedEvent) {
    // Booking Service confirma o booking
    await bookingRepository.updateStatus(event.bookingId, 'CONFIRMED');
    await eventBus.publish('marketplace.booking.confirmed', { bookingId: event.bookingId });
  }
}

class PaymentFailedHandler {
  async handle(event: PaymentFailedEvent) {
    // Booking Service cancela
    await bookingRepository.updateStatus(event.bookingId, 'CANCELLED_SYSTEM');
    // Provider Service libera o slot
    await eventBus.publish('marketplace.booking.cancelled', { bookingId: event.bookingId });
  }
}
```

### Outbox Pattern

```typescript
// Garante at-least-once delivery mesmo em falhas de DB/Kafka

@Transaction()
async createBooking(dto: CreateBookingDto): Promise<Booking> {
  const booking = await this.bookingRepository.save(dto);

  // Salva o evento no outbox NA MESMA TRANSAÇÃO
  await this.outboxRepository.save({
    aggregateId: booking.id,
    aggregateType: 'Booking',
    eventType: 'booking.created',
    payload: JSON.stringify(booking),
  });

  return booking;
  // Commit da transação
  // Um worker separado lê o outbox e publica no Kafka
  // Após publicação bem-sucedida, marca como processed
}
```

### Circuit Breaker

```typescript
// Usando resilience4j ou cockatiel (Node.js)
const circuitBreaker = new CircuitBreaker({
  halfOpenAfterMs: 10000,     // Tenta novamente após 10s
  openAfterFailures: 5,        // Abre após 5 falhas
  closedAfterSuccesses: 2,     // Fecha após 2 sucessos
  timeout: 3000,               // Timeout por requisição
});

const result = await circuitBreaker.fire(
  () => paymentService.authorize(payload)
);

// Fallback quando o circuit está aberto
circuitBreaker.fallback = () => ({
  authorized: false,
  reason: 'payment_service_unavailable'
});
```

### Retry Policies + Dead Letter Queues

```typescript
// Exponential backoff com jitter
const retryPolicy = {
  maxAttempts: 4,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: 0.1
};

// DLQ após esgotar retries
consumer.on('error', async (message, error) => {
  if (message.attempts >= retryPolicy.maxAttempts) {
    await dlqProducer.send({
      topic: `${message.topic}.dlq`,
      messages: [{ ...message, error: error.message }]
    });
  } else {
    await retryProducer.send({
      topic: `${message.topic}.retry`,
      messages: [{ ...message, attempts: message.attempts + 1 }],
      delay: calculateDelay(message.attempts)
    });
  }
});
```

### Distributed Tracing (OpenTelemetry + Jaeger)

```typescript
// Setup no bootstrap de cada serviço
const tracer = opentelemetry.trace.getTracer('booking-service');

async function createBooking(req: Request) {
  const span = tracer.startSpan('booking.create');
  span.setAttributes({
    'booking.client_id': req.body.clientId,
    'booking.service_id': req.body.serviceId,
  });

  try {
    // Propagação automática de trace context via HTTP headers
    // Propagação manual via Kafka headers
    const result = await doWork(req.body);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

### Centralized Logging (ELK Stack)

```json
// Formato estruturado de log (JSON)
{
  "timestamp": "2024-03-15T10:30:00Z",
  "level": "ERROR",
  "service": "booking-service",
  "traceId": "abc123",
  "spanId": "def456",
  "userId": "user-uuid",
  "bookingId": "booking-uuid",
  "message": "Payment authorization failed",
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "gateway": "pagseguro"
  }
}
```

### Config e Secrets Management

```yaml
# HashiCorp Consul para configuração
consul:
  config:
    booking-service:
      max_booking_advance_days: 30
      cancellation_window_hours: 24

# HashiCorp Vault para secrets
vault:
  secrets:
    pagseguro/api_key: "..."
    stripe/webhook_secret: "..."
    database/booking_service: "..."
```

---

## 5. ESTRATÉGIA DE DADOS

### Database per Service

Cada serviço possui seu próprio banco de dados — **zero compartilhamento de schemas**.

| Serviço | Banco | Razão |
|---|---|---|
| Identity | PostgreSQL | ACID, relacional |
| Booking | PostgreSQL | ACID, transações |
| Payment | PostgreSQL | PCI-DSS compliance |
| Search | Elasticsearch | Full-text, geospatial |
| Provider Location | PostgreSQL + PostGIS | Geospatial queries |
| Analytics | ClickHouse | OLAP, columnar |
| Notifications | PostgreSQL + Redis | Queue + cache |

### CQRS Implementation

```typescript
// Command side (write)
@CommandHandler(CreateBookingCommand)
class CreateBookingHandler {
  async execute(command: CreateBookingCommand) {
    const booking = Booking.create(command);
    await this.bookingWriteRepository.save(booking);
    // Publica evento para atualizar read model
    await this.eventBus.publish(new BookingCreatedEvent(booking));
  }
}

// Query side (read) — modelo otimizado para leitura
@QueryHandler(GetBookingDetailQuery)
class GetBookingDetailHandler {
  async execute(query: GetBookingDetailQuery) {
    // Read model denormalizado — sem JOINs
    return this.bookingReadRepository.findDetailById(query.bookingId);
  }
}
```

### Data Consistency Entre Serviços

**Estratégia por caso de uso**:

| Operação | Estratégia | Latência |
|---|---|---|
| Criar booking | Saga + 2PC para pagamento | 2-5s |
| Atualizar rating | Evento → eventual | 30s-2min |
| Calcular comissão | Evento → eventual | 1-5min |
| Analytics | Batch ETL | 15min-1h |

---

## 6. DEPLOYMENT STRATEGY

### Kubernetes Architecture

```yaml
# Namespace por ambiente
namespaces:
  - production
  - staging
  - development

# Resource limits por tier
tiers:
  critical: # booking, payment, identity
    requests: { cpu: 250m, memory: 512Mi }
    limits: { cpu: 1000m, memory: 2Gi }
    replicas: { min: 3, max: 20 }

  standard: # review, notification, catalog
    requests: { cpu: 100m, memory: 256Mi }
    limits: { cpu: 500m, memory: 1Gi }
    replicas: { min: 2, max: 10 }

  background: # analytics, reports
    requests: { cpu: 50m, memory: 128Mi }
    limits: { cpu: 250m, memory: 512Mi }
    replicas: { min: 1, max: 5 }
```

### Blue/Green Deployments

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │ 100% traffic
              ┌──────────────┴──────────────┐
              ↓                             ↓
    ┌─────────────────┐         ┌─────────────────┐
    │  Blue (v1.2.0)  │         │  Green (v1.3.0) │
    │  [ACTIVE]       │         │  [STANDBY]      │
    └─────────────────┘         └─────────────────┘

# Após testes passarem no Green:
# 1. Redirecionar 10% do tráfego para Green
# 2. Monitorar erros/latência por 15 minutos
# 3. Se OK: 100% para Green, Blue vira Standby
```

### Canary Releases

Usar para features de alto risco (ex: novo algoritmo de matching):
- 1% do tráfego por 1 hora
- 10% do tráfego por 2 horas
- 50% por 4 horas
- 100% após aprovação de métricas

---

## 7. DIAGRAMA LÓGICO TEXTUAL

```
                    ┌─────────────────────────────┐
                    │         CLIENT APPS          │
                    │   (iOS, Android, Web)        │
                    └──────────────┬──────────────┘
                                   │ HTTPS/WSS
                    ┌──────────────▼──────────────┐
                    │         API GATEWAY          │
                    │    (Kong / AWS API GW)        │
                    │  Rate Limiting | Auth | TLS  │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼────┐    ┌────────▼──────┐   ┌────────▼──────┐
    │  Identity    │    │   Booking     │   │   Catalog     │
    │  Service     │    │   Service     │   │   Service     │
    └──────────────┘    └────────┬──────┘   └───────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼────┐   ┌────────▼──────┐  ┌────────▼──────┐
    │  Payment     │   │   Provider    │  │   Pricing     │
    │  Orchestr.   │   │   Service     │  │   Service     │
    └──────────────┘   └───────────────┘  └───────────────┘
              │
    ┌─────────▼────────────────────────────────────────────┐
    │                   KAFKA EVENT BUS                     │
    │  booking.* | payment.* | review.* | notification.*   │
    └──┬───────┬────────┬────────┬─────────┬───────────────┘
       │       │        │        │         │
    ┌──▼──┐ ┌──▼──┐ ┌───▼──┐ ┌──▼──┐ ┌────▼────┐
    │Notif│ │Revw │ │Analyt│ │Trust│ │ Admin   │
    │ Svc │ │ Svc │ │ Svc  │ │ Svc │ │  Ops    │
    └─────┘ └─────┘ └──────┘ └─────┘ └─────────┘
```

---

## 8. ROADMAP DE TRANSIÇÃO

### Fase 1 (Mês 6-12): Primeiros 3 Serviços

**Objetivos**: Validar infraestrutura, reduzir risco em áreas críticas

1. Configurar Kubernetes cluster (EKS/GKE)
2. Instalar Kafka, Istio, Kong
3. Extrair **Notification Service** (menor risco)
4. Extrair **Payment Service** (PCI-DSS compliance driver)
5. Extrair **Identity Service** (base para outros serviços)

**Critério de sucesso**: 3 serviços em produção, monólito ainda respondendo por 80% das requests

### Fase 2 (Mês 12-18): Core Business

**Objetivos**: Extrair os serviços com maior volume e complexidade

1. Extrair **Booking Service** (maior complexidade — implementar Saga pattern)
2. Extrair **Provider Service** (dependência do Search)
3. Extrair **Search & Discovery** (Elasticsearch cluster)
4. Extrair **Pricing Service** (crítico para checkout)
5. Extrair **Commission & Payout** (financeiro)

**Critério de sucesso**: Monólito gerencia apenas Catalog, Reviews, Support

### Fase 3 (Mês 18-24): Full Microservices + Multi-Region

1. Extrair serviços restantes (Catalog, Review, Support, Admin)
2. Configurar segunda região (São Paulo + Rio)
3. Implementar multi-region active-active para Identity e Booking
4. Descomissionar monólito
5. Implementar disaster recovery automatizado

---

## 9. ANTI-PATTERNS EM MICROSSERVIÇOS

### 1. Distributed Monolith
**O que é**: Chamar serviços síncronos em cadeia (A → B → C → D) para cada request
**Impacto**: Latência acumulada, falhas em cascata, tight coupling
**Solução**: Event-driven para operações não-críticas, circuit breaker, cache de dados

### 2. Shared Database
**O que é**: Dois serviços acessando a mesma tabela de banco de dados
**Impacto**: Coupling forte, impossibilidade de escalar independentemente
**Solução**: Cada serviço com seu banco, comunicação apenas via API/eventos

### 3. Too Fine-Grained Services (Nano-Services)
**O que é**: Criar microsserviços para funções simples ("UserAddressService", "UserPhoneService")
**Impacto**: Overhead operacional enorme, latência de rede desnecessária
**Solução**: Agrupar por domínio de negócio (User Service = profile + preferences + addresses)

### 4. Lack of API Versioning
**O que é**: Mudar contratos de API sem versionamento
**Impacto**: Quebrando outros serviços em produção
**Solução**: Sempre versionar APIs (/v1, /v2), suportar versão anterior por 6+ meses

### 5. Missing Circuit Breaker
**O que é**: Não implementar isolamento de falhas entre serviços
**Impacto**: Uma falha no Payment Service derruba o sistema inteiro
**Solução**: Circuit breaker em todas as chamadas S2S com fallback definido

### 6. Synchronous Communication for Everything
**O que é**: Usar REST/gRPC para operações que não precisam de resposta imediata
**Impacto**: Tight coupling, latência, maior fragilidade
**Solução**: Kafka para operações assíncronas (notificações, analytics, comissões)

### 7. No Idempotency
**O que é**: Operações que podem ser executadas mais de uma vez com resultados diferentes
**Impacto**: Cobranças duplicadas, bookings duplicados, estados inconsistentes
**Solução**: Idempotency keys obrigatórias para todas as operações de escrita

### 8. Missing Distributed Tracing
**O que é**: Logs sem correlation IDs, impossível debugar uma transação distribuída
**Impacto**: MTTR (Mean Time To Recover) altíssimo, debugging em produção impossível
**Solução**: OpenTelemetry obrigatório desde o dia 1 dos microsserviços

### 9. God Service
**O que é**: Um serviço que sabe demais sobre o domínio de outros (ex: Booking Service que valida CPF, calcula comissão, envia email)
**Impacto**: Não tem os benefícios de microsserviços, tem todos os custos
**Solução**: Bounded contexts claros, eventos para cross-domain communication

### 10. No Contract Testing
**O que é**: Mudanças de API sem testes de contrato entre consumidor e produtor
**Impacto**: Quebras de integração descobertas apenas em produção
**Solução**: Pact.io ou schema registries (Confluent para Kafka) para contract testing

---

## 10. RISCOS DA MIGRAÇÃO

### Riscos Operacionais

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Equipe sem experiência em K8s/Kafka | Alta | Alto | Treinamento + contratar SRE experiente |
| Aumento de custo de infraestrutura 3-5x | Alta | Médio | Budget aprovado antes de iniciar |
| Debugging distribuído mais difícil | Certa | Médio | OpenTelemetry + Jaeger desde o início |
| Runbooks desatualizados | Média | Alto | Revisão obrigatória após cada extração |

### Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Inconsistência de dados durante migração | Média | Crítico | Strangler Fig + testes de reconciliação |
| Latência aumentada por rede | Alta | Médio | Cache agressivo, gRPC para S2S |
| Data loss em Kafka (consumer lag) | Baixa | Crítico | Monitoring de consumer lag, alertas |
| Falha no Saga (compensação incompleta) | Média | Alto | Testes de chaos engineering |

### Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Feature velocity reduzida durante migração | Certa | Alto | Feature freeze durante extrações críticas |
| Outage durante migração | Média | Crítico | Blue/green obrigatório, rollback automático |
| Time não consegue operar a nova infraestrutura | Média | Alto | Runbooks + SRE dedicado |
| Custo > benefício no prazo esperado | Média | Alto | Revisão trimestral do roadmap |
