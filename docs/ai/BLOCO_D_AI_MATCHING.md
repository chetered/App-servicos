# BLOCO D — Sistema de IA de Matching de Prestadores

## 1. OVERVIEW ESTRATÉGICO

### Por que o Matching é o Moat Central

Em um marketplace de serviços, a qualidade do matching é **o principal driver de valor** e o moat mais difícil de replicar por competidores. Eis o porquê:

**Para o cliente**:
- Matching perfeito = serviço de qualidade na primeira vez = confiança = retenção
- Matching ruim = experiência ruim = churn = reputação negativa
- Um cliente bem matchado faz 6-12 bookings/ano. Um mal matchado faz 1 e some.

**Para o prestador**:
- Bom matching = agenda cheia = renda estável = lealdade à plataforma
- Matching justo = distribuição equilibrada de trabalho = prestadores satisfeitos
- Prestadores satisfeitos atraem mais prestadores (word of mouth)

**Para o negócio**:
- Fill rate (% de buscas que viram booking) é o KPI mais importante
- Cada 1% de melhoria no fill rate = crescimento direto de GMV
- Dados de matching acumulados são impossíveis de replicar — leva anos de operação real

**O Data Flywheel**:
```
Mais clientes → Mais bookings → Mais dados de resultado
      ↑                                      ↓
Melhor matching ← Modelos melhores ← Labels de qualidade
```

---

## 2. ARQUITETURA DO SISTEMA (3 FASES)

### FASE 1 — Heurística + Weighted Scoring (MVP, meses 0-6)

**Premissa**: Sem dados históricos suficientes para treinar modelos. Usar regras baseadas em conhecimento de domínio.

**Arquitetura**:
```
Request de busca
      ↓
[1] FILTROS HARD (eliminação imediata)
      ↓
[2] SCORING PONDERADO (ranking)
      ↓
[3] ORDENAÇÃO + DIVERSIFICAÇÃO
      ↓
Resultados rankeados
```

**Filtros Hard (eliminação antes do scoring)**:
- Distância > raio de serviço do prestador
- Prestador não verificado
- Slot indisponível na data/hora solicitada
- Categoria não atendida
- Prestador suspenso ou com score de trust < threshold

**Fórmula de Score**:
```
MatchScore = w1*distancia_score +
             w2*rating_score +
             w3*completion_score +
             w4*acceptance_score +
             w5*availability_score +
             w6*trust_score +
             w7*recurrence_bonus +
             w8*price_competitiveness
```

**Pesos Recomendados**:
```
w1 (distância)           = 0.20  # Clientes priorizam conveniência
w2 (rating)              = 0.25  # Qualidade é o fator mais importante
w3 (completion_rate)     = 0.20  # Prestador que termina o que começa
w4 (acceptance_rate)     = 0.10  # Prestador responsivo
w5 (disponibilidade)     = 0.10  # Disponível no horário desejado
w6 (trust_score)         = 0.10  # Verificação, tempo na plataforma
w7 (recurrence_bonus)    = 0.03  # Já atendeu esse cliente antes
w8 (price_competitive.)  = 0.02  # Preço vs média da categoria

# Soma = 1.00
```

### FASE 2 — Modelos Supervisionados (Growth, meses 6-18)

**Premissa**: Com 10k+ bookings completados, há dados suficientes para treinar modelos de ranking.

**Estratégia de Coleta de Dados**:
```
Labels a coletar desde o Dia 1:
- booking_accepted (prestador aceitou a proposta)
- booking_completed (serviço foi completado)
- client_returned_30d (cliente voltou em 30 dias)
- rating_given (nota dada pelo cliente)
- recurrence_created (cliente criou recorrência)
```

**Feature Store — 50+ Features**:

*Batch Features (atualizadas diariamente):*
```
provider_rating_30d              # Média de rating nos últimos 30 dias
provider_rating_90d              # Média de rating nos últimos 90 dias
provider_completion_rate_30d     # Taxa de conclusão últimos 30 dias
provider_completion_rate_90d     # Taxa de conclusão últimos 90 dias
provider_acceptance_rate_7d      # Taxa de aceite últimos 7 dias
provider_response_time_median_7d # Tempo mediano de resposta
provider_no_show_rate_90d        # Taxa de no-show (não comparecimento)
provider_cancellation_rate_30d   # Taxa de cancelamento iniciado pelo prestador
provider_bookings_total          # Total histórico de bookings
provider_revenue_30d_cents       # Receita gerada nos últimos 30 dias
provider_category_specialization # Score de especialização na categoria
provider_zone_density            # Quantidade de serviços na zona do cliente
client_category_preference_score # Histórico de preferências do cliente
client_avg_booking_value         # Ticket médio do cliente
client_booking_frequency_30d     # Frequência de compra do cliente
client_churn_risk_score          # Probabilidade de churn
provider_new_client_conversion   # Taxa de conversão com novos clientes
```

*Near Real-time Features (atualizadas a cada hora):*
```
provider_active_today            # Prestador está ativo hoje?
zone_demand_score                # Demanda na zona neste momento
zone_supply_ratio                # Ratio oferta/demanda na zona
provider_bookings_today_count    # Bookings do prestador hoje
category_fill_rate_1h            # Fill rate da categoria na última hora
provider_last_activity_hours     # Horas desde última atividade
```

*Real-time Features (ao vivo):*
```
provider_current_location_lat    # Localização atual (último ping)
provider_current_location_lng
distance_to_client_km            # Distância calculada em tempo real
client_current_location_lat
client_current_location_lng
time_slot_availability           # Disponibilidade exata do slot
provider_response_streak         # Respostas consecutivas rápidas
```

**Modelo Escolhido: LightGBM para Ranking**

*Por que LightGBM sobre XGBoost ou Neural Networks?*
- Treina 10x mais rápido que XGBoost em datasets grandes
- Melhor performance em features categóricas e missing values
- Menor consumo de memória em serving
- Interpretável (SHAP values) — essencial para fairness auditing
- Suporte nativo a `lambdarank` (otimização direta para ranking)

```python
import lightgbm as lgb

# Treino com LambdaRank
params = {
    'objective': 'lambdarank',
    'metric': 'ndcg',
    'ndcg_eval_at': [5, 10],  # Avaliar NDCG@5 e NDCG@10
    'num_leaves': 127,
    'min_data_in_leaf': 100,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'num_iterations': 500,
    'early_stopping_rounds': 50,
}

# Query groups para LTR (Learning to Rank)
train_data = lgb.Dataset(
    X_train,
    label=relevance_scores,  # 0=não aceito, 1=aceito, 2=completado, 3=recorrência
    group=query_groups,      # Agrupamento por sessão de busca
    feature_name=feature_names,
    categorical_feature=['category_id', 'day_of_week', 'provider_plan']
)
```

**Pipeline de Treinamento**:
```
[Feature Extraction] → [Data Validation] → [Model Training]
        ↓                                          ↓
[Feature Store]                           [Model Registry]
                                                   ↓
[A/B Test Assignment] ← [Shadow Mode] ← [Model Validation]
        ↓
[Gradual Rollout] → [Production]
```

**Serving Architecture**:
```
Search Request
      ↓
[Feature Fetcher] ← Redis (real-time features)
      |            ← PostgreSQL (batch features)
      ↓
[LightGBM Model] (< 10ms per request)
      ↓
[Re-ranker] (fairness + diversification)
      ↓
Response
```

**A/B Testing Framework**:
```typescript
class MatchingABTest {
  async getRankedProviders(
    searchContext: SearchContext,
    userId: string
  ): Promise<Provider[]> {
    const variant = await abTestService.getVariant('matching_v2', userId);

    if (variant === 'control') {
      return this.heuristicMatcher.rank(searchContext);
    } else if (variant === 'treatment') {
      return this.lightgbmMatcher.rank(searchContext);
    }
  }
}

// Métricas por variante:
// - Fill rate (% buscas → booking)
// - Booking completion rate
// - Client return rate (30d)
// - Provider acceptance rate
// - Average revenue per search
```

### FASE 3 — Otimização Multiobjetivo (Scale, 18+ meses)

**Objetivos simultâneos**:
```
maximize: conversion_probability (curto prazo)
maximize: client_ltv (longo prazo)
maximize: provider_fairness (distribuição equitativa)
subject to: response_time < 100ms
```

**Contextual Bandits**:
- Em vez de treinar um modelo fixo, aprender online com cada interação
- Exploração/exploitação balanceada (Thompson Sampling ou UCB)
- Personalização em tempo real sem retreinar

**Multi-objective Optimization**:
```python
# Pareto frontier entre objetivos
def multi_objective_score(provider, context):
    conversion_score = model_conversion.predict(features)
    ltv_score = model_ltv.predict(features)
    fairness_score = calculate_fairness(provider, context)

    # Pesos configuráveis por admin
    weights = get_weights_from_config()

    return (
        weights['conversion'] * conversion_score +
        weights['ltv'] * ltv_score +
        weights['fairness'] * fairness_score
    )
```

**Supply-side Fairness**:
- Nenhum prestador pode receber mais de X% dos bookings da sua zona
- Prestadores novos recebem "boost" artificial para coletar dados iniciais
- Distribuição de trabalho monitorada e ajustada automaticamente

---

## 3. FEATURE STORE CONCEITUAL

### Arquitetura

```
┌─────────────────────────────────────────────────┐
│                  FEATURE STORE                   │
├──────────────┬──────────────────┬────────────────┤
│  Batch Layer │  Near-RT Layer   │  Online Layer  │
│  (BigQuery)  │  (Kafka+Flink)   │  (Redis)       │
│  Update: 1d  │  Update: 1h      │  Update: live  │
├──────────────┴──────────────────┴────────────────┤
│               Feature Registry                   │
│  (metadata, versions, lineage, monitoring)       │
└─────────────────────────────────────────────────┘
         ↑                      ↓
   Feature Pipelines       ML Serving
   (Airflow/Prefect)       (FastAPI)
```

### Feature Groups

**ProviderPerformanceFeatures** (batch, daily):
```python
@feature_group(
    name="provider_performance",
    entity="provider_id",
    online_store=True,
    offline_store=True,
    ttl_seconds=86400  # 24h
)
class ProviderPerformanceFeatures:
    rating_30d: float
    rating_90d: float
    completion_rate_30d: float
    completion_rate_90d: float
    acceptance_rate_7d: float
    response_time_median_7d_seconds: int
    no_show_rate_90d: float
    cancellation_rate_provider_30d: float
    total_bookings_lifetime: int
    revenue_30d_cents: int
    category_specialization_score: float
```

**ZoneDemandFeatures** (near real-time, hourly):
```python
@feature_group(
    name="zone_demand",
    entity="zone_id",
    online_store=True,
    ttl_seconds=3600  # 1h
)
class ZoneDemandFeatures:
    demand_score_1h: float
    supply_ratio_1h: float
    fill_rate_1h: float
    avg_wait_time_minutes: float
    surge_factor: float
```

**ProviderRealtimeFeatures** (online, live):
```python
@feature_group(
    name="provider_realtime",
    entity="provider_id",
    online_store=True,
    ttl_seconds=300  # 5 min
)
class ProviderRealtimeFeatures:
    current_latitude: float
    current_longitude: float
    is_active_now: bool
    bookings_today: int
    last_active_minutes_ago: int
    current_slot_availability: bool
```

---

## 4. FÓRMULA DETALHADA FASE 1

### Implementação TypeScript/NestJS

```typescript
// matching/matching.service.ts

interface MatchingContext {
  clientId: string;
  categoryId: string;
  addressId: string;
  scheduledAt: Date;
  clientLatitude: number;
  clientLongitude: number;
}

interface ProviderScore {
  providerId: string;
  totalScore: number;
  breakdown: {
    distanceScore: number;
    ratingScore: number;
    completionScore: number;
    acceptanceScore: number;
    availabilityScore: number;
    trustScore: number;
    recurrenceBonus: number;
    priceCompetitiveness: number;
  };
}

@Injectable()
export class MatchingService {
  private readonly WEIGHTS = {
    distance: 0.20,
    rating: 0.25,
    completion: 0.20,
    acceptance: 0.10,
    availability: 0.10,
    trust: 0.10,
    recurrence: 0.03,
    price: 0.02,
  };

  async rankProviders(
    context: MatchingContext,
    candidates: Provider[]
  ): Promise<ProviderScore[]> {
    const categoryAvgPrice = await this.getCategoryAvgPrice(context.categoryId);
    const prevProviders = await this.getClientPreviousProviders(context.clientId);

    const scores = candidates.map(provider => {
      const breakdown = {
        distanceScore: this.calcDistanceScore(
          context.clientLatitude,
          context.clientLongitude,
          provider.lastKnownLatitude,
          provider.lastKnownLongitude,
          provider.serviceRadiusKm
        ),
        ratingScore: this.calcRatingScore(provider.overallRating, provider.totalReviews),
        completionScore: this.calcCompletionScore(provider.completionRate),
        acceptanceScore: this.calcAcceptanceScore(provider.acceptanceRate),
        availabilityScore: this.calcAvailabilityScore(provider, context.scheduledAt),
        trustScore: this.calcTrustScore(provider),
        recurrenceBonus: prevProviders.includes(provider.id) ? 1.0 : 0.0,
        priceCompetitiveness: this.calcPriceCompetitiveness(
          provider.basePrice,
          categoryAvgPrice
        ),
      };

      const total =
        this.WEIGHTS.distance * breakdown.distanceScore +
        this.WEIGHTS.rating * breakdown.ratingScore +
        this.WEIGHTS.completion * breakdown.completionScore +
        this.WEIGHTS.acceptance * breakdown.acceptanceScore +
        this.WEIGHTS.availability * breakdown.availabilityScore +
        this.WEIGHTS.trust * breakdown.trustScore +
        this.WEIGHTS.recurrence * breakdown.recurrenceBonus +
        this.WEIGHTS.price * breakdown.priceCompetitiveness;

      return { providerId: provider.id, totalScore: total, breakdown };
    });

    // Ordenar por score decrescente
    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Score de distância: normalização exponencial decrescente
   * distância = 0km → score = 1.0
   * distância = 5km → score ~0.6
   * distância = radius → score = 0.1
   */
  private calcDistanceScore(
    clientLat: number, clientLng: number,
    providerLat: number, providerLng: number,
    radiusKm: number
  ): number {
    const distanceKm = this.haversineDistance(clientLat, clientLng, providerLat, providerLng);

    if (distanceKm > radiusKm) return 0; // Hard filter já removeu, mas por segurança

    // Exponential decay: score = e^(-lambda * distance)
    const lambda = Math.log(10) / radiusKm; // Decai para 0.1 no limite do raio
    return Math.exp(-lambda * distanceKm);
  }

  /**
   * Score de rating: bayesian average para evitar overfitting em poucos reviews
   * Bayesian avg = (C * m + sum_ratings) / (C + n)
   * C = prior (média global da plataforma)
   * m = número de reviews necessários para confiar plenamente
   * n = número de reviews do prestador
   */
  private calcRatingScore(rating: number, totalReviews: number): number {
    const GLOBAL_AVERAGE = 4.0; // Prior baseado na média da plataforma
    const CONFIDENCE_REVIEWS = 20; // Após 20 reviews, confiar na média real

    const bayesianRating =
      (CONFIDENCE_REVIEWS * GLOBAL_AVERAGE + rating * totalReviews) /
      (CONFIDENCE_REVIEWS + totalReviews);

    // Normalizar: 1.0 = 5.0 estrelas, 0.0 = 1.0 estrela
    return Math.max(0, (bayesianRating - 1.0) / 4.0);
  }

  /**
   * Score de completion: logística suave para evitar penalizar novos prestadores
   */
  private calcCompletionScore(completionRate: number): number {
    // Valores esperados: 85-99%
    // Abaixo de 70% → penalizar fortemente
    if (completionRate >= 0.95) return 1.0;
    if (completionRate >= 0.90) return 0.85;
    if (completionRate >= 0.85) return 0.70;
    if (completionRate >= 0.80) return 0.50;
    if (completionRate >= 0.70) return 0.25;
    return 0.05; // Muito abaixo da média
  }

  /**
   * Score de acceptance: prestador que aceita trabalhos consistentemente
   */
  private calcAcceptanceScore(acceptanceRate: number): number {
    return Math.pow(acceptanceRate, 2); // Penaliza desproporcionalmente baixo acceptance
  }

  /**
   * Score de disponibilidade: considera horário preferido e gaps na agenda
   */
  private calcAvailabilityScore(provider: Provider, scheduledAt: Date): number {
    const hour = scheduledAt.getHours();
    const dayOfWeek = scheduledAt.getDay();

    const slot = provider.availabilitySlots.find(
      s => s.dayOfWeek === dayOfWeek &&
           this.timeToMinutes(s.startTime) <= hour * 60 &&
           this.timeToMinutes(s.endTime) > hour * 60
    );

    if (!slot) return 0; // Não disponível

    // Bonus se o prestador tem poucos bookings nesse dia (menos disputado)
    const bookingDensity = provider.bookingsToday / provider.avgDailyCapacity;
    return Math.max(0.3, 1.0 - bookingDensity * 0.5);
  }

  /**
   * Score de confiança: combinação de verificação, tempo na plataforma, histórico de segurança
   */
  private calcTrustScore(provider: Provider): number {
    let score = 0;

    // Verificação de identidade: 40% do trust score
    if (provider.verificationStatus === 'APPROVED') score += 0.4;
    else if (provider.verificationStatus === 'SUBMITTED') score += 0.2;

    // Tempo na plataforma: 20% (maturidade)
    const monthsActive = this.monthsSince(provider.createdAt);
    score += Math.min(0.2, monthsActive / 24 * 0.2);

    // Sem disputes abertas: 20%
    if (provider.openDisputesCount === 0) score += 0.2;
    else score += Math.max(0, 0.2 - provider.openDisputesCount * 0.05);

    // Plano ativo (skin in the game): 20%
    if (provider.subscriptionPlan !== 'FREE') score += 0.2;

    return score;
  }

  /**
   * Competitividade de preço vs média da categoria
   * Abaixo da média = mais competitivo = score maior
   */
  private calcPriceCompetitiveness(
    providerPrice: number,
    categoryAvgPrice: number
  ): number {
    if (!categoryAvgPrice || categoryAvgPrice === 0) return 0.5;

    const ratio = providerPrice / categoryAvgPrice;
    if (ratio <= 0.8) return 1.0;   // 20%+ abaixo da média
    if (ratio <= 0.95) return 0.75; // 5-20% abaixo
    if (ratio <= 1.05) return 0.5;  // Na média (±5%)
    if (ratio <= 1.20) return 0.25; // 5-20% acima
    return 0.0;                     // 20%+ acima da média
  }

  private haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad = (deg: number) => deg * (Math.PI / 180);
  private timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
}
```

---

## 5. DADOS E EVENTOS NECESSÁRIOS

### Eventos a Coletar do Dia 1

```typescript
// Todos esses eventos devem ser instrumentados desde o MVP

// Funil de busca
'search.performed'          // query, lat, lng, categoryId, results_count
'search.provider_viewed'    // provider_id, position, context
'search.provider_clicked'   // provider_id, position (CTR)

// Funil de booking
'booking.initiated'         // (cliente clicou em "agendar")
'booking.details_filled'    // (preencheu data/hora/endereço)
'booking.price_viewed'      // (viu o preço)
'booking.payment_started'   // (clicou em pagar)
'booking.created'           // LABEL: conversion = 1
'booking.provider_accepted' // LABEL: acceptance = 1
'booking.provider_rejected' // LABEL: acceptance = 0
'booking.completed'         // LABEL: completion = 1
'booking.cancelled_provider' // LABEL: reliability = -1

// Feedback
'review.submitted'          // rating, comment (LABEL: quality)
'recurrence.created'        // LABEL: satisfaction (forte sinal)
'client.returned_30d'       // LABEL: ltv predictor

// Provider behavior
'provider.app_opened'       // atividade
'provider.location_updated' // disponibilidade real
'provider.viewed_request'   // awareness
'provider.response_time'    // velocidade de resposta
```

### Tabelas para Popular

Para ML, os dados mais críticos a coletar com qualidade:

```sql
-- Capture a posição de cada resultado mostrado
-- FUNDAMENTAL para debiasing do modelo de ranking
CREATE TABLE search_impressions (
  search_id UUID,
  provider_id UUID,
  position INT,          -- Posição no ranking (1 = primeiro)
  score FLOAT,           -- Score do matching naquele momento
  was_clicked BOOLEAN,
  was_booked BOOLEAN,
  features_snapshot JSONB, -- Snapshot das features usadas
  created_at TIMESTAMPTZ
);
```

### Métricas a Trackear (Dashboard de Matching)

```
Métricas de Negócio:
- Fill Rate: % de buscas que resultam em booking (target: >40%)
- Search-to-Book time: minutos entre busca e confirmação
- Zero-results Rate: % de buscas sem resultados (target: <5%)

Métricas de Qualidade:
- NDCG@5: normalização do ranking pelo ranking ideal
- MRR (Mean Reciprocal Rank): posição média do prestador escolhido
- Click-through Rate por posição

Métricas de Fairness:
- Gini coefficient de distribuição de bookings por prestador
- Top-10% concentration: % de bookings no top 10% dos prestadores
- New provider booking rate nos primeiros 30 dias
```

---

## 6. COLD START STRATEGY

### Novo Prestador (sem histórico)

**Problema**: Sem rating, completion rate, acceptance rate — score seria mínimo.

**Solução — Bootstrapping em 3 fases**:

**Fase 1 (0-10 bookings): Onboarding Boost**
```typescript
function getNewProviderBoost(provider: Provider): number {
  const bookingsSinceJoining = provider.totalBookings;

  if (bookingsSinceJoining < 5) return 0.3;  // +30% no score final
  if (bookingsSinceJoining < 10) return 0.2; // +20%
  if (bookingsSinceJoining < 20) return 0.1; // +10%
  return 0; // Sem boost após 20 bookings
}
```

**Fase 2 (10-30 bookings): Prior bayesiano conservador**
- Usar médias da plataforma como prior para todas as métricas
- Variance alta → incerteza → mostrar em posições variadas para explorar

**Fase 3 (30+ bookings): Score real**
- Dados suficientes para confiar nas métricas reais

### Nova Categoria

Quando uma nova categoria é lançada (ex: "Reforma de Banheiros"):
1. Usar features agnósticas de categoria (distância, trust score, availability)
2. Aplicar transfer learning de categoria similar (ex: "Reforma em Geral")
3. Oferecer incentivo para prestadores top se cadastrarem na nova categoria

### Nova Cidade

1. Lançar com 50+ prestadores verificados antes de abrir para clientes
2. Importar features demográficas da cidade (renda média, densidade, etc.)
3. Usar modelo treinado em cidade similar como prior
4. Intensivo de dados nos primeiros 3 meses

### Novo Cliente (sem histórico)

Sem histórico de preferências, usar:
1. Defaults populares para a categoria na zona
2. Filtragem colaborativa: "clientes similares (idade, bairro) preferiram X"
3. Preço/rating como proxies de preferência inicial

---

## 7. FAIRNESS E CONTROLES

### Anti-Monopoly Mechanisms

```typescript
const FAIRNESS_RULES = {
  // Nenhum prestador pode receber mais de X% dos bookings da zona/categoria
  maxConcentration: 0.15, // 15% dos bookings

  // Nenhum prestador aparece nas 3 primeiras posições mais de X vezes seguidas
  // para o mesmo cliente
  maxConsecutiveTop3: 3,

  // Prestadores abaixo de X bookings/mês recebem boost de visibilidade
  lowActivityBoostThreshold: 5,
  lowActivityBoostFactor: 1.15,
};

async function applyFairnessConstraints(
  ranked: ProviderScore[],
  zone: string,
  categoryId: string
): Promise<ProviderScore[]> {
  const bookingDistribution = await getZoneBookingDistribution(zone, categoryId);

  return ranked.filter(p => {
    const share = bookingDistribution[p.providerId] || 0;
    return share < FAIRNESS_RULES.maxConcentration;
  });
}
```

### Auditabilidade

Cada decisão de matching deve ser explicável:

```typescript
// Log de auditoria para cada ranking gerado
interface MatchingAuditLog {
  searchId: string;
  timestamp: Date;
  contextFeatures: Record<string, number>;
  candidates: number;
  filteredOut: number;
  topResults: Array<{
    providerId: string;
    finalScore: number;
    scoreBreakdown: Record<string, number>;
    fairnessAdjustment: number;
    modelVersion: string;
  }>;
}
```

### Configuração de Pesos via Admin

```typescript
// Pesos configuráveis sem redeploy via feature flags
interface MatchingWeightsConfig {
  distance: number;
  rating: number;
  completion: number;
  acceptance: number;
  availability: number;
  trust: number;
  recurrence: number;
  price: number;
  newProviderBoost: number;
  fairnessConstraintMaxShare: number;
}

// Admin pode ajustar via painel e os pesos entram em vigor em < 60 segundos
// via Redis pub/sub + hot reload no matching service
```

---

## 8. RISCOS E MITIGAÇÕES

### Feedback Loops

**Problema**: Prestadores com alto score recebem mais bookings → acumulam mais reviews positivos → score ainda maior → monopolização.

**Mitigação**:
- Cap de concentração (max 15% da zona)
- Diversidade forçada nos resultados (ao menos 30% dos resultados são "challengers")
- Decay temporal: ratings antigos valem menos (EWMA - exponentially weighted moving average)

### Manipulação de Score

**Problema**: Prestadores criam reviews falsos, inflam ratings.

**Mitigação**:
- Reviews somente após booking completado (verificado via pagamento capturado)
- Detecção de padrões suspeitos: muitas reviews 5 estrelas em sequência, IPs similares
- Trust score penaliza prestadores com histórico de reviews removidas
- Verificação humana para prestadores com spike anômalo de rating

### Discriminação Geográfica

**Problema**: Modelo favorece prestadores do centro, penalizando periferias.

**Mitigação**:
- Normalização por zona (score relativo à zona, não absoluto)
- Monitorar fill rate por bairro — alertar se diferença > 20% entre zonas
- Boost para prestadores em zonas sub-servidas

### Incentive Misalignment

**Problema**: Prestador otimiza para score (aceita e cancela) em vez de qualidade real.

**Mitigação**:
- Cancellations-provider decrementam score mais que accepted bookings incrementam
- Padrão de "aceitar e cancelar" detectado e penalizado automaticamente
- Taxa de no-show > 5% → suspensão temporária automática

---

## 9. COMO VIRA MOAT COMPETITIVO

### O Data Flywheel em Detalhe

```
Ano 1: 50k bookings → modelo básico, NDCG@5 = 0.72
Ano 2: 500k bookings → modelo robusto, NDCG@5 = 0.81
Ano 3: 5M bookings → modelo class-leading, NDCG@5 = 0.88

Um competitor novo com 0 dados: NDCG@5 ≈ 0.60 (baseline heurístico)
→ Diferença perceptível pelo cliente: fill rate 15-20% menor
→ Resultado: prestadores e clientes preferem a plataforma com matching melhor
```

### Proprietary Signals

Sinais que **só a plataforma tem** e são impossíveis de replicar sem operar o negócio:

1. **Behavioral sequences**: cliente buscou, clicou, desistiu — por quê?
2. **Provider reliability in context**: esse prestador é pontual quando chove?
3. **Cancellation patterns**: esse prestador cancela antes de feriados?
4. **Implicit quality signals**: clientes que agendaram com este prestador voltam 2x mais
5. **Geographic micro-patterns**: esse prestador é 30% melhor em bairros residenciais

### Network Effect no Matching

- Mais clientes → Mais dados de escolha → Melhor matching
- Melhor matching → Mais conversões → Mais atrativo para prestadores
- Mais prestadores → Mais opções → Melhor coverage → Mais clientes
- Virtuous cycle que se auto-reforça

---

## 10. ROADMAP TÉCNICO

| Mês | Milestone | Métrica de Sucesso |
|---|---|---|
| 0-1 | Implementar weighted scoring heurístico | Sistema funcionando em produção |
| 1-3 | Instrumentação completa de eventos (impressions, clicks, bookings) | 100% dos eventos sendo coletados |
| 3-6 | Feature Store básico (batch features diárias) | Features disponíveis em < 100ms |
| 6-9 | Primeiro modelo LightGBM (offline evaluation) | NDCG@5 > 0.75 vs baseline |
| 9-12 | Shadow mode: modelo roda em paralelo ao heurístico | Comparação de scores sem impacto |
| 12-15 | A/B test: 10% do tráfego para modelo ML | Fill rate +5% vs heurístico |
| 15-18 | Rollout completo do modelo ML | 100% do tráfego no modelo |
| 18-24 | Near-realtime features (Kafka + Flink) | Features atualizadas em < 5min |
| 24-30 | Multi-objective optimization | LTV/cliente +15%, fairness index > 0.85 |
| 30-36 | Contextual bandits | Personalização individual mensurável |
| 36+ | Deep learning para context understanding | Queries em linguagem natural |
