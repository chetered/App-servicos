# BLOCO A — Arquitetura de Startup Nível Uber

> Documento de referência arquitetural para o marketplace de serviços sob demanda.
> Versão: 1.0 | Status: Referência estratégica | Audiência: CTO, Founders, Investidores

---

## 1. ARQUITETURA DE NEGÓCIO DO MARKETPLACE

### 1.1 Estrutura Bilateral: Oferta e Demanda

```
LADO DA DEMANDA (Clientes)                    LADO DA OFERTA (Prestadores)
─────────────────────────────                 ─────────────────────────────
Consumidores individuais (B2C)                Autônomos solo (ex: diaristas)
Empresas pequenas (SMB)                       Microempresas de serviços
Condomínios/síndicos                          Empresas certificadas (MEI, ME)
Gestores de frotas                            Franquias de serviços locais
Property managers                             Cooperativas de trabalho
Empresas enterprise (B2B)                     Agências de serviços especializados

MOTIVAÇÃO DA DEMANDA:                         MOTIVAÇÃO DA OFERTA:
- Conveniência + rapidez                      - Renda complementar ou principal
- Preço previsível                            - Flexibilidade de horário
- Confiança / verificação                     - Acesso a clientes qualificados
- Recorrência sem fricção                     - Gestão de agenda automatizada
- Pagamento digital seguro                    - Reputação digital portável
```

**Trade-off crítico de MVP**: Começar pela demanda ou oferta?
- **Decisão recomendada**: Oferta primeiro, em 1 cidade, 1 categoria.
- Rationale: Supply constrained markets — se você tem os melhores prestadores verificados, a demanda vem. O inverso cria cancelamentos e mata confiança precocemente.

---

### 1.2 Liquidez do Marketplace

**Definição operacional**: Liquidez = probabilidade de uma solicitação encontrar um prestador qualificado disponível em tempo aceitável.

```
MÉTRICAS DE LIQUIDEZ:
┌─────────────────────────────────────────────────────────┐
│ Fill Rate     = pedidos atendidos / pedidos realizados  │
│ Time-to-Match = tempo médio até aceite do prestador     │
│ Ghost Rate    = sessões sem nenhum prestador disponível │
│ Cancellation Rate = cancelamentos pós-aceite            │
│ Completion Rate   = serviços concluídos / aceitos       │
└─────────────────────────────────────────────────────────┘

THRESHOLD DE LIQUIDEZ SAUDÁVEL (por cidade):
- Fill Rate > 85%
- Time-to-Match < 3 minutos (urgente) / < 2h (agendado)
- Ghost Rate < 8%
- Cancellation Rate < 12%
- Completion Rate > 92%
```

**Armadilha**: Crescer para 5 cidades com liquidez de 60% em cada uma destrói brand trust e CAC. É melhor 95% em 1 cidade.

---

### 1.3 Supply Density e Demand Density

```
SUPPLY DENSITY MODEL:
─────────────────────
Prestadores ativos por km² por categoria por período

Exemplo:
  São Paulo - Zona Sul - Limpeza Residencial - Segunda 9h
  → 12 prestadores disponíveis em raio de 5km
  → Densidade: VERDE (Fill Rate esperado: 94%)

  Manaus - Centro - Elétrica - Domingo 20h
  → 0 prestadores disponíveis em raio de 10km
  → Densidade: VERMELHO (Ghost Rate: 100%)

ESTRATÉGIA DE SUPPLY DENSITY:
1. Mapear demand heatmap por CEP/hora/categoria (dados de busca)
2. Recrutar prestadores especificamente para zonas quentes
3. Incentivar prestadores com bônus de disponibilidade em zonas/horários críticos
4. Criar "zonas de cobertura garantida" como promessa de marca
5. Medir e exibir internamente: Supply Density Dashboard
```

```
DEMAND DENSITY MODEL:
─────────────────────
Pedidos por km² por categoria por período

Concentrar aquisição de clientes onde já existe supply.
Nunca fazer marketing em zonas sem prestadores.
Anti-pattern: campanha nacional antes de supply local consolidado.
```

---

### 1.4 Retenção e Recorrência

```
FUNNEL DE RETENÇÃO:
                   Aquisição (CAC)
                        │
                   1ª contratação
                        │
                   ← Conclusão satisfatória →
                        │
                   2ª contratação (J+14 típico)
                        │
                   ← Hábito formado →
                        │
                   Recorrência programada
                        │
                   ← High LTV client →

MECANISMOS DE RETENÇÃO:
1. "Meu prestador favorito" — conexão com um prestador específico
2. Planos recorrentes (quinzenal, mensal) com desconto
3. Histórico de serviços + checklist personalizado
4. Notificações inteligentes ("Sua casa está pronta para limpeza")
5. Créditos por fidelidade (não desconto de margem — crédito na plataforma)
6. Programa VIP por frequência de uso

COHORT ANALYSIS ALVO:
- D30 retention: > 40%
- D90 retention: > 28%
- D180 retention: > 22%
- 12M retention: > 15%
- Repeat rate em 60 dias: > 55%
```

---

### 1.5 Expansão Geográfica

```
MODELO DE EXPANSÃO POR ONDAS:

ONDA 1 — Cidade âncora (MVP)
  → Foco absoluto, supply > 200 prestadores ativos
  → Fill rate > 88%, NPS > 50
  → Playbook operacional documentado

ONDA 2 — Cidades satélite (Growth)
  → Cidades no raio de 100-300km da âncora
  → Copiar playbook com adaptações locais
  → Pré-recrutamento de supply antes do launch

ONDA 3 — Expansão de categoria (Scale)
  → Nova categoria na cidade já dominada
  → Aproveitar base de clientes existente
  → Reutilizar supply em categorias adjacentes

ONDA 4 — Outros estados (Scale+)
  → Cidade âncora em cada estado
  → Operação por região, não nacional

ONDA 5 — Internacional (International Stage)
  → País com perfil similar: regulação, comportamento
  → Latam: Chile, Colômbia, México como candidatos
  → Europeu: Portugal como teste de língua/cultura

GATILHOS DE EXPANSÃO:
- Fill rate âncora > 90% por 60 dias consecutivos
- NPS > 55
- Cohort D90 > 30%
- Supply auto-sustentável (> 60% via orgânico/indicação)
```

---

### 1.6 Unit Economics

```
MODELO UNIT ECONOMICS (por transação):

GMV médio por serviço: R$ 180 (limpeza residencial exemplo)

Take Rate: 22% → Receita bruta: R$ 39,60
  ├── Custo de gateway/payment: R$ 3,50 (1.9%)
  ├── Custo de suporte (média): R$ 2,80
  ├── Custo de fraude/disputa: R$ 1,20
  ├── Custo de marketing por transação: R$ 4,00
  └── Contribution Margin 1: R$ 28,10 (71% da receita)

CAC médio (canal pago): R$ 85 por cliente
LTV médio (12 meses): R$ 520
LTV/CAC ratio: 6.1x → SAUDÁVEL (threshold: > 3x)
CAC Payback: ~2 meses

UNIT ECONOMICS POR PRESTADOR:
GMV gerado por prestador ativo/mês: R$ 2.400
Comissão gerada: R$ 528
Custo de onboarding: R$ 45
Custo de suporte: R$ 35/mês
Prestador Break-even: mês 1

BENCHMARK VERSUS MERCADO:
- Uber Eats take rate: 15-30%
- TaskRabbit take rate: 15-20%
- Fiverr take rate: 20-30%
- Nossa proposta: 18-25% dinâmico por categoria
```

---

### 1.7 Take Rate e Monetização

```
TAKE RATE STRATEGY:
               Cliente paga R$ 180
                       │
         ┌─────────────┴─────────────┐
         │                           │
   Taxa plataforma             Prestador recebe
   R$ 39,60 (22%)              R$ 140,40 (78%)
         │
   ┌─────┴──────┐
   │            │
Service fee   Commission
 (cliente)    (prestador)
  R$ 18       R$ 21,60

ESTRUTURA DE SPLIT:
- Serviço base: 18% comissão sobre prestador
- Service fee transparente: R$ 5-20 fixo ao cliente
- Urgência (+20% sobre base)
- Deslocamento: taxa variável por distância
- Assinatura prestador premium: R$ 89/mês (maior visibilidade)
- Listing patrocinado: leilão por posição (future)

TAKE RATE DINÂMICO POR CATEGORIA:
- Limpeza residencial: 22%
- Elétrica/hidráulica: 20%
- Beleza em domicílio: 25%
- Jardinagem: 21%
- Montagem de móveis: 22%
- Personal trainer: 23%
```

---

### 1.8 Mecanismos de Confiança

```
TRUST STACK (camadas de confiança):

CAMADA 1 — Verificação de identidade
  ├── CPF validado (Serpro/Receita Federal)
  ├── Selfie biométrica (liveness check)
  ├── Verificação de endereço
  └── Antecedentes criminais (integração CISP/SENASP)

CAMADA 2 — Verificação profissional
  ├── Documentos de habilitação (CREA, CRO, etc.)
  ├── Certificações verificadas
  ├── Seguro de responsabilidade civil
  └── Portfolio verificado (fotos com EXIF)

CAMADA 3 — Reputação em tempo real
  ├── Rating público (mín. 4.2 para permanecer ativo)
  ├── Histórico de conclusões
  ├── Taxa de resposta
  └── Tempo médio de aceite

CAMADA 4 — Garantias operacionais
  ├── Seguro de danos contra terceiros (futura parceria)
  ├── Garantia de reembolso em 72h
  ├── Suporte ativo durante o serviço
  └── Geolocalização durante atendimento

CAMADA 5 — Reputação comportamental (ML futuro)
  ├── Trust Score calculado por modelo proprietário
  ├── Anomaly detection em comportamento
  ├── Risk Score em tempo real
  └── Fraude prevention via fingerprinting
```

---

### 1.9 Efeitos de Rede e Moat Competitivo

```
EFEITOS DE REDE:

REDE LOCAL (geográfica):
  Mais clientes em SP-Sul →
  Mais pedidos em SP-Sul →
  Prestadores preferem SP-Sul →
  Fill rate maior em SP-Sul →
  Experiência melhor em SP-Sul →
  Mais clientes em SP-Sul (loop)

REDE DE DADOS:
  Mais transações →
  Melhores dados de matching →
  Melhor algoritmo →
  Melhor experiência →
  Mais retenção →
  Mais transações (loop)

REDE DE REPUTAÇÃO:
  Mais reviews →
  Maior confiança pública →
  Menor CAC →
  Mais clientes →
  Mais reviews (loop)

MOAT COMPETITIVO — 5 CAMADAS:
1. DATA MOAT: Dados proprietários de matching, preço, comportamento
2. SUPPLY MOAT: Prestadores fidelizados com alta earning/hora
3. TRUST MOAT: Reputação construída ao longo de anos
4. OPERATIONAL MOAT: Playbook replicável e eficiente por cidade
5. TECHNOLOGY MOAT: Engine de matching/pricing proprietário
```

---

## 2. ARQUITETURA DE PRODUTO

### 2.1 Jornadas Principais

```
JORNADA CLIENTE — CONTRATAÇÃO URGENTE:
────────────────────────────────────────
1. Abre app → Tela inicial (categoria + localização)
2. Seleciona "Limpeza Residencial"
3. App pré-preenche endereço (GPS)
4. Seleciona "Hoje" + horário
5. Visualiza 3-5 prestadores disponíveis com preço e rating
6. Seleciona prestador (ou deixa o sistema decidir)
7. Confirma serviço + detalhes (tamanho da casa, extras)
8. Visualiza preço total com breakdown
9. Confirma pagamento (cartão salvo)
10. Recebe confirmação + tracking do prestador
11. Prestador chega → Checkin via app
12. Serviço concluído → Checkout + foto
13. Cliente avalia + paga automaticamente
14. Recibo digital no email/WhatsApp

JORNADA CLIENTE — RECORRÊNCIA:
──────────────────────────────
1. Após 2ª contratação: app sugere "Agendar recorrente"
2. Cliente define: quinzenal, mesma prestadora, mesmo horário
3. Confirmação com desconto de 8%
4. App agenda automaticamente próximas 4 sessões
5. Notificação D-3 e D-1 antes de cada sessão
6. Confirmação silenciosa (sem fricção)
7. Pagamento automático
8. Possibilidade de pausar/cancelar a qualquer momento

JORNADA PRESTADOR — ONBOARDING:
────────────────────────────────
1. Download do app prestador
2. Cadastro: nome, CPF, celular (OTP)
3. Upload de documentos (câmera ou galeria)
4. Selfie biométrica (liveness)
5. Background check iniciado (assíncrono 24-72h)
6. Enquanto aguarda: tutorial de uso do app
7. Aprovação → Notificação push + email
8. Configuração: categorias, zonas, disponibilidade, preço
9. Treinamento via vídeo (opcional, +badge)
10. Primeiro pedido em até 48h (meta interna)
```

---

### 2.2 Fluxos de Pagamento

```
PAYMENT FLOW — DETALHADO:

Cliente confirma pedido
        │
        ▼
Payment Intent criado (Stripe/Adyen)
        │
        ▼
Autorização do cartão (hold)
        │
        ▼
Serviço aceito pelo prestador
        │
        ▼
Serviço iniciado (check-in)
        │
        ▼
Serviço concluído (check-out + foto)
        │
        ▼
Captura do pagamento (D+0)
        │
        ├── Split imediato calculado:
        │     Gross: R$ 180
        │     Platform fee: R$ 39,60
        │     Provider net: R$ 140,40
        │     Tax withholding: calculado por país/regime
        │
        ▼
Wallet do prestador creditada (visível, não sacável)
        │
        ▼
Payout: D+1 via PIX (BR) / D+2 via TED
        │
        ▼
Comprovante ao prestador + extrato

DISPUTE FLOW:
Cliente abre disputa →
  └── Suporte notificado (SLA 4h)
        └── Evidências coletadas (fotos, GPS, checklist)
              └── Mediação automática (regras) ou manual
                    └── Reembolso parcial/total ou improcedente
                          └── Prestador notificado do resultado
                                └── Impact no Trust Score
```

---

### 2.3 Fluxo de Suporte e Disputa

```
SUPPORT TIERS:
──────────────
TIER 0: Self-service (FAQ, chatbot, app actions)
  → 60% dos tickets resolvidos aqui
  → Ações: cancelar, reagendar, reportar problema leve

TIER 1: Suporte humano básico (SLA 2h)
  → Chat in-app + email
  → Agentes treinados em playbook padronizado
  → Casos: atraso, qualidade insatisfatória, cobrança

TIER 2: Suporte especializado (SLA 30min)
  → Disputas financeiras, danos a propriedade
  → Fraude suspeita
  → Casos graves de segurança

TIER 3: Escalação jurídica/executiva
  → Casos com risco legal, imprensa, regulatório
  → Intervenção direta de liderança

DISPUTE RESOLUTION POLICY:
- Cancelamento pelo prestador com < 2h: reembolso 100%
- Cancelamento pelo prestador sem motivo: penalidade score
- Qualidade insatisfatória (comprovada): reembolso parcial + crédito
- Dano à propriedade: acionamento de seguro parceiro
- No-show do prestador: reembolso 100% + cupom R$ 30
```

---

### 2.4 Fluxo de Reputação

```
REPUTATION SYSTEM:
──────────────────
AVALIAÇÃO MÚTUA:
  Cliente avalia prestador: 1-5 estrelas + comentário (obrigatório)
  Prestador avalia cliente: 1-5 (interno, influencia prioridade)

COMPONENTES DO RATING DO PRESTADOR:
  1. Nota média ponderada (últimas 50 avaliações = 70%)
  2. Nota histórica total = 30%
  3. Penalidades por cancelamento (- 0.1 por cancelamento injustificado)
  4. Bônus por conclusões consecutivas (+ 0.05 a cada 10)

LIMITES DE AÇÃO:
  Rating < 3.5: Notificação de melhoria + coaching
  Rating < 3.0 por 30 dias: Suspensão temporária
  Rating < 2.5: Desativação com recurso
  Fraude confirmada: Banimento permanente

RATING INFLATION PREVENTION:
  - Mínimo de 5 avaliações para exibir nota pública
  - Análise de padrão de avaliações (anomaly detection)
  - Reviews de texto passam por moderação NLP (futuro)
  - Proibição de solicitar avaliação positiva (ação manual)
```

---

### 2.5 Fluxo B2B e Enterprise

```
B2B FLOW:
─────────
Empresa SMB (escritório, clínica, restaurante):
  1. Cadastro com CNPJ
  2. Contrato digital de serviço
  3. Plano recorrente com SLA garantido
  4. Múltiplos endereços/unidades
  5. Pagamento por boleto/NF automática
  6. Dashboard de gestão de pedidos
  7. Relatório mensal de gastos

ENTERPRISE FLOW:
  1. SDR identifica empresa > 50 unidades
  2. Demo + proposta customizada
  3. Integração via API ou portal white-label
  4. SLA contratual (fill rate 98%, response time 30min)
  5. Account manager dedicado
  6. Billing mensal com NF
  7. Seguro de cobertura ampliada incluso
  8. Treinamento dos prestadores para padrão da empresa

REVENUE ENTERPRISE:
  - Volume discount na comissão (17% vs 22% standard)
  - Subscription management fee: R$ 1.500/mês
  - Onboarding fee: R$ 5.000 uma vez
  - Premium SLA add-on: +R$ 800/mês
```

---

## 3. ARQUITETURA TECNOLÓGICA

### 3.1 Modular Monolith — Estrutura Inicial

```
ESTRUTURA DE MÓDULOS (NestJS):
─────────────────────────────
src/
├── app.module.ts                    ← Root module
├── shared/                          ← Infraestrutura compartilhada
│   ├── database/                    ← Prisma service
│   ├── redis/                       ← Redis service
│   ├── queue/                       ← BullMQ
│   ├── events/                      ← EventEmitter2 interno
│   ├── auth/                        ← JWT, Guards
│   ├── crypto/                      ← Hashing, encryption
│   ├── storage/                     ← S3/GCS abstraction
│   ├── notifications/               ← Push, Email, SMS, WhatsApp
│   ├── cache/                       ← Cache decorators
│   ├── observability/               ← Traces, metrics, logs
│   └── i18n/                        ← Internacionalização
│
├── modules/
│   ├── identity/                    ← Auth, login, sessões
│   ├── users/                       ← Perfil do cliente
│   ├── providers/                   ← Perfil do prestador
│   ├── catalog/                     ← Categorias, serviços
│   ├── search/                      ← Discovery, geo
│   ├── matching/                    ← Algoritmo de matching
│   ├── pricing/                     ← Engine de preço
│   ├── bookings/                    ← Pedidos, agendamento
│   ├── recurrence/                  ← Planos recorrentes
│   ├── payments/                    ← Orquestração de pagamento
│   ├── commissions/                 ← Regras de comissão
│   ├── payouts/                     ← Repasse aos prestadores
│   ├── reviews/                     ← Avaliações
│   ├── trust/                       ← Trust score, fraude
│   ├── support/                     ← Tickets, disputas
│   ├── promotions/                  ← Cupons, campanhas
│   ├── notifications/               ← Disparo de notificações
│   ├── analytics/                   ← Eventos e métricas
│   ├── localization/                ← Multi-país, moeda
│   ├── admin/                       ← Painel operacional
│   └── platform/                   ← Config, webhooks, GDPR
```

---

### 3.2 Bounded Contexts e Event-Driven

```
BOUNDED CONTEXTS:
──────────────────

IDENTITY CONTEXT
  Entidades: User, Session, Device, AuthProvider
  Eventos emitidos:
    → user.registered
    → user.email_verified
    → user.session_created
    → user.blocked

BOOKING CONTEXT
  Entidades: Booking, BookingItem, Assignment
  Eventos emitidos:
    → booking.created
    → booking.accepted
    → booking.started
    → booking.completed
    → booking.cancelled
    → booking.disputed
  Eventos consumidos:
    ← payment.captured (libera início)
    ← provider.unavailable (para reassign)

PAYMENT CONTEXT
  Entidades: PaymentIntent, Transaction, Split
  Eventos emitidos:
    → payment.intent_created
    → payment.captured
    → payment.failed
    → payment.refunded
    → payout.scheduled
    → payout.completed
  Eventos consumidos:
    ← booking.completed (trigger de captura)
    ← booking.cancelled (trigger de void/refund)

TRUST CONTEXT
  Entidades: TrustScore, RiskCase, FraudAlert
  Eventos emitidos:
    → trust.score_updated
    → trust.fraud_detected
    → trust.provider_suspended
  Eventos consumidos:
    ← review.submitted (atualiza score)
    ← booking.cancelled (penalidade)
    ← payment.disputed (risk signal)

EVENT BUS INTERNO (MVP = EventEmitter2):
  Todos os módulos publicam eventos tipados
  Assinantes reagem de forma desacoplada
  Garantia de ordem: não garantida (ok para MVP)
  Persistência: não (ok para MVP)

  EVOLUÇÃO: Redis Pub/Sub → Kafka/SQS (escala)
```

---

### 3.3 Engines Principais

```
PRICING ENGINE:
───────────────
Input:
  - category_id, subcategory_id
  - location (lat/lng)
  - datetime (urgência, horário, dia semana)
  - provider_id (preço customizado)
  - extras selecionados
  - client_tier (VIP, standard)
  - active_promotions

Processing:
  1. Busca base_price da categoria/região
  2. Aplica multiplicador de urgência (se < 2h: +20%)
  3. Aplica taxa de deslocamento (por km acima de raio base)
  4. Aplica surge se supply_density < threshold
  5. Aplica extras (m² adicional, mais cômodos, etc.)
  6. Desconta cupons ativos
  7. Calcula service fee fixo
  8. Snapshot do preço (imutável após booking)

Output:
  - subtotal
  - extras_breakdown
  - service_fee
  - urgency_fee
  - travel_fee
  - discount_applied
  - total
  - provider_net
  - platform_fee

MATCHING ENGINE:
────────────────
Input:
  - booking details
  - client location + datetime
  - categoria

Processing:
  1. Filtra prestadores: categoria + raio + disponibilidade
  2. Score por heurística (ver BLOCO D)
  3. Ordena por score descendente
  4. Aplica regras de fairness (não concentrar em 1 prestador)
  5. Retorna top-N para exibição

Output:
  - ordered list of providers com score + preço + ETA

RULES ENGINE:
─────────────
  Framework interno baseado em condição → ação
  Casos de uso:
  - Regras de comissão por categoria/país
  - Regras de fraude
  - Regras de promoção
  - Regras de elegibilidade de prestador
  - Regras de SLA por tier

RECURRENCE ENGINE:
──────────────────
  Cron jobs via BullMQ
  Cria bookings automaticamente N dias antes da execução
  Gerencia falhas de pagamento (retry 3x com backoff)
  Pausa e reativa planos
  Detecta churns de recorrência

TRUST ENGINE:
─────────────
  Score calculado por conjunto de fatores ponderados
  Atualizado assincronamente após cada evento relevante
  Threshold-based: ações automáticas se score < X
  Fila de revisão manual se score entra em zona cinza
```

---

### 3.4 Observabilidade

```
OBSERVABILITY STACK:
────────────────────

LOGS (estruturados):
  - Formato: JSON + trace_id + span_id + user_id
  - Destino MVP: stdout → CloudWatch/Papertrail
  - Destino Scale: OpenSearch/Elastic
  - Nível: INFO (produção), DEBUG (staging)

MÉTRICAS:
  - Prometheus + Grafana
  - Métricas de negócio: bookings/hora, fill_rate, GMV/dia
  - Métricas técnicas: latência p95/p99, error rate, queue depth
  - Métricas de infraestrutura: CPU, RAM, conexões DB

TRACING:
  - OpenTelemetry (agnostic)
  - Jaeger/Tempo para visualização
  - Trace de ponta a ponta: app → DB → queue → notificação

ALERTAS:
  - PagerDuty/OpsGenie para on-call
  - Alertas críticos: error_rate > 1%, fill_rate < 80%
  - Runbooks documentados por alerta

HEALTH CHECKS:
  /health (público): status geral
  /health/ready (interno): banco, redis, queues
  /health/live (interno): processo vivo
```

---

### 3.5 Data Platform

```
DATA PLATFORM — EVOLUÇÃO:

FASE 1 (MVP):
  - Dados no PostgreSQL principal
  - Queries analíticas com views materialized
  - Relatórios simples no admin (Next.js)
  - Export CSV para análise manual

FASE 2 (Growth):
  - Replicação read replica PostgreSQL
  - ETL simples: pg → S3 (daily snapshot)
  - Data warehouse: BigQuery/Redshift
  - Dashboard: Metabase/Looker
  - Eventos no analytics_events table → consumer → warehouse

FASE 3 (Scale):
  - Event streaming: Kafka
  - Real-time pipeline: Flink/Spark Streaming
  - Feature store para ML (Feast/Tecton)
  - Dados de treino versionados
  - Modelo de matching v2 (ML supervisionado)
  - Serving layer: Redis Feature Store

FASE 4 (International):
  - Data lake unificado multi-região
  - Compliance por país (LGPD, GDPR, CCPA)
  - Data residency: dados no país de origem
  - Governança de dados: catálogo (DataHub)
```

---

## 4. ARQUITETURA OPERACIONAL

### 4.1 Onboarding de Prestadores

```
PRESTADOR ONBOARDING FUNNEL:
─────────────────────────────
Lead gerado (marketing/referral/orgânico)
        │
        ▼
Landing page de cadastro
        │
        ▼
Dados básicos (5 min)
        │
        ▼
Upload de documentos (10 min)
        │
        ▼
Background check (24-72h automático)
        │
        ├─ APROVADO: Ativo imediatamente
        │
        └─ REPROVADO: Notificação + motivo + recurso

        ▼
Orientação de uso do app (vídeo 5 min)
        │
        ▼
Configuração de zonas e disponibilidade
        │
        ▼
Primeiro pedido recebido (meta: 48h)
        │
        ▼
Acompanhamento primeiros 7 dias (success manager)

KPIs DE ONBOARDING:
- Cadastro → Aprovação: < 72h (target)
- Aprovação → 1º pedido: < 48h (target)
- Taxa de conclusão do onboarding: > 70%
- Churn de prestador no mês 1: < 25%
```

---

### 4.2 KYC/KYB

```
KYC (Know Your Customer) — PESSOA FÍSICA:
  Dados coletados:
  - CPF (valida com Receita Federal)
  - Nome completo + data de nascimento
  - Endereço (CEP validado)
  - Selfie com liveness (Idwall/Unico)
  - Documento com foto (RG/CNH)

  Checagens automáticas:
  - CPF válido e ativo
  - Nome não consta em listas restritivas
  - Antecedentes criminais (API gov.br / CISP)
  - Cheque de sanções (OFAC, listas nacionais)

KYB (Know Your Business) — PESSOA JURÍDICA:
  - CNPJ validado (Receita Federal)
  - QSA (Quadro Societário)
  - Contrato social
  - Documentos dos sócios (KYC)
  - Comprovante de atividade

RISK RATING POR KYC:
  GREEN: aprovação automática
  YELLOW: revisão manual (24h)
  RED: reprovação com recurso

PROVIDER vs CUSTOMER KYC:
  - Prestador: KYC completo (alto risco)
  - Cliente: Cadastro simplificado + verificação progressiva
```

---

### 4.3 Anti-Fraude e Compliance

```
FRAUD PREVENTION LAYERS:
─────────────────────────
CAMADA 1 — Account Takeover:
  - Rate limiting em login
  - Detecção de device fingerprint novo
  - Geolocalização anômala
  - MFA para ações sensíveis

CAMADA 2 — Payment Fraud:
  - Velocity checks (N transações em X tempo)
  - BIN check (cartão versus país do IP)
  - 3DS quando score de risco > threshold
  - Chargeback rate monitoring

CAMADA 3 — Marketplace Fraud:
  - Fake reviews detection (ML futuro, regex inicial)
  - Collusion detection (cliente-prestador off-platform)
  - Photo manipulation detection (metadados)
  - GPS spoofing detection

CAMADA 4 — Supply Fraud:
  - Documentos duplicados (hash comparison)
  - Account sharing detection
  - Geographic implausibility (checkin impossível)

COMPLIANCE:
  - LGPD: DPO nomeado, privacy by design, direito de acesso/exclusão
  - PCI-DSS: nunca armazenar CVV, tokenização de cartão via gateway
  - SOC2: logs de auditoria, controle de acesso, criptografia
  - Regulação laboral: não caracterização de vínculo (MEI contratante)
  - Tributário: ISS/IRRF conforme regime, nota fiscal eletrônica
```

---

### 4.4 SLA Operacional

```
SLA POR CRITICIDADE:
─────────────────────
P0 — Sistema indisponível:
  Detecção: alertas automáticos < 2 min
  Resposta: < 5 min
  Resolução: < 30 min
  Comunicação: a cada 10 min
  Postmortem: 24h

P1 — Funcionalidade core degradada:
  Detecção: < 5 min
  Resposta: < 15 min
  Resolução: < 2h
  Postmortem: 48h

P2 — Funcionalidade secundária:
  Detecção: < 30 min
  Resposta: < 2h
  Resolução: < 8h

P3 — Melhorias e não-urgentes:
  SLA de sprint (próximos 14 dias)

SLA DE SUPORTE AO CLIENTE:
  Chat in-app: < 2 min (horário comercial)
  Email: < 2h
  Disputa financeira: < 4h
  Dano à propriedade: < 1h
```

---

## 5. ARQUITETURA PARA ESCALA

### 5.1 Plano de Evolução por Estágio

```
MVP STAGE (0-6 meses):
─────────────────────
Tecnologia:
  - Modular monolith NestJS + PostgreSQL + Redis
  - 1 região cloud (ex: AWS sa-east-1)
  - Docker Compose (dev) → ECS Fargate (prod)
  - CI/CD: GitHub Actions
  - Monitoramento: Datadog (free tier → basic)

Produto:
  - 1 cidade, 1-3 categorias
  - App móvel básico (React Native Expo)
  - Admin web básico (Next.js)
  - PIX + cartão de crédito

Operação:
  - Onboarding manual assistido
  - Suporte via WhatsApp + email
  - Time: 2-3 devs, 1 ops, 1 CS

Métricas-alvo:
  - 200 prestadores ativos
  - 500 bookings/mês
  - Fill rate > 80%
  - NPS > 40

GROWTH STAGE (6-18 meses):
───────────────────────────
Tecnologia:
  - Módulos separados em deploy independente (preparação)
  - Read replica PostgreSQL
  - CDN para assets
  - Cache agressivo (Redis)
  - Filas dedicadas por domínio (BullMQ)
  - Primeiros passos analytics: Metabase + BigQuery

Produto:
  - 3-5 cidades, 5-10 categorias
  - Recorrência funcionando
  - B2B básico
  - Programa de referral
  - Push notifications inteligentes

Operação:
  - Onboarding semi-automático
  - Suporte in-app (time de 5-10 CS)
  - Playbook por cidade documentado

Métricas-alvo:
  - 2.000 prestadores ativos
  - 5.000 bookings/mês
  - GMV > R$ 1M/mês
  - Take rate efetivo > 19%
  - D90 retention > 25%

SCALE STAGE (18-36 meses):
───────────────────────────
Tecnologia:
  - Primeiros microsserviços extraídos (Payment, Notification)
  - Kafka para event streaming
  - ML matching v2
  - Feature flags granulares
  - Multi-tenant para B2B

Produto:
  - 10-20 cidades
  - 15+ categorias
  - Enterprise sales
  - Subscription business model
  - Insurance/garantia ativa

Métricas-alvo:
  - 10.000+ prestadores ativos
  - 50.000+ bookings/mês
  - GMV > R$ 10M/mês
  - LTV/CAC > 5x

INTERNATIONAL STAGE (36-60 meses):
────────────────────────────────────
Tecnologia:
  - Multi-region deploy
  - Data residency compliance
  - Payment gateway por país
  - Internationalization engine completo

Produto:
  - 2-3 países
  - Playbook de expansão replicável < 90 dias por cidade

PRE-IPO/ACQUISITION (48-72 meses):
────────────────────────────────────
  - Auditoria SOC2 Type II
  - Governança formal (board, comitês)
  - Revenue diversificado (3+ streams relevantes)
  - EBITDA positivo ou clara trajetória
  - Data room sempre atualizado
  - Due diligence-ready em < 30 dias
```

---

## 6. MAPA DE DOMÍNIOS E ANTI-PATTERNS

### 6.1 Mapa Completo de Domínios

```
DOMÍNIOS E DEPENDÊNCIAS:

                    [IDENTITY]
                         │
              ┌──────────┼──────────┐
              │          │          │
           [USER]   [PROVIDER]  [ADMIN]
              │          │
              └────[CATALOG]────────┐
                        │           │
                    [SEARCH]    [PRICING]
                        │           │
                        └──[MATCHING]
                               │
                           [BOOKING]
                          /    │    \
                [PAYMENT] [RECURRENCE] [SUPPORT]
                    │
              [COMMISSION]
                    │
               [PAYOUT]
                    │
          [TRUST] [REVIEW] [ANALYTICS]
                              │
                          [PROMOTIONS]
                              │
                        [LOCALIZATION]

REGRA DE DEPENDÊNCIA:
  - Domínios de baixo nível (Identity, Catalog) NÃO dependem de domínios de alto nível
  - Booking é o domínio central — mais dependências
  - Analytics é consumidor de eventos, sem dependências
  - Localization é transversal (shared context)
```

---

### 6.2 Anti-Patterns a Evitar

```
ANTI-PATTERNS CRÍTICOS:

1. CRESCIMENTO SEM LIQUIDEZ
   ✗ Abrir 10 cidades antes de dominar 1
   ✓ Densificar até fill rate > 88% antes de expandir

2. SKIP DO TRUST STACK
   ✗ Lançar sem verificação de antecedentes
   ✓ KYC completo antes do 1º pedido

3. PREÇO FIXO PARA SEMPRE
   ✗ Margem flat sem dynamic pricing
   ✓ Pricing engine com surging e urgência desde o início

4. MONOLITH SEM MÓDULOS
   ✗ Tudo no mesmo arquivo/módulo sem separação
   ✓ Bounded contexts desde o dia 1

5. SHARED DATABASE ENTRE SERVIÇOS
   ✗ Múltiplos serviços acessando mesmas tabelas
   ✓ Database por contexto, comunicação por eventos

6. EVENTO SEM IDEMPOTÊNCIA
   ✗ Processar o mesmo evento 2x = problema
   ✓ Idempotency keys em todos os eventos críticos

7. SUPPLY QUALITY SACRIFICADA POR QUANTIDADE
   ✗ Aprovar todos para ter supply
   ✓ KPIs de qualidade do supply (rating, completion)

8. TAKE RATE FIXO PARA TODAS CATEGORIAS
   ✗ 20% flat para todos
   ✓ Take rate por categoria, por país, por tier

9. OTIMIZAÇÃO PREMATURA DE INFRA
   ✗ Microsserviços no mês 3
   ✓ Monolito bem estruturado até 100k transações/mês

10. ANALYTICS RETROATIVO
    ✗ "Vamos pensar em dados depois"
    ✓ analytics_events desde o dia 1, schema flexível
```

---

### 6.3 Gargalos Prováveis

```
GARGALOS PREVISÍVEIS E MITIGAÇÕES:

GARGALO 1: PostgreSQL sob carga de escrita
  Sintoma: latência crescente com volume
  Mitigação:
    - Índices estratégicos desde o início
    - Particionamento de bookings por data
    - Write-through cache para leituras quentes
    - Read replica para queries analíticas
    - Connection pooling (PgBouncer)

GARGALO 2: Matching em tempo real
  Sintoma: tempo de resposta > 500ms para listar prestadores
  Mitigação:
    - Cache de disponibilidade no Redis (TTL 30s)
    - Geospatial index (PostGIS ou Redis GEO)
    - Pre-compute scores em background
    - Paginação com cursor

GARGALO 3: Notificações em massa
  Sintoma: push notifications atrasadas
  Mitigação:
    - BullMQ com concurrency configurada
    - Múltiplos workers por fila
    - Rate limiting por provider (FCM, APNS)
    - Batch notifications quando possível

GARGALO 4: Payouts em lote
  Sintoma: processamento lento de D+1
  Mitigação:
    - Job noturno com processamento em batch
    - Fila dedicada de alta prioridade
    - Retry com backoff exponencial
    - Reconciliação automática

GARGALO 5: Background checks no onboarding
  Sintoma: prestadores esperando muito
  Mitigação:
    - Integrações com múltiplos providers (fallback)
    - Webhook para resultado assíncrono
    - "Aprovação condicional" com restrições até conclusão
    - SLA de 72h com comunicação clara
```
