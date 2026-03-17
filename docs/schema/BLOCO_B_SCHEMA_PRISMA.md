# BLOCO B — Schema Prisma Avançado: Arquitetura de Dados

> **124 modelos | 20 domínios | PostgreSQL 16 + PostGIS**
> Referência técnica completa do banco de dados para o marketplace de serviços.

---

## 1. VISÃO GERAL DO SCHEMA

### 1.1 Filosofia de Design

O schema foi projetado com os seguintes princípios:

**1. Domain Isolation**
Cada domínio de negócio possui suas tabelas claramente separadas. A regra: se você deletar um domínio inteiro, as tabelas dos outros domínios devem continuar funcionando (exceto chaves estrangeiras explícitas).

**2. UUID por Toda Parte**
Todos os IDs são UUIDs gerados pelo PostgreSQL (`gen_random_uuid()`). Benefícios:
- Sem exposição de contagem de registros (segurança)
- Merge de dados entre ambientes sem conflito de ID
- Federação futura entre serviços sem colisão

**3. Soft Delete Seletivo**
Apenas entidades com regras de negócio que exijam histórico têm `deleted_at`. Tabelas de log/evento não possuem soft delete — são append-only.

**4. Temporal Tracking Completo**
`created_at`, `updated_at` (com `@updatedAt` automático do Prisma), e `deleted_at` em todas as entidades principais. Isso viabiliza auditoria, análise de coorte e compliance LGPD.

**5. Indexes Estratégicos**
Todo `@@index` foi planejado com base nos padrões de query mais frequentes:
- FK index em todas as chaves estrangeiras (evitar table scan em JOINs)
- Composite indexes para queries de filtragem composta (ex: `[status, scheduled_at]`)
- Partial indexes implícitos via filtragem na aplicação

**6. Normalização Seletiva**
- Dados transacionais (preços, comissões): totalmente normalizados
- Dados de exibição frequente (nome da categoria num evento): desnormalizados via snapshot
- Dados históricos (trust score history): append-only, nunca update

---

### 1.2 Contagem de Modelos por Domínio

| # | Domínio | Modelos | Descrição |
|---|---------|---------|-----------|
| 1 | Identity & Access | 16 | Auth, sessões, permissões, MFA |
| 2 | User Profile | 5 | Perfil, preferências, endereços |
| 3 | Provider Profile | 13 | Prestador, documentos, portfolio |
| 4 | Service Catalog | 8 | Categorias, serviços, extras |
| 5 | Booking & Scheduling | 9 | Pedidos, fotos, orçamentos, recorrência |
| 6 | Payments & Finance | 13 | Pagamentos, comissões, repasses, NF |
| 7 | Reviews & Ratings | 5 | Avaliações, tags, snapshots |
| 8 | Search & Discovery | 5 | Logs, favoritos, impressões |
| 9 | Notifications | 4 | Templates, envios, preferências |
| 10 | Promotions & Loyalty | 9 | Cupons, campanhas, pontos |
| 11 | Trust & Safety | 7 | Trust score, fraude, disputas |
| 12 | Support | 5 | Tickets, FAQ, CSAT |
| 13 | Chat & Messaging | 4 | Salas, mensagens, reações |
| 14 | B2B & Enterprise | 5 | Organizações, contratos, NF |
| 15 | Analytics & Events | 4 | Eventos, funis, receita |
| 16 | A/B Testing | 2 | Experimentos, atribuições |
| 17 | Integrations | 2 | Webhooks |
| 18 | Audit | 1 | Log de auditoria |
| 19 | Platform Config | 4 | Feature flags, configs, país |
| 20 | Localization & Geo | 3 | Áreas, zonas, preços por zona |
| | **TOTAL** | **124** | |

---

## 2. DIAGRAMA DE DOMÍNIOS E DEPENDÊNCIAS

```
                      ┌─────────────────┐
                      │  IDENTITY &     │
                      │  ACCESS         │
                      │  (User, Role,   │
                      │  Permission)    │
                      └────────┬────────┘
                               │ user_id
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐    ┌────────▼──────┐    ┌───────▼──────┐
   │  USER       │    │  PROVIDER     │    │  B2B &       │
   │  PROFILE    │    │  PROFILE      │    │  ENTERPRISE  │
   │  (Profile,  │    │  (Profile,    │    │  (Org,       │
   │  Prefs,     │    │  Docs, Avail) │    │  Contract)   │
   │  Address)   │    └───────┬───────┘    └──────┬───────┘
   └──────┬──────┘            │                   │
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────▼────────┐
                    │  SERVICE CATALOG │
                    │  (Category,      │
                    │  Service, Extra) │
                    └─────────┬────────┘
                              │
                    ┌─────────▼────────┐
                    │    SEARCH &      │
                    │    MATCHING      │
                    │  (Search, Impr.) │
                    └─────────┬────────┘
                              │
                    ┌─────────▼────────┐
                    │    BOOKING &     │
                    │   SCHEDULING     │◄── PROMOTIONS
                    │  (Booking, Photo,│    (Coupon, Loyalty)
                    │  Quote, Recur.)  │
                    └────────┬─────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
    ┌────────▼──────┐ ┌──────▼─────┐ ┌──────▼──────┐
    │  PAYMENTS &   │ │  REVIEWS & │ │  TRUST &    │
    │  FINANCE      │ │  RATINGS   │ │  SAFETY     │
    │  (Payment,    │ │  (Review,  │ │  (Score,    │
    │  Payout, NF)  │ │  Tag)      │ │  Fraud)     │
    └───────────────┘ └────────────┘ └─────────────┘
             │
   ┌─────────▼──────────────────────────────────────────┐
   │                  EVENT BUS (Kafka/EventEmitter)     │
   │  booking.* | payment.* | review.* | provider.*     │
   └──────┬──────────┬────────────┬──────────┬──────────┘
          │          │            │          │
   ┌──────▼──┐ ┌─────▼───┐ ┌─────▼──┐ ┌────▼────────┐
   │ NOTIF.  │ │ SUPPORT │ │ CHAT   │ │  ANALYTICS  │
   │         │ │         │ │        │ │  & A/B TEST │
   └─────────┘ └─────────┘ └────────┘ └─────────────┘
```

---

## 3. DOMÍNIOS EM DETALHE

### Domínio 1 — Identity & Access (16 modelos)

**Responsabilidade**: Tudo relacionado a autenticação, autorização e gestão de identidade.

**Modelos**:
| Modelo | Propósito |
|--------|-----------|
| `users` | Entidade central — todo usuário da plataforma |
| `roles` | Papéis como "client", "provider", "admin", "support" |
| `permissions` | Granular: `payments:read`, `bookings:cancel` |
| `user_roles` | M2M com expiração de papel |
| `role_permissions` | M2M: quais permissões cada papel tem |
| `user_sessions` | Sessões web/mobile com device tracking |
| `refresh_tokens` | Tokens de refresh com rotation automática |
| `otp_codes` | Códigos de verificação (SMS, email, WhatsApp) |
| `auth_providers` | OAuth: Google, Facebook, Apple |
| `devices` | Dispositivos registrados com push token |
| `login_attempts` | Rate limiting e detecção de força bruta |
| `blocked_identities` | IPs, emails, telefones banidos |
| `security_events` | Log de eventos críticos de segurança |
| `user_consents` | LGPD: consentimentos registrados por versão |
| `api_keys` | Chaves de API para integrações B2B |
| `mfa_devices` | TOTP authenticator, backup codes |

**Decisões de design**:
- `users` é thin — sem nome, sem endereço. Tudo em `user_profiles` e `user_addresses`.
- `email` e `phone` são opcionais em `users` — suporte a login por OAuth sem email cadastrado
- `api_keys` armazenam apenas o hash da chave (nunca o valor original)
- `user_sessions` têm TTL explícito — não confiar só no JWT expiry

```prisma
// Padrão de consulta frequente: validar token
// Query: UserSession.findUnique({ where: { token_hash } })
// Index: @@index([token_hash]) — busca O(log n) pelo hash

// Padrão: verificar permissões de um usuário
// Query: UserRole.findMany com include Role.permissions
// Index: @@unique([user_id, role_id]) evita duplicação
```

---

### Domínio 3 — Provider Profile (13 modelos)

**Responsabilidade**: Perfil completo do prestador, desde documentação até disponibilidade e gamificação.

**Modelos**:
| Modelo | Propósito |
|--------|-----------|
| `provider_profiles` | Dados principais: rating, taxa, verificação |
| `provider_documents` | Documentos enviados para KYC |
| `provider_locations` | Histórico de localização (GPS pings) |
| `provider_availability` | Disponibilidade por dia da semana/hora |
| `provider_subscriptions` | Histórico de assinaturas (FREE/BASIC/PRO) |
| `provider_bank_accounts` | Contas bancárias para repasse |
| `provider_portfolio` | Fotos de trabalhos anteriores |
| `provider_certifications` | CREA, CRO, outros certificados profissionais |
| `provider_insurance` | Seguros de responsabilidade civil |
| `provider_working_areas` | Bairros/cidades de atuação |
| `provider_price_configs` | Preços configurados por categoria |
| `provider_levels` | Definição dos níveis (Bronze → Diamond) |
| `provider_level_history` | Histórico de progressão de nível |

**Por que `provider_locations` cresce rápido?**
Um prestador ativo com 10 bookings/dia gera ~150 location pings/dia. Com 10.000 prestadores ativos: 1.5M rows/dia = 45M rows/mês. **Estratégia de particionamento obrigatório** (veja seção 7).

---

### Domínio 5 — Booking & Scheduling (9 modelos)

**O domínio mais crítico do sistema.**

| Modelo | Propósito |
|--------|-----------|
| `bookings` | O pedido principal — estado central |
| `booking_timeline` | Histórico de todas as mudanças de status |
| `booking_tracking` | GPS do prestador durante o serviço |
| `booking_photos` | Fotos antes/depois do serviço |
| `booking_extras` | Extras selecionados (ex: "limpar forno +R$30") |
| `booking_answers` | Respostas às perguntas do serviço |
| `booking_quotes` | Orçamentos (aprovação antes de confirmar) |
| `recurring_bookings` | Plano de recorrência (quinzenal, mensal) |
| `recurring_booking_pauses` | Pausas na recorrência |

**State Machine do Booking**:
```
PENDING_PAYMENT
    │ payment captured
    ▼
PAYMENT_AUTHORIZED
    │ provider accepts
    ▼
CONFIRMED
    │ provider leaves for job
    ▼
PROVIDER_EN_ROUTE
    │ provider checks in
    ▼
IN_PROGRESS
    │ provider checks out
    ▼
COMPLETED ──────────────────── DISPUTED
    │                              │
    ▼                              ▼
(review window)           (dispute resolution)
                              │         │
                    RESOLVED_CLIENT  RESOLVED_PROVIDER
```

**Cancelamentos possíveis de qualquer estado** (exceto COMPLETED/REFUNDED):
- `CANCELLED_CLIENT`: cancelado pelo cliente
- `CANCELLED_PROVIDER`: cancelado pelo prestador (penaliza score)
- `CANCELLED_SYSTEM`: cancelado por falha de pagamento ou sistema

---

### Domínio 6 — Payments & Finance (13 modelos)

**O domínio mais sensível — PCI-DSS compliance obrigatório.**

| Modelo | Propósito |
|--------|-----------|
| `payments` | Transação de pagamento principal |
| `saved_cards` | Cartões tokenizados (nunca armazenar PAN) |
| `commissions` | Registro da comissão por booking |
| `payouts` | Repasses financeiros para prestadores |
| `wallets` | Saldo virtual por usuário |
| `wallet_transactions` | Ledger de movimentações do wallet |
| `payment_refunds` | Detalhamento de reembolsos |
| `invoices` | Faturas para clientes B2B |
| `invoice_items` | Itens da fatura (line items) |
| `provider_earnings` | Ledger de ganhos do prestador |
| `withholding_tax` | Registros de IR/ISS retido |
| `provider_payout_schedules` | Configuração de frequência de repasse |
| `chargeback_records` | Chargebacks recebidos de gateways |

**Padrão Financeiro Crítico — Idempotência**:
```sql
-- Toda operação financeira tem idempotency_key único
-- Garantia: se a requisição for repetida, o resultado é o mesmo

ALTER TABLE payments ADD CONSTRAINT payments_idempotency_key_unique
  UNIQUE (idempotency_key);

-- Exemplo: idempotency_key = "booking_{id}_attempt_{n}"
-- Se o frontend tentar pagar duas vezes, o segundo INSERT falha com conflict
-- O backend retorna o pagamento original (sem cobrar duas vezes)
```

**Reconciliação diária**:
```sql
-- Query de reconciliação: soma deve bater com dados do gateway
SELECT
  DATE(paid_at) as date,
  gateway,
  COUNT(*) as count,
  SUM(amount_cents) as total_cents
FROM payments
WHERE status = 'CAPTURED'
  AND paid_at >= NOW() - INTERVAL '1 day'
GROUP BY 1, 2
ORDER BY 1, 2;
```

---

### Domínio 11 — Trust & Safety (7 modelos)

**Infraestrutura de confiança — o moat mais difícil de replicar.**

| Modelo | Propósito |
|--------|-----------|
| `disputes` | Disputas abertas sobre bookings |
| `content_flags` | Denúncias de conteúdo impróprio |
| `trust_scores` | Score de confiança atual por usuário |
| `trust_score_history` | Histórico de variações com rastreabilidade |
| `background_checks` | Registros de checagem de antecedentes |
| `fraud_signals` | Sinais de comportamento suspeito |
| `risk_cases` | Casos de risco abertos para revisão manual |

**Como o Trust Score é calculado**:
```
TrustScore (0-100) =
  identity_score (0-30)    × 0.30  +  # verificação de documento + selfie
  reputation_score (0-40)  × 0.40  +  # rating + completion + reviews
  behavior_score (0-20)    × 0.20  +  # sem disputas, sem fraude
  seniority_score (0-10)   × 0.10     # tempo na plataforma

Thresholds de ação automática:
  < 20: bloquear conta (fraud_detected)
  < 35: suspender conta (pending_review)
  35-50: operação com restrições (limited)
  50-70: operação normal (verified)
  > 70: operação expandida (trusted)
  > 90: badge premium (elite)
```

---

## 4. PADRÕES DE QUERY CRÍTICOS

### 4.1 Busca de Prestadores (Matching)

```sql
-- Query central do matching: prestadores disponíveis por geo + categoria + horário
-- Executada em < 100ms com os índices corretos

SELECT
  pp.id,
  pp.overall_rating,
  pp.total_completions,
  pp.completion_rate,
  pp.acceptance_rate,
  pp.service_radius_km,
  pl.latitude,
  pl.longitude,
  -- Distância em km (PostGIS)
  ST_Distance(
    ST_MakePoint(pl.longitude, pl.latitude)::geography,
    ST_MakePoint($client_lng, $client_lat)::geography
  ) / 1000 AS distance_km
FROM provider_profiles pp
-- Última localização conhecida
JOIN LATERAL (
  SELECT latitude, longitude
  FROM provider_locations
  WHERE provider_id = pp.id
  ORDER BY recorded_at DESC
  LIMIT 1
) pl ON true
-- Serve a categoria solicitada
JOIN provider_categories pc ON pc.provider_id = pp.id
  AND pc.category_id = $category_id
-- Está disponível no horário solicitado
JOIN provider_availability pa ON pa.provider_id = pp.id
  AND pa.day_of_week = $day_of_week
  AND pa.start_time <= $time
  AND pa.end_time > $time
  AND pa.is_available = true
WHERE
  pp.verification_status = 'APPROVED'
  AND pp.is_available = true
  AND pp.deleted_at IS NULL
  -- Dentro do raio do prestador
  AND ST_DWithin(
    ST_MakePoint(pl.longitude, pl.latitude)::geography,
    ST_MakePoint($client_lng, $client_lat)::geography,
    pp.service_radius_km * 1000
  )
ORDER BY distance_km ASC
LIMIT 20;
```

### 4.2 Dashboard do Prestador (Ganhos)

```sql
-- Resumo de ganhos do prestador nos últimos 30 dias
SELECT
  DATE_TRUNC('week', b.scheduled_at) AS week,
  COUNT(b.id) AS bookings_completed,
  SUM(pe.gross_amount_cents) AS gross_cents,
  SUM(pe.commission_cents) AS commission_cents,
  SUM(pe.net_amount_cents) AS net_cents,
  AVG(r.rating) AS avg_rating
FROM bookings b
JOIN provider_earnings pe ON pe.booking_id = b.id
LEFT JOIN reviews r ON r.booking_id = b.id
  AND r.reviewed_id = b.provider_id
WHERE
  b.provider_id = $provider_id
  AND b.status = 'COMPLETED'
  AND b.scheduled_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1;
```

### 4.3 Feed de Bookings do Cliente

```sql
-- Histórico paginado do cliente com status e próximas recorrências
SELECT
  b.id,
  b.status,
  b.scheduled_at,
  b.total_cents,
  ps.name AS service_name,
  c.name AS category_name,
  up.display_name AS provider_name,
  up.avatar_url AS provider_avatar,
  pp.overall_rating AS provider_rating,
  r.rating AS my_rating,
  r.id IS NOT NULL AS has_review,
  rb.id IS NOT NULL AS has_recurrence
FROM bookings b
JOIN provider_services ps ON ps.id = b.service_id
JOIN categories c ON c.id = ps.category_id
JOIN provider_profiles pp ON pp.id = b.provider_id
JOIN user_profiles up ON up.user_id = pp.user_id
LEFT JOIN reviews r ON r.booking_id = b.id
  AND r.reviewer_id = b.client_id
LEFT JOIN recurring_bookings rb ON rb.id = b.recurrence_id
WHERE
  b.client_id = $client_id
  AND b.deleted_at IS NULL
ORDER BY b.scheduled_at DESC
LIMIT 20
OFFSET $offset;
```

### 4.4 Trust Score Update (após evento)

```sql
-- Chamado após cada evento relevante (booking concluído, review recebida, etc.)
-- Executado assincronamente via background job

WITH scores AS (
  SELECT
    u.id AS user_id,

    -- identity_score: verificação de documentos (0-30)
    CASE
      WHEN pp.verification_status = 'APPROVED' THEN 30.0
      WHEN pp.verification_status = 'SUBMITTED' THEN 15.0
      ELSE 5.0
    END AS identity_score,

    -- reputation_score: rating + completion (0-40)
    LEAST(40.0,
      (pp.overall_rating - 1.0) / 4.0 * 25.0 +  -- rating component (0-25)
      pp.completion_rate * 15.0                    -- completion component (0-15)
    ) AS reputation_score,

    -- behavior_score: sem disputas/fraudes (0-20)
    GREATEST(0.0, 20.0 -
      (SELECT COUNT(*) * 5.0 FROM disputes d
        JOIN bookings b ON b.id = d.booking_id
        WHERE b.provider_id = pp.id AND d.status != 'RESOLVED_PROVIDER')
    ) AS behavior_score,

    -- seniority_score: tempo na plataforma (0-10)
    LEAST(10.0,
      EXTRACT(EPOCH FROM NOW() - u.created_at) / (86400 * 365) * 10.0
    ) AS seniority_score

  FROM users u
  JOIN provider_profiles pp ON pp.user_id = u.id
  WHERE u.id = $user_id
)
INSERT INTO trust_scores (user_id, score, identity_score, reputation_score,
                          behavior_score, seniority_score, computed_at, updated_at)
SELECT
  user_id,
  identity_score + reputation_score + behavior_score + seniority_score,
  identity_score, reputation_score, behavior_score, seniority_score,
  NOW(), NOW()
FROM scores
ON CONFLICT (user_id) DO UPDATE SET
  score = EXCLUDED.score,
  identity_score = EXCLUDED.identity_score,
  reputation_score = EXCLUDED.reputation_score,
  behavior_score = EXCLUDED.behavior_score,
  seniority_score = EXCLUDED.seniority_score,
  computed_at = NOW(),
  updated_at = NOW();
```

---

## 5. ESTRATÉGIA DE INDEXES

### 5.1 Indexes Críticos por Padrão de Query

```sql
-- BOOKINGS: os mais consultados
CREATE INDEX idx_bookings_client_status
  ON bookings(client_id, status, scheduled_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_bookings_provider_status
  ON bookings(provider_id, status, scheduled_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_bookings_scheduled_active
  ON bookings(scheduled_at)
  WHERE status IN ('CONFIRMED', 'PROVIDER_EN_ROUTE', 'IN_PROGRESS');

-- PROVIDER LOCATIONS: geospatial
CREATE INDEX idx_provider_locations_geo
  ON provider_locations USING GIST(
    ST_MakePoint(longitude, latitude)::geography
  );

CREATE INDEX idx_provider_locations_recent
  ON provider_locations(provider_id, recorded_at DESC);

-- PAYMENTS: reconciliação e status
CREATE INDEX idx_payments_status_date
  ON payments(status, paid_at DESC)
  WHERE status = 'CAPTURED';

-- TRUST SCORE HISTORY: séries temporais
CREATE INDEX idx_trust_score_history_user_date
  ON trust_score_history(user_id, created_at DESC);

-- ANALYTICS EVENTS: análise por evento e data
CREATE INDEX idx_analytics_events_name_date
  ON analytics_events(event_name, created_at DESC);

-- NOTIFICATIONS: inbox do usuário
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;
```

### 5.2 Indexes Compostos para Matching

```sql
-- Para a query de matching (busca de prestadores):
-- Suporte ao join de available + category em um único scan

CREATE INDEX idx_provider_availability_composite
  ON provider_availability(provider_id, day_of_week, is_available)
  WHERE is_available = true;

CREATE INDEX idx_provider_categories_lookup
  ON provider_categories(category_id, provider_id);

CREATE INDEX idx_provider_profiles_matching
  ON provider_profiles(verification_status, is_available, overall_rating DESC)
  WHERE verification_status = 'APPROVED' AND is_available = true AND deleted_at IS NULL;
```

---

## 6. PARTICIONAMENTO DE TABELAS

Para suportar crescimento acelerado, algumas tabelas exigem particionamento antes de atingir 100M rows.

### 6.1 Tabelas que crescem rápido

| Tabela | Crescimento Estimado | Estratégia |
|--------|---------------------|------------|
| `analytics_events` | 10M rows/mês | RANGE por `created_at` (mensal) |
| `provider_locations` | 45M rows/mês | RANGE por `recorded_at` (diário) |
| `audit_logs` | 5M rows/mês | RANGE por `created_at` (mensal) |
| `booking_tracking` | 5M rows/mês | RANGE por `recorded_at` (diário) |
| `trust_score_history` | 2M rows/mês | RANGE por `created_at` (mensal) |

### 6.2 Implementação de Particionamento

```sql
-- Exemplo: analytics_events particionado por mês
CREATE TABLE analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Criação das partições (automatizar com pg_partman)
CREATE TABLE analytics_events_2024_01
  PARTITION OF analytics_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE analytics_events_2024_02
  PARTITION OF analytics_events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- pg_partman: criar partições automaticamente
SELECT partman.create_parent(
  p_parent_table := 'public.analytics_events',
  p_control := 'created_at',
  p_type := 'native',
  p_interval := 'monthly',
  p_premake := 3  -- criar 3 meses à frente
);
```

---

## 7. MIGRAÇÕES E VERSIONAMENTO

### 7.1 Fluxo de Migração com Prisma

```bash
# Desenvolvimento: criar migração a partir de mudanças no schema
npx prisma migrate dev --name "add_organization_contracts"

# Produção: aplicar migrações existentes
npx prisma migrate deploy

# Verificar status das migrações
npx prisma migrate status
```

### 7.2 Migrações Perigosas — Checklist

Antes de executar qualquer migração em produção:

```
PRE-MIGRATION CHECKLIST:
  □ Backup do banco criado e verificado
  □ Migração testada em staging com dados reais (snapshot)
  □ Janela de manutenção comunicada (se necessária)
  □ Rollback plan documentado
  □ Tempo estimado de execução calculado (EXPLAIN ANALYZE)
  □ Lock timeout configurado (evitar bloqueio prolongado)

OPERAÇÕES DE ALTO RISCO:
  ✗ DROP COLUMN (dados perdidos)
  ✗ ALTER TYPE de enum (pode bloquear tabela)
  ✗ ADD COLUMN NOT NULL sem DEFAULT (bloqueia toda a tabela)
  ✗ CREATE INDEX sem CONCURRENTLY (bloqueia writes)
  ✗ RENAME TABLE (quebra aplicações sem rolling deploy)

OPERAÇÕES SEGURAS:
  ✓ ADD COLUMN nullable
  ✓ CREATE INDEX CONCURRENTLY
  ✓ ADD CONSTRAINT VALID (validação assíncrona)
  ✓ DROP INDEX CONCURRENTLY
```

### 7.3 Estratégia para Schema Changes Zero-Downtime

```
FASE 1 — Backward compatible change
  Adicionar nova coluna/tabela que o código antigo ignora
  Deployar código novo que escreve em ambos (old + new)

FASE 2 — Data migration
  Backfill da nova estrutura com dados históricos
  Script em batch, sem lock de tabela (UPDATE ... LIMIT 1000)

FASE 3 — Switch
  Deployar código que lê apenas da nova estrutura
  Verificar que código antigo não está mais em produção

FASE 4 — Cleanup
  Remover coluna/tabela antiga em próxima janela de manutenção
```

---

## 8. SEED DATA E CONFIGURAÇÕES INICIAIS

### 8.1 Dados Obrigatórios para Operação

```typescript
// prisma/seed.ts — executado após migrate deploy

async function seedRoles() {
  const roles = [
    { name: 'Client', slug: 'client', is_system: true },
    { name: 'Provider', slug: 'provider', is_system: true },
    { name: 'Admin', slug: 'admin', is_system: true },
    { name: 'Support Agent', slug: 'support_agent', is_system: true },
    { name: 'Finance', slug: 'finance', is_system: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {},
      create: role,
    });
  }
}

async function seedCategories() {
  // Categorias de primeiro nível
  const rootCategories = [
    { name: 'Limpeza', slug: 'limpeza', commission_rate: 0.22, sort_order: 1 },
    { name: 'Reformas', slug: 'reformas', commission_rate: 0.18, sort_order: 2 },
    { name: 'Elétrica', slug: 'eletrica', commission_rate: 0.20, sort_order: 3 },
    { name: 'Encanamento', slug: 'encanamento', commission_rate: 0.20, sort_order: 4 },
    { name: 'Beleza', slug: 'beleza', commission_rate: 0.25, sort_order: 5 },
    { name: 'Jardinagem', slug: 'jardinagem', commission_rate: 0.21, sort_order: 6 },
    { name: 'Animais', slug: 'animais', commission_rate: 0.22, sort_order: 7 },
    { name: 'Saúde & Bem-estar', slug: 'saude', commission_rate: 0.23, sort_order: 8 },
  ];
  // ...
}

async function seedProviderLevels() {
  const levels = [
    { name: 'BRONZE', label: 'Bronze', min_completions: 0, min_rating: 0, min_months: 0,
      benefits: { max_active_services: 5, visibility_boost: 0 } },
    { name: 'SILVER', label: 'Prata', min_completions: 50, min_rating: 4.0, min_months: 3,
      benefits: { max_active_services: 10, visibility_boost: 5, fee_discount: 0.01 } },
    { name: 'GOLD', label: 'Ouro', min_completions: 200, min_rating: 4.3, min_months: 6,
      benefits: { max_active_services: 20, visibility_boost: 10, fee_discount: 0.02 } },
    { name: 'PLATINUM', label: 'Platina', min_completions: 500, min_rating: 4.5, min_months: 12,
      benefits: { max_active_services: 50, visibility_boost: 20, fee_discount: 0.03 } },
    { name: 'DIAMOND', label: 'Diamante', min_completions: 1000, min_rating: 4.7, min_months: 24,
      benefits: { max_active_services: 999, visibility_boost: 35, fee_discount: 0.05 } },
  ];
  // ...
}

async function seedSystemConfig() {
  const configs = [
    { key: 'matching.default_radius_km', value: '10', description: 'Raio padrão de busca' },
    { key: 'matching.max_results', value: '20', description: 'Máximo de prestadores retornados' },
    { key: 'payment.service_fee_cents', value: '500', description: 'Taxa de serviço fixa (R$5)' },
    { key: 'payment.urgency_multiplier', value: '1.20', description: 'Multiplicador de urgência' },
    { key: 'payout.minimum_cents', value: '5000', description: 'Mínimo para saque (R$50)' },
    { key: 'trust.min_score_active', value: '35', description: 'Score mínimo para operar' },
    { key: 'review.window_hours', value: '72', description: 'Horas para deixar avaliação' },
  ];
  // ...
}
```

---

## 9. LGPD E DATA PRIVACY

### 9.1 Campos PII por Tabela

```
DADOS PII (Personally Identifiable Information):
  users.email                    → ALTO (identificador único)
  users.phone                    → ALTO (identificador único)
  users.password_hash            → CRÍTICO (nunca expor)
  user_profiles.first_name       → MÉDIO
  user_profiles.last_name        → MÉDIO
  user_profiles.birth_date       → MÉDIO
  user_profiles.avatar_url       → BAIXO
  user_addresses.*               → ALTO (localização física)
  provider_profiles.cpf_cnpj     → CRÍTICO (documento fiscal)
  provider_bank_accounts.*       → CRÍTICO (dados financeiros)
  saved_cards.card_token         → CRÍTICO (dados de pagamento)
  devices.push_token             → BAIXO

ESTRATÉGIA DE PROTEÇÃO:
  1. Encryption at rest: RDS encryption habilitado (AES-256 via AWS KMS)
  2. Encryption in transit: TLS 1.3 obrigatório
  3. Masking em logs: never log PII (interceptor global)
  4. Pseudonymization: analytics events usam hashed user_id
  5. Data minimization: campos opcionais, coletar apenas o necessário
```

### 9.2 Implementação do Direito de Exclusão (LGPD Art. 18)

```typescript
// Soft delete + anonimização em cascata
async function anonymizeUser(userId: string): Promise<void> {
  const anonymizedEmail = `deleted_${userId}@anonymized.invalid`;
  const anonymizedPhone = null;

  await prisma.$transaction([
    // Anonimizar dados do usuário
    prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        phone: anonymizedPhone,
        password_hash: null,
        deleted_at: new Date(),
      },
    }),
    // Limpar perfil
    prisma.userProfile.update({
      where: { user_id: userId },
      data: {
        first_name: 'Usuário',
        last_name: 'Removido',
        display_name: 'Usuário Removido',
        avatar_url: null,
        bio: null,
        birth_date: null,
      },
    }),
    // Revogar sessões ativas
    prisma.userSession.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    }),
    // Revogar tokens
    prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    }),
    // Deletar endereços (PII sensível)
    prisma.userAddress.updateMany({
      where: { user_id: userId },
      data: { deleted_at: new Date() },
    }),
    // Registrar a exclusão no audit log
    prisma.auditLog.create({
      data: {
        actor_id: userId,
        action: 'DELETE',
        entity_type: 'User',
        entity_id: userId,
        new_values: { reason: 'LGPD deletion request' },
      },
    }),
  ]);

  // Nota: bookings, pagamentos e reviews são mantidos por obrigação legal
  // (compliance fiscal, 5 anos), mas desvinculados da identidade pessoal
}
```

---

## 10. ÍNDICE COMPLETO DE MODELOS

### Todos os 124 modelos ordenados alfabeticamente

| Modelo (Prisma) | Tabela (DB) | Domínio |
|-----------------|-------------|---------|
| AbTest | ab_tests | A/B Testing |
| AbTestAssignment | ab_test_assignments | A/B Testing |
| AnalyticsEvent | analytics_events | Analytics |
| ApiKey | api_keys | Identity |
| AuditLog | audit_logs | Audit |
| AuthProvider | auth_providers | Identity |
| BackgroundCheck | background_checks | Trust & Safety |
| BlockedIdentity | blocked_identities | Identity |
| Booking | bookings | Booking |
| BookingAnswer | booking_answers | Booking |
| BookingExtra | booking_extras | Booking |
| BookingPhoto | booking_photos | Booking |
| BookingQuote | booking_quotes | Booking |
| BookingTimeline | booking_timeline | Booking |
| BookingTracking | booking_tracking | Booking |
| Campaign | campaigns | Promotions |
| Category | categories | Catalog |
| CategorySearchIndex | category_search_index | Catalog |
| ChargebackRecord | chargeback_records | Payments |
| ChatMessage | chat_messages | Chat |
| ChatRoom | chat_rooms | Chat |
| ChatRoomParticipant | chat_room_participants | Chat |
| Commission | commissions | Payments |
| ContentFlag | content_flags | Trust & Safety |
| ConversionEvent | conversion_events | Analytics |
| CountryConfig | country_configs | Platform |
| Coupon | coupons | Promotions |
| CouponUsage | coupon_usages | Promotions |
| Device | devices | Identity |
| Dispute | disputes | Trust & Safety |
| FeatureFlag | feature_flags | Platform |
| FraudSignal | fraud_signals | Trust & Safety |
| Invoice | invoices | Payments |
| InvoiceItem | invoice_items | Payments |
| KnowledgeBaseArticle | knowledge_base_articles | Support |
| LoginAttempt | login_attempts | Identity |
| LoyaltyProgram | loyalty_programs | Promotions |
| LoyaltyRedemption | loyalty_redemptions | Promotions |
| LoyaltyTier | loyalty_tiers | Promotions |
| LoyaltyTransaction | loyalty_transactions | Promotions |
| MessageReaction | message_reactions | Chat |
| MfaDevice | mfa_devices | Identity |
| Notification | notifications | Notifications |
| NotificationPreference | notification_preferences | Notifications |
| NotificationTemplate | notification_templates | Notifications |
| Organization | organizations | B2B |
| OrganizationContract | organization_contracts | B2B |
| OrganizationInvoice | organization_invoices | B2B |
| OrganizationLocation | organization_locations | B2B |
| OrganizationMember | organization_members | B2B |
| OtpCode | otp_codes | Identity |
| Payment | payments | Payments |
| PaymentRefund | payment_refunds | Payments |
| Payout | payouts | Payments |
| Permission | permissions | Identity |
| PlatformAnnouncement | platform_announcements | Platform |
| ProviderAvailability | provider_availability | Provider |
| ProviderBankAccount | provider_bank_accounts | Provider |
| ProviderCertification | provider_certifications | Provider |
| ProviderCategory | provider_categories | Catalog |
| ProviderEarning | provider_earnings | Payments |
| ProviderImpression | provider_impressions | Search |
| ProviderInsurance | provider_insurances | Provider |
| ProviderLevel | provider_levels | Provider |
| ProviderLevelHistory | provider_level_history | Provider |
| ProviderLocation | provider_locations | Provider |
| ProviderMetricSnapshot | provider_metric_snapshots | Analytics |
| ProviderPayoutSchedule | provider_payout_schedules | Payments |
| ProviderPortfolio | provider_portfolios | Provider |
| ProviderPriceConfig | provider_price_configs | Provider |
| ProviderProfile | provider_profiles | Provider |
| ProviderRatingSnapshot | provider_rating_snapshots | Reviews |
| ProviderSponsoredListing | provider_sponsored_listings | Promotions |
| ProviderSubscription | provider_subscriptions | Provider |
| ProviderWorkingArea | provider_working_areas | Provider |
| PushToken | push_tokens | Notifications |
| RecentSearch | recent_searches | Search |
| RecurringBooking | recurring_bookings | Booking |
| RecurringBookingPause | recurring_booking_pauses | Booking |
| Referral | referrals | Promotions |
| RefreshToken | refresh_tokens | Identity |
| RevenueEvent | revenue_events | Analytics |
| Review | reviews | Reviews |
| ReviewResponse | review_responses | Reviews |
| ReviewTag | review_tags | Reviews |
| ReviewTagAssignment | review_tag_assignments | Reviews |
| RiskCase | risk_cases | Trust & Safety |
| Role | roles | Identity |
| RolePermission | role_permissions | Identity |
| SavedCard | saved_cards | Payments |
| SavedProvider | saved_providers | Search |
| SearchLog | search_logs | Search |
| SearchSuggestion | search_suggestions | Search |
| SecurityEvent | security_events | Identity |
| ServiceArea | service_areas | Geo |
| ServiceExtra | service_extras | Catalog |
| ServicePackage | service_packages | Catalog |
| ServiceQuestion | service_questions | Catalog |
| ServiceQuestionOption | service_question_options | Catalog |
| ServiceZone | service_zones | Geo |
| SupportCategory | support_categories | Support |
| SupportCsat | support_csats | Support |
| SupportTicket | support_tickets | Support |
| SupportTicketMessage | support_ticket_messages | Support |
| SystemConfig | system_configs | Platform |
| TrustScore | trust_scores | Trust & Safety |
| TrustScoreHistory | trust_score_history | Trust & Safety |
| User | users | Identity |
| UserAddress | user_addresses | Profile |
| UserBadge | user_badges | Profile |
| UserConsent | user_consents | Identity |
| UserNotificationSchedule | user_notification_schedules | Profile |
| UserPreference | user_preferences | Profile |
| UserProfile | user_profiles | Profile |
| UserRole | user_roles | Identity |
| UserSession | user_sessions | Identity |
| Wallet | wallets | Payments |
| WalletTransaction | wallet_transactions | Payments |
| WebhookDelivery | webhook_deliveries | Integrations |
| WebhookEndpoint | webhook_endpoints | Integrations |
| WithholdingTax | withholding_taxes | Payments |
| ZonePricing | zone_pricings | Geo |

---

## 11. REFERÊNCIAS

- `schema.prisma` — Schema Prisma completo e executável (mesmo diretório)
- `BLOCO_A_ARQUITETURA_STARTUP.md` — Arquitetura técnica completa
- `BLOCO_C_MICROSERVICES.md` — Evolução para microsserviços
- `BLOCO_D_AI_MATCHING.md` — Feature store para matching por ML
- `BLOCO_E_VALUATION.md` — Estratégia de crescimento e valuation
