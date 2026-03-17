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

---

## 11. IMPLEMENTAÇÃO COMPLETA — MÓDULO NESTJS

### Estrutura de Arquivos

```
src/
  matching/
    matching.module.ts
    matching.controller.ts
    matching.service.ts          ← scoring heurístico (Fase 1)
    matching.dto.ts
    matching.types.ts
    scorers/
      distance.scorer.ts
      rating.scorer.ts
      completion.scorer.ts
      trust.scorer.ts
      price.scorer.ts
    ml/
      lightgbm.ranker.ts         ← wrapper do modelo ML (Fase 2)
      feature.extractor.ts
      shadow.mode.service.ts
    cache/
      matching.cache.service.ts  ← Redis caching de features
    jobs/
      feature.update.job.ts      ← batch features diárias
    tests/
      matching.service.spec.ts
```

### matching.module.ts

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingCacheService } from './cache/matching.cache.service';
import { FeatureUpdateJob } from './jobs/feature.update.job';
import { ShadowModeService } from './ml/shadow.mode.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'feature-updates',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
      },
    }),
  ],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    MatchingCacheService,
    FeatureUpdateJob,
    ShadowModeService,
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
```

### matching.controller.ts

```typescript
import { Controller, Get, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MatchingService } from './matching.service';
import { SearchProvidersDto } from './matching.dto';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('search')
  @HttpCode(200)
  async searchProviders(
    @Query() dto: SearchProvidersDto,
    @CurrentUser() user: { id: string }
  ) {
    const results = await this.matchingService.search({
      clientId: user.id,
      categoryId: dto.categoryId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      scheduledAt: new Date(dto.scheduledAt),
      radiusKm: dto.radiusKm ?? 10,
    });

    return {
      providers: results,
      meta: {
        total: results.length,
        searchId: results[0]?.searchId,
      },
    };
  }
}
```

### matching.dto.ts

```typescript
import { IsUUID, IsNumber, IsDateString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProvidersDto {
  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  radiusKm?: number;
}
```

### matching.types.ts

```typescript
export interface MatchingContext {
  clientId: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  scheduledAt: Date;
  radiusKm: number;
}

export interface ScoreBreakdown {
  distanceScore: number;
  ratingScore: number;
  completionScore: number;
  acceptanceScore: number;
  availabilityScore: number;
  trustScore: number;
  recurrenceBonus: number;
  priceCompetitiveness: number;
  newProviderBoost: number;
  fairnessAdjustment: number;
}

export interface RankedProvider {
  searchId: string;
  providerId: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  distanceKm: number;
  estimatedETA?: number; // minutos
}

export interface ProviderCandidate {
  id: string;
  overallRating: number;
  totalReviews: number;
  completionRate: number;
  acceptanceRate: number;
  basePrice: number;
  verificationStatus: string;
  subscriptionPlan: string;
  createdAt: Date;
  totalBookings: number;
  openDisputesCount: number;
  lastKnownLatitude: number;
  lastKnownLongitude: number;
  serviceRadiusKm: number;
  bookingsToday: number;
  avgDailyCapacity: number;
  availabilitySlots: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string;
}
```

---

## 12. CACHING LAYER COM REDIS

### matching.cache.service.ts

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ProviderCandidate } from '../matching.types';

@Injectable()
export class MatchingCacheService {
  private readonly logger = new Logger(MatchingCacheService.name);

  // TTLs em segundos
  private readonly TTL = {
    batchFeatures: 3600,      // 1h — atualizado pelo job diário
    realtimeFeatures: 300,    // 5min — GPS, atividade
    categoryAvgPrice: 1800,   // 30min — preço médio da categoria
    clientHistory: 900,       // 15min — prestadores anteriores do cliente
    bookingDistribution: 300, // 5min — distribuição para fairness
  };

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getProviderBatchFeatures(providerId: string): Promise<Partial<ProviderCandidate> | null> {
    const key = `matching:batch:provider:${providerId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setProviderBatchFeatures(
    providerId: string,
    features: Partial<ProviderCandidate>
  ): Promise<void> {
    const key = `matching:batch:provider:${providerId}`;
    await this.redis.setex(key, this.TTL.batchFeatures, JSON.stringify(features));
  }

  async getProviderRealtimeLocation(
    providerId: string
  ): Promise<{ lat: number; lng: number; updatedAt: number } | null> {
    const key = `matching:rt:location:${providerId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setProviderRealtimeLocation(
    providerId: string,
    lat: number,
    lng: number
  ): Promise<void> {
    const key = `matching:rt:location:${providerId}`;
    await this.redis.setex(
      key,
      this.TTL.realtimeFeatures,
      JSON.stringify({ lat, lng, updatedAt: Date.now() })
    );
  }

  async getCategoryAvgPrice(categoryId: string): Promise<number | null> {
    const key = `matching:price:category:${categoryId}`;
    const val = await this.redis.get(key);
    return val ? parseFloat(val) : null;
  }

  async setCategoryAvgPrice(categoryId: string, avgPriceCents: number): Promise<void> {
    const key = `matching:price:category:${categoryId}`;
    await this.redis.setex(key, this.TTL.categoryAvgPrice, String(avgPriceCents));
  }

  async getClientPreviousProviders(clientId: string): Promise<string[]> {
    const key = `matching:history:client:${clientId}`;
    const val = await this.redis.get(key);
    return val ? JSON.parse(val) : [];
  }

  async setClientPreviousProviders(clientId: string, providerIds: string[]): Promise<void> {
    const key = `matching:history:client:${clientId}`;
    await this.redis.setex(key, this.TTL.clientHistory, JSON.stringify(providerIds));
  }

  async getZoneBookingDistribution(
    zone: string,
    categoryId: string
  ): Promise<Record<string, number>> {
    const key = `matching:fairness:zone:${zone}:cat:${categoryId}`;
    const val = await this.redis.get(key);
    return val ? JSON.parse(val) : {};
  }

  async invalidateProviderCache(providerId: string): Promise<void> {
    const keys = [
      `matching:batch:provider:${providerId}`,
      `matching:rt:location:${providerId}`,
    ];
    await this.redis.del(...keys);
    this.logger.debug(`Cache invalidated for provider ${providerId}`);
  }

  // Pub/Sub para hot reload de pesos (admin altera via painel)
  async publishWeightsUpdate(weights: Record<string, number>): Promise<void> {
    await this.redis.publish('matching:weights:update', JSON.stringify(weights));
  }

  async subscribeToWeightsUpdate(
    callback: (weights: Record<string, number>) => void
  ): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe('matching:weights:update');
    subscriber.on('message', (_, message) => {
      try {
        callback(JSON.parse(message));
      } catch (e) {
        this.logger.error('Failed to parse weights update', e);
      }
    });
  }
}
```

---

## 13. JOB DE ATUALIZAÇÃO DE FEATURES (BATCH DIÁRIO)

### feature.update.job.ts

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchingCacheService } from '../cache/matching.cache.service';

interface ProviderFeatureJob {
  providerId: string;
}

@Processor('feature-updates')
@Injectable()
export class FeatureUpdateJob {
  private readonly logger = new Logger(FeatureUpdateJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MatchingCacheService,
    @InjectQueue('feature-updates') private readonly queue: Queue
  ) {}

  // Roda às 3h da manhã — todos os prestadores ativos
  @Cron('0 3 * * *')
  async scheduleDailyBatchUpdate(): Promise<void> {
    this.logger.log('Scheduling daily batch feature update...');

    const activeProviders = await this.prisma.providerProfile.findMany({
      where: { isAvailable: true, deletedAt: null },
      select: { id: true },
    });

    const jobs = activeProviders.map(p => ({
      data: { providerId: p.id },
      opts: { delay: Math.random() * 60000 }, // spread over 1 minute
    }));

    await this.queue.addBulk(jobs.map(j => ({ name: 'update-provider-features', ...j })));

    this.logger.log(`Enqueued ${jobs.length} feature update jobs`);
  }

  @Process('update-provider-features')
  async updateProviderFeatures(job: Job<ProviderFeatureJob>): Promise<void> {
    const { providerId } = job.data;
    const now = new Date();
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [profile, bookings30d, bookings90d, bookings7d] = await Promise.all([
      this.prisma.providerProfile.findUnique({
        where: { id: providerId },
        include: { user: true },
      }),
      this.prisma.booking.findMany({
        where: { providerId, createdAt: { gte: days30Ago }, deletedAt: null },
        select: { status: true, totalCents: true, scheduledAt: true },
      }),
      this.prisma.booking.findMany({
        where: { providerId, createdAt: { gte: days90Ago }, deletedAt: null },
        select: { status: true },
      }),
      this.prisma.booking.findMany({
        where: { providerId, createdAt: { gte: days7Ago }, deletedAt: null },
        select: { status: true, createdAt: true },
      }),
    ]);

    if (!profile) return;

    const completion30d = this.calcRate(bookings30d, 'COMPLETED');
    const completion90d = this.calcRate(bookings90d, 'COMPLETED');
    const accepted7d = bookings7d.filter(b =>
      ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
    ).length;
    const total7d = bookings7d.length;
    const acceptance7d = total7d > 0 ? accepted7d / total7d : 1.0;
    const revenue30d = bookings30d
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.totalCents, 0);

    const features = {
      completionRate30d: completion30d,
      completionRate90d: completion90d,
      acceptanceRate7d: acceptance7d,
      revenue30dCents: revenue30d,
      totalBookingsLifetime: profile.totalCompletions,
      overallRating: profile.overallRating,
      totalReviews: profile.totalReviews,
    };

    await this.cache.setProviderBatchFeatures(providerId, features as any);
  }

  private calcRate(bookings: { status: string }[], targetStatus: string): number {
    if (bookings.length === 0) return 1.0; // Prior otimista para novos prestadores
    const completed = bookings.filter(b => b.status === targetStatus).length;
    return completed / bookings.length;
  }
}
```

---

## 14. SHADOW MODE — MODELO ML EM PARALELO

### shadow.mode.service.ts

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { MatchingContext, RankedProvider } from '../matching.types';

/**
 * Shadow mode: executa o modelo ML em paralelo ao heurístico,
 * loga as diferenças, mas retorna resultado do heurístico.
 * Permite validação do modelo sem risco ao usuário.
 */
@Injectable()
export class ShadowModeService {
  private readonly logger = new Logger(ShadowModeService.name);
  private shadowEnabled = false;
  private shadowSampleRate = 0.1; // 10% do tráfego

  async runShadow(
    context: MatchingContext,
    heuristicResults: RankedProvider[],
    mlRankFn: (ctx: MatchingContext) => Promise<RankedProvider[]>
  ): Promise<void> {
    if (!this.shadowEnabled) return;
    if (Math.random() > this.shadowSampleRate) return;

    try {
      const mlResults = await Promise.race([
        mlRankFn(context),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('ML timeout')), 200)
        ),
      ]);

      this.logComparison(context, heuristicResults, mlResults);
    } catch (err) {
      this.logger.warn(`Shadow mode ML failed: ${err.message}`);
    }
  }

  private logComparison(
    context: MatchingContext,
    heuristic: RankedProvider[],
    ml: RankedProvider[]
  ): void {
    const top5Heuristic = heuristic.slice(0, 5).map(p => p.providerId);
    const top5ML = ml.slice(0, 5).map(p => p.providerId);
    const overlap = top5Heuristic.filter(id => top5ML.includes(id)).length;

    this.logger.log(JSON.stringify({
      event: 'shadow_comparison',
      searchContext: {
        categoryId: context.categoryId,
        scheduledAt: context.scheduledAt,
      },
      top5Overlap: overlap,      // 5 = idêntico, 0 = completamente diferente
      heuristicTop1: top5Heuristic[0],
      mlTop1: top5ML[0],
      topChanged: top5Heuristic[0] !== top5ML[0],
    }));
  }

  enableShadow(sampleRate = 0.1): void {
    this.shadowEnabled = true;
    this.shadowSampleRate = sampleRate;
    this.logger.log(`Shadow mode enabled at ${sampleRate * 100}% sample rate`);
  }

  disableShadow(): void {
    this.shadowEnabled = false;
  }
}
```

---

## 15. PIPELINE ML — PYTHON (FASE 2)

### ml/train_matching_model.py

```python
"""
Pipeline completo de treinamento do modelo de ranking LightGBM.
Executado semanalmente via Airflow/Prefect job.
"""

import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder
import joblib
import mlflow
import mlflow.lightgbm
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# ─── 1. COLETA DE DADOS ──────────────────────────────────────────────────────

def load_training_data(days_back: int = 90) -> pd.DataFrame:
    """
    Carrega dados de impressões + features + labels do PostgreSQL.
    Cada linha = um prestador mostrado em uma busca específica.
    """
    query = """
    SELECT
        si.search_id,
        si.provider_id,
        si.position,
        si.was_clicked,
        si.was_booked,

        -- Features do prestador (batch, do snapshot)
        pms.overall_rating,
        pms.total_reviews,
        pms.completion_rate_30d,
        pms.completion_rate_90d,
        pms.acceptance_rate_7d,
        pms.no_show_rate_90d,
        pms.revenue_30d_cents,
        pms.total_bookings_lifetime,

        -- Features da busca
        si.distance_km,
        sl.category_id,
        EXTRACT(DOW FROM sl.searched_at) AS day_of_week,
        EXTRACT(HOUR FROM sl.searched_at) AS hour_of_day,
        sl.zone_id,

        -- Labels compostos
        CASE
            WHEN b.status = 'COMPLETED' AND rb.id IS NOT NULL THEN 3  -- recorrência criada
            WHEN b.status = 'COMPLETED' THEN 2                         -- completado
            WHEN b.id IS NOT NULL THEN 1                               -- booking criado
            ELSE 0                                                      -- não converteu
        END AS relevance_label

    FROM search_impressions si
    JOIN search_logs sl ON sl.id = si.search_id
    JOIN provider_metric_snapshots pms ON pms.provider_id = si.provider_id
        AND pms.snapshot_date = DATE(sl.searched_at)
    LEFT JOIN bookings b ON b.id::text = si.booking_id::text
    LEFT JOIN recurring_bookings rb ON rb.id = b.recurrence_id
    WHERE sl.searched_at >= NOW() - INTERVAL '{days} days'
    """.format(days=days_back)

    # Em produção: usar SQLAlchemy com connection pool
    df = pd.read_sql(query, con=get_db_connection())
    logger.info(f"Loaded {len(df)} training examples from {df['search_id'].nunique()} searches")
    return df


# ─── 2. FEATURE ENGINEERING ──────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cria features derivadas a partir dos dados brutos.
    """
    df = df.copy()

    # Rating bayesiano (igual ao heurístico para consistência)
    GLOBAL_AVG = 4.0
    CONFIDENCE = 20
    df['bayesian_rating'] = (
        (CONFIDENCE * GLOBAL_AVG + df['overall_rating'] * df['total_reviews']) /
        (CONFIDENCE + df['total_reviews'])
    )

    # Normalização de distância (exponential decay)
    df['distance_score'] = np.exp(-np.log(10) / 10 * df['distance_km'])

    # Período do dia
    df['time_period'] = pd.cut(
        df['hour_of_day'],
        bins=[0, 8, 12, 17, 21, 24],
        labels=['madrugada', 'manha', 'tarde', 'noite', 'noite_tardia']
    )

    # Ratio performance vs categoria
    category_avg_rating = df.groupby('category_id')['overall_rating'].transform('mean')
    df['rating_vs_category'] = df['overall_rating'] / (category_avg_rating + 1e-6)

    # Log de bookings (evitar skew)
    df['log_total_bookings'] = np.log1p(df['total_bookings_lifetime'])

    # Novo prestador flag
    df['is_new_provider'] = (df['total_bookings_lifetime'] < 20).astype(int)

    return df


# ─── 3. TREINAMENTO ──────────────────────────────────────────────────────────

def train_model(df: pd.DataFrame) -> lgb.Booster:
    """
    Treina modelo LightGBM com LambdaRank.
    """
    feature_cols = [
        'bayesian_rating', 'distance_score', 'completion_rate_30d',
        'completion_rate_90d', 'acceptance_rate_7d', 'no_show_rate_90d',
        'log_total_bookings', 'rating_vs_category', 'is_new_provider',
        'day_of_week', 'hour_of_day', 'distance_km',
    ]

    cat_features = ['category_id', 'zone_id', 'day_of_week', 'time_period']

    # Encode categoricals
    for col in cat_features:
        if col in df.columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))

    # Split: últimos 20% por tempo como validação
    split = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, val_idx = next(split.split(df, groups=df['search_id']))

    train_df = df.iloc[train_idx]
    val_df = df.iloc[val_idx]

    # Grupos para LTR (Learning to Rank)
    train_groups = train_df.groupby('search_id').size().values
    val_groups = val_df.groupby('search_id').size().values

    X_train = train_df[feature_cols]
    X_val = val_df[feature_cols]

    train_data = lgb.Dataset(
        X_train,
        label=train_df['relevance_label'],
        group=train_groups,
        categorical_feature=cat_features,
    )
    val_data = lgb.Dataset(
        X_val,
        label=val_df['relevance_label'],
        group=val_groups,
        reference=train_data,
    )

    params = {
        'objective': 'lambdarank',
        'metric': 'ndcg',
        'ndcg_eval_at': [5, 10],
        'num_leaves': 127,
        'min_data_in_leaf': 50,
        'learning_rate': 0.05,
        'feature_fraction': 0.8,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'lambda_l1': 0.1,
        'lambda_l2': 0.1,
        'verbose': -1,
    }

    with mlflow.start_run(run_name=f"matching_lgbm_{datetime.now().strftime('%Y%m%d')}"):
        mlflow.log_params(params)

        model = lgb.train(
            params,
            train_data,
            num_boost_round=500,
            valid_sets=[val_data],
            callbacks=[
                lgb.early_stopping(stopping_rounds=50),
                lgb.log_evaluation(period=50),
            ],
        )

        # Log métricas
        best_ndcg5 = model.best_score['valid_0']['ndcg@5']
        best_ndcg10 = model.best_score['valid_0']['ndcg@10']
        mlflow.log_metrics({'ndcg_at_5': best_ndcg5, 'ndcg_at_10': best_ndcg10})

        logger.info(f"Best NDCG@5: {best_ndcg5:.4f}, NDCG@10: {best_ndcg10:.4f}")

        # Salvar modelo
        model_path = f"models/matching_lgbm_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
        model.save_model(model_path)
        mlflow.log_artifact(model_path)

    return model


# ─── 4. SERVING (FastAPI) ─────────────────────────────────────────────────────

# ml/serving/app.py
SERVING_CODE = '''
from fastapi import FastAPI
import lightgbm as lgb
import numpy as np
from pydantic import BaseModel
from typing import List
import redis
import json

app = FastAPI(title="Matching ML Scoring API")
model = lgb.Booster(model_file="models/latest.txt")
redis_client = redis.Redis(host="redis", port=6379, db=1)

class ProviderFeatures(BaseModel):
    provider_id: str
    bayesian_rating: float
    distance_km: float
    completion_rate_30d: float
    acceptance_rate_7d: float
    log_total_bookings: float
    category_id: int
    day_of_week: int
    hour_of_day: int

class ScoreRequest(BaseModel):
    search_id: str
    providers: List[ProviderFeatures]

@app.post("/score")
async def score_providers(request: ScoreRequest):
    """
    Recebe lista de candidatos, retorna scores rankeados.
    Latência target: < 10ms p99
    """
    if not request.providers:
        return {"ranked": []}

    feature_matrix = np.array([
        [
            p.bayesian_rating,
            np.exp(-np.log(10) / 10 * p.distance_km),
            p.completion_rate_30d,
            p.acceptance_rate_7d,
            p.log_total_bookings,
            p.category_id,
            p.day_of_week,
            p.hour_of_day,
        ]
        for p in request.providers
    ])

    scores = model.predict(feature_matrix)

    ranked = sorted(
        zip(request.providers, scores),
        key=lambda x: x[1],
        reverse=True
    )

    return {
        "ranked": [
            {"provider_id": p.provider_id, "score": float(s)}
            for p, s in ranked
        ]
    }

@app.get("/health")
async def health():
    return {"status": "ok", "model_version": model.num_trees()}
'''


# ─── 5. AVALIAÇÃO OFFLINE ─────────────────────────────────────────────────────

def evaluate_model(model: lgb.Booster, test_df: pd.DataFrame) -> dict:
    """
    Calcula métricas de ranking no conjunto de teste.
    """
    feature_cols = [
        'bayesian_rating', 'distance_score', 'completion_rate_30d',
        'completion_rate_90d', 'acceptance_rate_7d', 'no_show_rate_90d',
        'log_total_bookings', 'rating_vs_category', 'is_new_provider',
        'day_of_week', 'hour_of_day', 'distance_km',
    ]

    results = []
    for search_id, group in test_df.groupby('search_id'):
        if len(group) < 2:
            continue

        X = group[feature_cols].values
        scores = model.predict(X)
        labels = group['relevance_label'].values

        # NDCG@5
        ndcg5 = ndcg_at_k(labels, scores, k=5)

        # MRR (Mean Reciprocal Rank): posição do primeiro item relevante
        ranked_labels = labels[np.argsort(scores)[::-1]]
        mrr = next(
            (1.0 / (i + 1) for i, l in enumerate(ranked_labels) if l > 0),
            0.0
        )

        results.append({'ndcg5': ndcg5, 'mrr': mrr})

    metrics_df = pd.DataFrame(results)
    return {
        'ndcg_at_5_mean': metrics_df['ndcg5'].mean(),
        'ndcg_at_5_p10': metrics_df['ndcg5'].quantile(0.10),
        'mrr_mean': metrics_df['mrr'].mean(),
        'n_searches': len(results),
    }


def ndcg_at_k(labels: np.ndarray, scores: np.ndarray, k: int = 5) -> float:
    """Normalized Discounted Cumulative Gain at K."""
    order = np.argsort(scores)[::-1]
    ranked = labels[order[:k]]

    dcg = sum((2**r - 1) / np.log2(i + 2) for i, r in enumerate(ranked))
    ideal = sorted(labels, reverse=True)[:k]
    idcg = sum((2**r - 1) / np.log2(i + 2) for i, r in enumerate(ideal))

    return dcg / idcg if idcg > 0 else 0.0


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    df = load_training_data(days_back=90)
    df = engineer_features(df)
    model = train_model(df)
    logger.info("Model training complete.")
```

---

## 16. MONITORING E ALERTAS DO SISTEMA DE MATCHING

### Métricas no Prometheus/Grafana

```typescript
// matching/metrics/matching.metrics.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MatchingMetrics {
  // Contadores
  readonly searchTotal = new Counter({
    name: 'matching_searches_total',
    help: 'Total number of provider searches',
    labelNames: ['category', 'zone'],
  });

  readonly bookingConversions = new Counter({
    name: 'matching_booking_conversions_total',
    help: 'Searches that resulted in a booking',
    labelNames: ['category', 'model_version'],
  });

  readonly zeroResultsTotal = new Counter({
    name: 'matching_zero_results_total',
    help: 'Searches with no providers found',
    labelNames: ['category', 'zone'],
  });

  // Histogramas
  readonly scoringLatency = new Histogram({
    name: 'matching_scoring_latency_ms',
    help: 'Time to compute provider scores',
    buckets: [5, 10, 25, 50, 100, 250, 500],
  });

  readonly candidatesFiltered = new Histogram({
    name: 'matching_candidates_filtered',
    help: 'Number of providers after hard filters',
    buckets: [0, 1, 5, 10, 20, 50, 100],
  });

  // Gauges
  readonly fillRate = new Gauge({
    name: 'matching_fill_rate',
    help: 'Current fill rate (searches → bookings)',
    labelNames: ['category'],
  });

  readonly providerConcentrationIndex = new Gauge({
    name: 'matching_provider_concentration_gini',
    help: 'Gini index of booking distribution (0=fair, 1=monopoly)',
    labelNames: ['zone', 'category'],
  });
}
```

### Alertas Críticos

```yaml
# prometheus/alerts/matching.yml
groups:
  - name: matching
    rules:
      - alert: MatchingFillRateLow
        expr: matching_fill_rate < 0.20
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Fill rate abaixo de 20% em {{ $labels.category }}"
          description: "Fill rate atual: {{ $value | humanizePercentage }}. Verificar supply na zona."

      - alert: MatchingZeroResultsHigh
        expr: rate(matching_zero_results_total[5m]) / rate(matching_searches_total[5m]) > 0.10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Mais de 10% das buscas sem resultados"
          description: "Taxa zero-results: {{ $value | humanizePercentage }}"

      - alert: MatchingLatencyHigh
        expr: histogram_quantile(0.99, rate(matching_scoring_latency_ms_bucket[5m])) > 200
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latência de scoring acima de 200ms (p99)"

      - alert: MatchingProviderMonopoly
        expr: matching_provider_concentration_gini > 0.70
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Alta concentração de bookings em poucos prestadores (zona {{ $labels.zone }})"
          description: "Gini index: {{ $value }}. Revisar regras de fairness."
```

---

## 17. TESTES AUTOMATIZADOS

### matching.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { MatchingCacheService } from './cache/matching.cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderCandidate } from './matching.types';

const mockProvider = (overrides: Partial<ProviderCandidate> = {}): ProviderCandidate => ({
  id: 'provider-001',
  overallRating: 4.5,
  totalReviews: 50,
  completionRate: 0.95,
  acceptanceRate: 0.90,
  basePrice: 15000, // R$150,00 em centavos
  verificationStatus: 'APPROVED',
  subscriptionPlan: 'PRO',
  createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 ano atrás
  totalBookings: 120,
  openDisputesCount: 0,
  lastKnownLatitude: -23.561,
  lastKnownLongitude: -46.656,
  serviceRadiusKm: 10,
  bookingsToday: 2,
  avgDailyCapacity: 4,
  availabilitySlots: [
    { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' }, // Segunda
    { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
    { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
  ],
  ...overrides,
});

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: MatchingCacheService,
          useValue: {
            getCategoryAvgPrice: jest.fn().mockResolvedValue(15000),
            getClientPreviousProviders: jest.fn().mockResolvedValue([]),
            getZoneBookingDistribution: jest.fn().mockResolvedValue({}),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  describe('Distance Score', () => {
    it('should return 1.0 for same location', () => {
      const score = service['calcDistanceScore'](-23.56, -46.65, -23.56, -46.65, 10);
      expect(score).toBeCloseTo(1.0, 2);
    });

    it('should decay exponentially with distance', () => {
      const score5km = service['calcDistanceScore'](-23.56, -46.65, -23.605, -46.65, 10);
      const score1km = service['calcDistanceScore'](-23.56, -46.65, -23.569, -46.65, 10);
      expect(score1km).toBeGreaterThan(score5km);
    });

    it('should return 0 if outside radius', () => {
      const score = service['calcDistanceScore'](-23.56, -46.65, -23.70, -46.65, 5);
      expect(score).toBe(0);
    });
  });

  describe('Rating Score', () => {
    it('should return high score for many 5-star reviews', () => {
      const score = service['calcRatingScore'](5.0, 100);
      expect(score).toBeGreaterThan(0.9);
    });

    it('should apply bayesian smoothing for few reviews', () => {
      const scoreNew = service['calcRatingScore'](5.0, 2);   // 2 reviews, 5 estrelas
      const scoreEstab = service['calcRatingScore'](4.5, 100); // 100 reviews, 4.5 estrelas
      // Prestador estabelecido com 4.5 deve score próximo ao novo com 5.0
      expect(Math.abs(scoreNew - scoreEstab)).toBeLessThan(0.2);
    });
  });

  describe('Trust Score', () => {
    it('should return max score for fully verified provider', () => {
      const provider = mockProvider({
        verificationStatus: 'APPROVED',
        subscriptionPlan: 'PRO',
        openDisputesCount: 0,
        createdAt: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 anos
      });
      const score = service['calcTrustScore'](provider);
      expect(score).toBeGreaterThan(0.9);
    });

    it('should penalize providers with open disputes', () => {
      const clean = mockProvider({ openDisputesCount: 0 });
      const disputed = mockProvider({ openDisputesCount: 3 });
      expect(service['calcTrustScore'](clean)).toBeGreaterThan(
        service['calcTrustScore'](disputed)
      );
    });
  });

  describe('New Provider Boost', () => {
    it('should boost providers with < 5 bookings', () => {
      const boost = service['getNewProviderBoost'](mockProvider({ totalBookings: 3 }));
      expect(boost).toBe(0.3);
    });

    it('should not boost established providers', () => {
      const boost = service['getNewProviderBoost'](mockProvider({ totalBookings: 50 }));
      expect(boost).toBe(0);
    });
  });

  describe('Fairness', () => {
    it('should filter out monopolistic providers', async () => {
      const distribution = { 'provider-001': 0.20 }; // 20% > limite de 15%
      (service['cache'].getZoneBookingDistribution as jest.Mock).mockResolvedValue(distribution);

      const provider = mockProvider({ id: 'provider-001' });
      const filtered = await service['applyFairnessConstraints'](
        [{ providerId: 'provider-001', totalScore: 0.9, breakdown: {} as any }],
        'zone-sp-pinheiros',
        'limpeza'
      );

      expect(filtered).toHaveLength(0);
    });
  });
});
```
