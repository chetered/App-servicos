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

---

## 7. STACK TECNOLÓGICO COMPLETO

### 7.1 Decisões de Stack com Rationale

```
BACKEND — NestJS + TypeScript
─────────────────────────────
Por que NestJS:
  - Arquitetura modular nativa (DI, módulos, guards, pipes)
  - Decorators = código declarativo e testável
  - Suporte nativo a CQRS, Event Sourcing, WebSockets
  - TypeScript end-to-end (frontend + backend compartilham tipos)
  - Vasto ecossistema de integrações
  - Curva de aprendizado razoável — fácil contratar

Por que NÃO Fastify/Express puro:
  - Sem estrutura = spaghetti em 6 meses
  - Difícil manter bounded contexts sem framework opinativo

RUNTIME: Node.js 20 LTS
  - Single-threaded event loop → ideal para I/O bound (nossa carga)
  - Worker threads para CPU-bound (scoring, criptografia)
  - Não usar para ML inference (Python FastAPI para isso)

BANCO PRINCIPAL — PostgreSQL 16
─────────────────────────────────
Por que PostgreSQL:
  - ACID completo — crítico para pagamentos e bookings
  - PostGIS: geospatial queries nativas (busca por raio, zona)
  - Full-text search: busca de categorias sem Elastic no MVP
  - JSONB: flexibilidade para campos semi-estruturados (metadata)
  - Row-level security: multi-tenancy no banco
  - Particionamento nativo: escala temporal de bookings/eventos

ORM: Prisma
  - Schema as code (schema.prisma = source of truth)
  - Type-safe queries end-to-end
  - Migrations versionadas
  - Suporte a PostgreSQL extensions (uuid-ossp, postgis)

CACHE — Redis 7 (Cluster no Scale)
────────────────────────────────────
Casos de uso:
  1. Session store: JWT blacklist, sessões de usuário
  2. Cache de resultados de matching (TTL 30s)
  3. Cache de preços calculados (TTL 60s)
  4. Rate limiting (sliding window)
  5. Fila de jobs (BullMQ)
  6. Pub/Sub para invalidação de cache distribuída
  7. Geospatial index: GEOADD para localização de prestadores
  8. Feature flags (hot reload sem redeploy)

FILAS — BullMQ (MVP) → SQS/Kafka (Scale)
─────────────────────────────────────────
BullMQ no MVP:
  - Suportado no Redis (sem infra adicional)
  - UI via Bull Board
  - Dead letter, retry, delay nativos

Filas por domínio:
  notifications.queue         (alta prioridade, concurrency 20)
  payments.queue              (alta prioridade, concurrency 5)
  payouts.queue               (baixa prioridade, processamento noturno)
  background-checks.queue     (média prioridade)
  emails.queue                (baixa prioridade, batch)
  analytics.queue             (baixa prioridade, bulk insert)
  recurrence.queue            (baixa prioridade, scheduled)
  trust-score.queue           (baixa prioridade, async update)

FRONTEND — Next.js 14 (App Router)
────────────────────────────────────
Apps web:
  - Admin panel: Next.js + Tailwind + Shadcn/ui
  - Provider web: Next.js (para onboarding e dashboard)
  - Landing pages: Next.js (SSG para SEO)

Mobile: React Native + Expo SDK 51
  - Code sharing com web (hooks, utils, types)
  - Expo Managed Workflow (deploy OTA via EAS)
  - Expo Router (file-based routing)
  - Hermes JS engine (performance)
  - Expo Push Notifications (abstrai FCM/APNS)

API CLIENT: tRPC (type-safe end-to-end) ou REST com Zod schemas
  - Types gerados automaticamente do backend
  - Zero runtime errors de type mismatch

SEARCH — PostgreSQL FTS (MVP) → Typesense (Growth)
────────────────────────────────────────────────────
MVP: pg_trgm + to_tsvector para busca de categorias
  - Sem infraestrutura adicional
  - Suficiente para <100k registros

Growth: Typesense (open-source, self-hosted)
  - Melhor que Elasticsearch para nosso caso (mais simples)
  - Typo-tolerance nativa
  - Latência < 50ms
  - Fácil de sincronizar com Prisma via eventos

Scale: Elasticsearch (se Typesense não atender)
  - Para queries geoespaciais complexas
  - Para faceted search avançado
```

---

### 7.2 Diagrama Completo da Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                   │
│   iOS App    Android App    Web (Browser)    B2B API             │
└──────┬───────────┬───────────────┬──────────────┬───────────────┘
       │           │               │              │
       └───────────┴───────────────┴──────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    CLOUDFLARE CDN    │
                    │  WAF + DDoS + Cache  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    API GATEWAY       │
                    │  (Kong / AWS APIGW)  │
                    │  Rate Limit | Auth   │
                    │  Routing | Logging   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐    ┌────────▼──────┐    ┌───────▼──────┐
   │  REST API    │    │  WebSocket    │    │  gRPC (S2S)  │
   │  (NestJS)    │    │  Gateway      │    │  Internal    │
   └──────┬───────┘    └───────────────┘    └──────────────┘
          │
   ┌──────▼──────────────────────────────────────────────┐
   │              MODULAR MONOLITH (NestJS)               │
   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
   │  │ Identity │  │ Booking  │  │    Payments      │   │
   │  └──────────┘  └──────────┘  └──────────────────┘   │
   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
   │  │ Provider │  │ Matching │  │   Notifications  │   │
   │  └──────────┘  └──────────┘  └──────────────────┘   │
   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
   │  │ Reviews  │  │  Trust   │  │    Analytics     │   │
   │  └──────────┘  └──────────┘  └──────────────────┘   │
   └─────────────────────────────┬───────────────────────┘
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      │                          │                          │
┌─────▼──────┐          ┌────────▼───────┐         ┌───────▼──────┐
│ PostgreSQL  │          │     Redis       │         │  Object      │
│ (Primary)  │          │  (Cache+Queue)  │         │  Storage     │
│            │          │                 │         │  (S3/GCS)    │
│ Read       │          │  BullMQ Workers │         └──────────────┘
│ Replica    │          │  Pub/Sub        │
└────────────┘          └─────────────────┘
```

---

### 7.3 Decisões de Infraestrutura

```
CLOUD PROVIDER: AWS (primário)
────────────────────────────────
Por que AWS:
  - Região sa-east-1 (São Paulo) — latência < 30ms para BR
  - Maior ecossistema de serviços gerenciados
  - Melhor suporte a compliance (PCI-DSS, SOC2) no Brasil
  - Parceria de créditos para startups (AWS Activate)

Serviços AWS utilizados:
  ┌─────────────────────────────────────────────────────┐
  │ Compute                                              │
  │   ECS Fargate (MVP) → EKS (Scale)                   │
  │   Lambda para jobs eventuais (cheap, serverless)    │
  │                                                     │
  │ Database                                            │
  │   RDS PostgreSQL (Multi-AZ em produção)             │
  │   ElastiCache Redis (Cluster Mode em Scale)         │
  │                                                     │
  │ Storage                                             │
  │   S3: documentos, fotos, backups                    │
  │   CloudFront: CDN para assets estáticos             │
  │                                                     │
  │ Messaging                                           │
  │   SQS (Growth): substituição de BullMQ               │
  │   MSK (Kafka managed) (Scale)                       │
  │   SNS: fan-out de eventos para múltiplos consumidores│
  │                                                     │
  │ Network                                             │
  │   VPC + Subnets privadas                            │
  │   ALB (Application Load Balancer)                   │
  │   Route 53 (DNS + health checks)                    │
  │   AWS WAF (proteção L7)                             │
  │                                                     │
  │ Security                                            │
  │   KMS: criptografia de dados em repouso             │
  │   Secrets Manager: credenciais de serviços          │
  │   IAM: identity e access management                 │
  │   GuardDuty: threat detection                       │
  │   CloudTrail: auditoria de ações AWS                │
  │                                                     │
  │ Observability                                       │
  │   CloudWatch: logs + alertas básicos                │
  │   X-Ray: distributed tracing                        │
  └─────────────────────────────────────────────────────┘

CONTAINERIZAÇÃO:
  Docker: todos os serviços em container
  docker-compose: desenvolvimento local
  ECS Fargate MVP: sem gerenciar instâncias EC2
  EKS (Kubernetes): quando > 20 serviços ou microsserviços

INFRASTRUCTURE AS CODE:
  Terraform (provisionamento de recursos AWS)
  Helm charts (Kubernetes manifests em Scale)
  Módulos reutilizáveis por ambiente (dev/staging/prod)
```

---

## 8. ARQUITETURA DE SEGURANÇA

### 8.1 Defense in Depth

```
CAMADAS DE SEGURANÇA:

CAMADA 1 — Rede e Perímetro
  ├── Cloudflare WAF (Layer 7 attack protection)
  ├── DDoS mitigation (Cloudflare Pro+)
  ├── VPC com subnets privadas (DB jamais exposto à internet)
  ├── Security Groups restritivos (menor privilege)
  ├── VPN para acesso administrativo (Wireguard/Tailscale)
  └── IP allowlisting para endpoints administrativos

CAMADA 2 — API e Aplicação
  ├── JWT + rotação automática de secrets
  ├── Rate limiting por IP, user, endpoint
  │     Exemplos:
  │       /auth/login: 5 tentativas/min por IP
  │       /api/bookings: 30 requests/min por usuário
  │       /api/search: 60 requests/min por IP
  ├── CORS configurado para domínios conhecidos
  ├── Input validation com Zod em todos os endpoints
  ├── SQL injection: impossível com Prisma (parameterized queries)
  ├── XSS prevention: sanitização de output + CSP headers
  ├── CSRF tokens em formulários sensíveis
  └── Helmet.js: headers de segurança automáticos

CAMADA 3 — Autenticação e Autorização
  ├── Argon2id para hashing de senhas (melhor que bcrypt)
  ├── Sessões com refresh token rotation
  ├── JWT de curta duração (15min access + 30d refresh)
  ├── RBAC (Role-Based Access Control) granular
  ├── Permissões por recurso+ação (payments:read, bookings:cancel)
  ├── Multi-factor authentication (OTP via SMS/WhatsApp)
  └── Device fingerprinting (suspeita em device novo)

CAMADA 4 — Dados
  ├── Criptografia em repouso: AWS KMS + RDS encryption
  ├── Criptografia em trânsito: TLS 1.3 obrigatório
  ├── PII minimization: coletar apenas o necessário
  ├── Token de cartão: nunca armazenar PAN (terceirizar ao gateway)
  ├── Chaves de API criptografadas no banco (AES-256-GCM)
  ├── Backup criptografado com retenção de 30 dias
  └── LGPD: direito de acesso/portabilidade/exclusão implementado

CAMADA 5 — Monitoramento e Resposta
  ├── SIEM: CloudWatch + GuardDuty (anomaly detection)
  ├── Failed login alertas (> 10 em 5 min por IP)
  ├── Privilege escalation alertas
  ├── Data exfiltration detection (queries volumosas incomuns)
  ├── Incident Response Playbook documentado
  └── Pentesting externo semestral
```

---

### 8.2 Gestão de Secrets e Credenciais

```typescript
// NUNCA hardcode secrets — sempre via environment ou AWS Secrets Manager

// secrets.service.ts
@Injectable()
export class SecretsService {
  private cache = new Map<string, { value: string; expiresAt: Date }>();

  async getSecret(name: string): Promise<string> {
    const cached = this.cache.get(name);
    if (cached && cached.expiresAt > new Date()) return cached.value;

    // AWS Secrets Manager com cache de 5 minutos
    const secret = await this.smClient.getSecretValue({ SecretId: name });
    this.cache.set(name, {
      value: secret.SecretString,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    return secret.SecretString;
  }
}

// Secrets organizados por domínio:
// /marketplace/prod/database/url
// /marketplace/prod/payment/pagseguro_token
// /marketplace/prod/notification/whatsapp_token
// /marketplace/prod/identity/jwt_secret
// /marketplace/prod/storage/s3_access_key
```

---

### 8.3 Auditoria e Compliance

```typescript
// Audit log automático via Prisma middleware

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);

  // Log todas as mutações em tabelas sensíveis
  const sensitiveModels = ['User', 'Payment', 'ProviderProfile', 'Payout'];

  if (
    sensitiveModels.includes(params.model) &&
    ['create', 'update', 'delete'].includes(params.action)
  ) {
    await prisma.auditLog.create({
      data: {
        actor_id: getCurrentUserId(), // injetado via AsyncLocalStorage
        action: params.action.toUpperCase() as AuditAction,
        entity_type: params.model,
        entity_id: params.args?.where?.id ?? result?.id,
        old_values: params.action === 'update' ? params.args.where : null,
        new_values: params.args.data,
        ip_address: getCurrentIp(),
        created_at: new Date(),
      },
    });
  }

  return result;
});
```

---

## 9. ARQUITETURA MOBILE

### 9.1 Estrutura do App React Native

```
APPS MOBILE:
─────────────
├── apps/
│   ├── client-app/          # App do Cliente
│   │   ├── app/             # Expo Router (file-based)
│   │   │   ├── (auth)/      # Telas de autenticação
│   │   │   ├── (main)/      # Tab navigator principal
│   │   │   │   ├── home/    # Busca e categorias
│   │   │   │   ├── bookings/ # Meus pedidos
│   │   │   │   ├── chat/    # Mensagens
│   │   │   │   └── profile/ # Perfil e configurações
│   │   │   └── booking/     # Fluxo de agendamento (stack)
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand stores (estado global)
│   │   └── utils/           # Helpers
│   │
│   └── provider-app/        # App do Prestador
│       ├── app/
│       │   ├── (auth)/
│       │   ├── (main)/
│       │   │   ├── requests/ # Novos pedidos (lista + mapa)
│       │   │   ├── schedule/ # Agenda do dia/semana
│       │   │   ├── earnings/ # Ganhos e histórico
│       │   │   └── profile/  # Perfil e documentos
│       │   └── active/       # Serviço em andamento (tracking)
│       ├── components/
│       ├── hooks/
│       └── stores/
│
└── packages/
    ├── shared/              # Código compartilhado
    │   ├── api/             # API client (tRPC/REST)
    │   ├── types/           # TypeScript types compartilhados
    │   ├── utils/           # Funções utilitárias
    │   └── constants/       # Constantes compartilhadas
    └── ui/                  # Design system compartilhado
        ├── components/      # Button, Input, Card, etc.
        ├── theme/           # Colors, typography, spacing
        └── icons/           # Icon set padronizado
```

---

### 9.2 Estado Global e Gerenciamento de Dados

```typescript
// Zustand para estado simples, React Query para dados do servidor

// stores/booking.store.ts — estado do fluxo de agendamento
interface BookingFlowState {
  step: 'category' | 'address' | 'datetime' | 'provider' | 'payment' | 'confirm';
  categoryId: string | null;
  address: UserAddress | null;
  scheduledAt: Date | null;
  selectedProvider: Provider | null;
  priceBreakdown: PriceBreakdown | null;

  setCategory: (id: string) => void;
  setAddress: (address: UserAddress) => void;
  setDateTime: (date: Date) => void;
  selectProvider: (provider: Provider) => void;
  reset: () => void;
}

export const useBookingFlow = create<BookingFlowState>((set) => ({
  step: 'category',
  categoryId: null,
  address: null,
  scheduledAt: null,
  selectedProvider: null,
  priceBreakdown: null,

  setCategory: (id) => set({ categoryId: id, step: 'address' }),
  setAddress: (address) => set({ address, step: 'datetime' }),
  setDateTime: (date) => set({ scheduledAt: date, step: 'provider' }),
  selectProvider: (provider) => set({ selectedProvider: provider, step: 'payment' }),
  reset: () => set({ step: 'category', categoryId: null, address: null,
    scheduledAt: null, selectedProvider: null, priceBreakdown: null }),
}));

// React Query para dados do servidor (cache + sync)
export function useProviders(context: SearchContext) {
  return useQuery({
    queryKey: ['providers', context],
    queryFn: () => api.search.providers(context),
    staleTime: 30_000,     // 30s — resultados de busca são frescos por 30s
    cacheTime: 5 * 60_000, // 5min — cache em memória
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
```

---

### 9.3 Performance Mobile

```
ESTRATÉGIAS DE PERFORMANCE:

1. LISTA DE PRESTADORES (FlatList otimizada):
   - keyExtractor estável (provider.id)
   - getItemLayout para altura fixa (evita recalculate)
   - windowSize={5} (renderiza 5 viewports)
   - removeClippedSubviews={true}
   - initialNumToRender={8}

2. IMAGENS:
   - expo-image (melhor que react-native Image)
   - Blurhash placeholder enquanto carrega
   - Lazy loading com intersection observer
   - Imagens servidas via CloudFront com resize (800px max)
   - WebP em vez de JPEG (30% menor)

3. MAPA (busca geoespacial):
   - Clusterer de pins para > 50 prestadores no mapa
   - Mapa renderizado apenas quando ativo (lazy mount)
   - Tiles cacheados localmente (Mapbox SDK)
   - Animação de câmera com spring physics

4. NAVEGAÇÃO:
   - Expo Router com lazy loading por rota
   - Screens críticas (home, booking) pré-carregadas
   - Skeleton loading em vez de spinner

5. OFFLINE SUPPORT:
   - React Query persist com MMKV
   - Histórico de bookings disponível offline
   - Push notifications funcionam offline (FCM)
   - Sincronização ao reconectar

6. BUNDLE SIZE:
   - Code splitting por rota (Expo Router automático)
   - Tree shaking rigoroso
   - Metro bundler com minificação Hermes
   - Assets otimizados (SVG em vez de PNG para ícones)

MÉTRICAS ALVO:
  Time to Interactive (TTI): < 2s em 4G
  App size download: < 30MB
  Frame rate: 60fps constante (sem janks)
  Memory: < 150MB em uso ativo
```

---

## 10. ARQUITETURA DE RASTREAMENTO EM TEMPO REAL

### 10.1 Location Tracking Architecture

```
FLUXO DE RASTREAMENTO:

[Provider App]
      │ GPS update (a cada 10s quando serviço ativo)
      │ GPS update (a cada 60s quando disponível)
      ▼
[WebSocket Connection]
      │ payload: { providerId, lat, lng, accuracy, timestamp }
      ▼
[WebSocket Gateway (NestJS)]
      │ Validates token, extracts providerId
      │ Throttles: max 1 update/10s por provider
      ▼
[Redis GEOADD]
      │ GEOADD providers lat lng providerId
      │ EXPIRE provider:{id}:location 120  (TTL 2min = "online")
      ▼
[Pub/Sub para clientes interessados]
      │ PUBLISH provider.location.{bookingId} {lat, lng}
      ▼
[Client App WebSocket]
      │ Recebe update em tempo real
      ▼
[Mapa com animação suave]
```

```typescript
// realtime/tracking.gateway.ts

@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: process.env.ALLOWED_ORIGINS },
})
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  // Provider envia sua localização
  @SubscribeMessage('location:update')
  @UseGuards(WsAuthGuard)
  @Throttle({ default: { limit: 1, ttl: 10000 } }) // max 1/10s
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: LocationUpdateDto,
  ) {
    const providerId = client.user.providerId;

    // Salva no Redis GEO
    await this.redis.geoadd(
      'providers:locations',
      dto.longitude,
      dto.latitude,
      providerId,
    );
    await this.redis.expire(`provider:${providerId}:online`, 120);

    // Publica para clientes com booking ativo com esse prestador
    const activeBookingId = await this.redis.get(
      `provider:${providerId}:active_booking`,
    );
    if (activeBookingId) {
      this.server
        .to(`booking:${activeBookingId}`)
        .emit('provider:location', {
          lat: dto.latitude,
          lng: dto.longitude,
          accuracy: dto.accuracy,
        });
    }
  }

  // Cliente se inscreve para atualizações de um booking
  @SubscribeMessage('booking:subscribe')
  @UseGuards(WsAuthGuard)
  async handleBookingSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() bookingId: string,
  ) {
    // Verifica se o cliente tem acesso ao booking
    const booking = await this.bookingService.findByIdForUser(
      bookingId,
      client.user.id,
    );
    if (!booking) throw new WsException('Booking not found');

    client.join(`booking:${bookingId}`);

    // Envia localização atual imediatamente
    const [lng, lat] = await this.redis.geopos(
      'providers:locations',
      booking.providerId,
    );
    if (lat && lng) {
      client.emit('provider:location', { lat: parseFloat(lat), lng: parseFloat(lng) });
    }
  }
}
```

---

### 10.2 ETA Calculation

```typescript
// tracking/eta.service.ts

@Injectable()
export class EtaService {
  async calculateETA(
    providerLat: number,
    providerLng: number,
    destinationLat: number,
    destinationLng: number,
    mode: 'driving' | 'transit' = 'driving',
  ): Promise<ETAResult> {
    // Tentativa 1: Google Maps Distance Matrix API
    try {
      const result = await this.googleMaps.distanceMatrix({
        origins: [{ lat: providerLat, lng: providerLng }],
        destinations: [{ lat: destinationLat, lng: destinationLng }],
        mode: mode as TravelMode,
        departure_time: new Date(),
        traffic_model: TrafficModel.best_guess,
      });

      return {
        distance_meters: result.rows[0].elements[0].distance.value,
        duration_seconds: result.rows[0].elements[0].duration_in_traffic.value,
        source: 'google_maps',
      };
    } catch {
      // Fallback: Haversine + speed estimativa
      const distanceKm = haversineDistance(
        providerLat, providerLng,
        destinationLat, destinationLng,
      );
      const avgSpeedKmh = 25; // Velocidade média urbana em SP
      const durationSeconds = (distanceKm / avgSpeedKmh) * 3600;

      return {
        distance_meters: distanceKm * 1000,
        duration_seconds: durationSeconds,
        source: 'haversine_estimate',
      };
    }
  }
}
```

---

## 11. ARQUITETURA DE COMUNICAÇÃO EM TEMPO REAL

### 11.1 WebSocket vs Polling vs Push

```
DECISÃO POR CASO DE USO:

╔═══════════════════════════════╦═══════════════╦══════════════╗
║ Caso de Uso                   ║ Protocolo      ║ Frequência   ║
╠═══════════════════════════════╬═══════════════╬══════════════╣
║ Localização do prestador      ║ WebSocket      ║ 10s          ║
║ Status do booking em andamento║ WebSocket      ║ On-change    ║
║ Chat em tempo real            ║ WebSocket      ║ On-message   ║
║ Confirmação de novo pedido    ║ Push (FCM)     ║ On-event     ║
║ Lembrete de serviço D-1       ║ Push + WhatsApp║ Scheduled    ║
║ Histórico de bookings         ║ REST + Cache   ║ On-demand    ║
║ Listagem de prestadores       ║ REST + Cache   ║ On-demand    ║
╚═══════════════════════════════╩═══════════════╩══════════════╝

REGRA GERAL:
  - Dados que mudam frequentemente E o usuário está com o app aberto → WebSocket
  - Notificações quando o app está fechado → Push Notification
  - Dados estáticos ou muda raramente → REST + Cache agressivo
```

---

### 11.2 Push Notifications Architecture

```
PUSH NOTIFICATION FLOW:

Backend emite evento
        │
        ▼
Notification Service
        │
        ├── Verifica preferências do usuário (opt-in?)
        ├── Verifica horário (não enviar push às 3h)
        ├── Seleciona canal prioritário por tipo:
        │     BOOKING_CONFIRMED → WhatsApp + Push
        │     PROVIDER_EN_ROUTE → Push + SMS
        │     PAYMENT_RECEIVED → WhatsApp
        │     REVIEW_REMINDER → Push (24h após conclusão)
        │
        └── Envia via provider adequado
              ├── FCM (Android + Web)
              ├── APNS (iOS)
              ├── WhatsApp Business API (Meta)
              ├── SMS (Twilio / AWS SNS)
              └── Email (SendGrid)

CONFIGURAÇÃO DE TOKENS:

// Registra/atualiza push token quando app abre
useEffect(() => {
  async function registerPushToken() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    // Salva no backend
    await api.devices.upsertPushToken({
      token,
      platform: Platform.OS,
      appVersion: Constants.expoConfig.version,
    });
  }
  registerPushToken();
}, []);

DEEP LINKING:
  Notificação → tap → abre app na tela correta

  Exemplos de deep links:
  marketplace://booking/{id}           → tela do booking
  marketplace://chat/{bookingId}       → chat do booking
  marketplace://provider/{id}/review   → deixar avaliação
  marketplace://payments               → tela de pagamentos
```

---

## 12. PIPELINE DE CI/CD E QUALIDADE

### 12.1 GitHub Actions Workflow

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test:unit --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  integration-tests:
    needs: quality
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: marketplace_test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/marketplace_test
          REDIS_URL: redis://localhost:6379

  deploy-staging:
    needs: integration-tests
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t $ECR_REGISTRY/api:staging-${{ github.sha }} .

      - name: Push to ECR
        run: docker push $ECR_REGISTRY/api:staging-${{ github.sha }}

      - name: Deploy to ECS Staging
        run: |
          aws ecs update-service \
            --cluster marketplace-staging \
            --service api \
            --force-new-deployment

      - name: Run smoke tests
        run: pnpm test:smoke --env=staging

  deploy-production:
    needs: integration-tests
    if: github.ref == 'refs/heads/main'
    environment: production  # Requer aprovação manual
    runs-on: ubuntu-latest
    steps:
      - name: Blue/Green deploy via CodeDeploy
        run: |
          aws deploy create-deployment \
            --application-name marketplace-api \
            --deployment-group-name production \
            --revision imageUri=$ECR_REGISTRY/api:${{ github.sha }}

      - name: Wait for deployment
        run: aws deploy wait deployment-successful --deployment-id $DEPLOYMENT_ID

      - name: Run production smoke tests
        run: pnpm test:smoke --env=production

      - name: Rollback on failure
        if: failure()
        run: aws deploy stop-deployment --deployment-id $DEPLOYMENT_ID --auto-rollback-enabled
```

---

### 12.2 Estratégia de Testes

```
PIRÂMIDE DE TESTES:

                  /\
                 /E2E\           (5%) — Cypress/Playwright
                /──────\             Fluxos críticos: booking, payment
               /  Integ  \      (25%) — Jest + Supertest + TestContainers
              /────────────\        Módulos + integração com DB real
             /   Unit Tests  \   (70%) — Jest + mocks
            /────────────────────   Services, utils, engines

COVERAGE MÍNIMO (enforced no CI):
  - Matching Engine: 100% (crítico)
  - Pricing Engine: 100% (crítico)
  - Payment Service: 95%+ (financeiro)
  - Booking Service: 90%+
  - Overall: > 80%

TESTES DE CONTRATO:
  - Pact.js para contratos de API entre módulos
  - Garante que mudanças não quebram consumidores

TESTES DE PERFORMANCE:
  - k6 para load testing (simula 1000 usuários simultâneos)
  - Gatling para stress testing
  - Rodados semanalmente em staging, antes de cada release major

TESTES DE SEGURANÇA:
  - OWASP ZAP automated scan (CI)
  - Snyk para vulnerabilidades em dependências (CI)
  - Semgrep para SAST (Static Application Security Testing)
  - Penetration testing manual semestral
```

---

## 13. INTEGRAÇÕES EXTERNAS

### 13.1 Mapa de Integrações

```
INTEGRAÇÕES CRÍTICAS (MVP):

PAGAMENTOS:
  Asaas (BR): PIX nativo + cartões + boleto + split de pagamento
  Alternativa: PagSeguro / Juno
  Fallback: Stripe (cartão internacional)

  Por que Asaas para MVP:
  - Split de pagamento nativo (sem precisar de subconta complexa)
  - PIX integrado nativamente
  - Documentação excelente para desenvolvedores BR
  - Sandbox completo

VERIFICAÇÃO DE IDENTIDADE:
  Unico Check (BR): selfie + liveness + validação de documento
  Alternativa: idwall, Serpro gov.br API

ANTECEDENTES CRIMINAIS:
  Background Brasil: API de certidões estaduais
  Alternativa: BigData Corp, Serasa Premium

GEOLOCALIZAÇÃO:
  Google Maps Platform:
  - Maps SDK (exibição de mapas no app)
  - Geocoding API (CEP → lat/lng)
  - Distance Matrix API (ETA de prestadores)
  - Places API (autocompletar endereço)

  Alternativa (custo): Mapbox (mais barato em escala)
  Fallback: OpenStreetMap + Nominatim (gratuito, mas lento)

COMUNICAÇÃO:
  WhatsApp: Meta Business API (via BSP: Zenvia ou Take Blip)
  SMS: Twilio ou AWS SNS
  Email: SendGrid ou AWS SES
  Push: Firebase (FCM) + Apple Push Notification Service

INTEGRAÇÕES GROWTH:

CRM:
  HubSpot (para B2B sales)
  Intercom (para customer success)

ANALYTICS:
  Amplitude (product analytics)
  PostHog (self-hosted, product analytics + feature flags)
  Mixpanel (alternativa)

MONITORAMENTO:
  Datadog (APM + logs + dashboards) — MVP
  Sentry (error tracking) — MVP
  PagerDuty (alertas e on-call) — Growth

BI/DATA WAREHOUSE:
  BigQuery + Looker Studio (Growth)
  Metabase self-hosted (MVP)

JURÍDICO/CONTRATOS:
  DocuSign ou D4Sign (assinatura eletrônica de contratos B2B)
  Nota Fiscal: NF-e via Conta Azul ou Omie
```

---

### 13.2 Resiliência em Integrações Externas

```typescript
// integrations/resilient-client.ts
// Wrapper que adiciona retry, circuit breaker e timeout a qualquer integração

@Injectable()
export class ResilientHttpClient {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  async call<T>(
    serviceName: string,
    fn: () => Promise<T>,
    options: {
      timeout?: number;
      retries?: number;
      fallback?: () => T | Promise<T>;
    } = {},
  ): Promise<T> {
    const { timeout = 5000, retries = 3, fallback } = options;

    let breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      breaker = new CircuitBreaker({
        openAfterFailures: 5,
        halfOpenAfterMs: 30_000,
        closedAfterSuccesses: 2,
      });
      this.circuitBreakers.set(serviceName, breaker);
    }

    // Se circuit está aberto, usa fallback
    if (breaker.isOpen) {
      if (fallback) return fallback();
      throw new ServiceUnavailableException(`${serviceName} is currently unavailable`);
    }

    try {
      const result = await Promise.race([
        this.withRetry(fn, retries),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeout),
        ),
      ]);
      breaker.recordSuccess();
      return result;
    } catch (error) {
      breaker.recordFailure();
      if (fallback) return fallback();
      throw error;
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
    let lastError: Error;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await sleep(Math.pow(2, attempt) * 100); // exponential backoff
        }
      }
    }
    throw lastError;
  }
}

// Uso:
const eta = await resilientClient.call(
  'google-maps',
  () => googleMaps.distanceMatrix(params),
  {
    timeout: 3000,
    retries: 2,
    fallback: () => calculateHaversineETA(params), // fallback local
  },
);
```

---

## 14. ESTRUTURA DE TIME E HIRING ROADMAP

### 14.1 Time MVP (meses 0-6) — 4-6 pessoas

```
CTO / Tech Lead (1)
  └── Responsabilidades:
      - Arquitetura geral e decisões técnicas
      - Backend principal (NestJS + Postgres)
      - Code review de toda a stack
      - DevOps (CI/CD, AWS)
      - Hiring e mentoring

Backend Engineer (1)
  └── Foco:
      - Módulos de pagamento e matching
      - Integrações externas (KYC, notificações)
      - APIs REST

Mobile Engineer (1)
  └── Foco:
      - React Native (iOS + Android)
      - Experiência do cliente e prestador
      - Performance e UX

Full-stack / Frontend (1)
  └── Foco:
      - Admin panel (Next.js)
      - Landing pages
      - Design system básico

Ops / Success (1)
  └── Foco:
      - Onboarding de prestadores
      - Suporte aos primeiros usuários
      - Verificação de documentos

SKILLS OBRIGATÓRIOS NO TIME:
  - TypeScript (todo o time)
  - PostgreSQL (CTO + BE)
  - React Native (mobile)
  - Redis (CTO + BE)
  - AWS básico (CTO)

SKILLS NICE-TO-HAVE:
  - PostGIS (geospatial)
  - BullMQ / filas
  - Prisma ORM
  - Docker
```

---

### 14.2 Evolução do Time por Fase

```
GROWTH STAGE (meses 6-18) — 10-15 pessoas

Novos hires:
  +1 Backend Engineer (especialista em dados / analytics)
  +1 Mobile Engineer (iOS ou Android nativo para otimização)
  +1 Data Analyst
  +1 Product Manager
  +2 Customer Success (time de suporte)
  +1 Growth Engineer (growth hacking, referral, SEO)
  +1 Designer UX/UI

SCALE STAGE (meses 18-36) — 25-40 pessoas

Áreas que crescem:
  Engineering: +5 BE, +2 Mobile, +2 Data/ML, +1 Platform/SRE
  Product: +2 PM, +2 Designer
  Data: +1 Data Engineer, +1 ML Engineer
  Ops: +5 CS, +2 City Ops per nova cidade
  Finance: +1 FinOps Engineer

ESTRUTURA DE SQUADS (Growth+):
  Squad Booking (2BE + 1Mobile + 1PM): booking, scheduling, recurrence
  Squad Growth (1BE + 1FE + 1PM): acquisition, referral, promotions
  Squad Payments (2BE + 1PM): payment, payout, commission
  Squad Trust (1BE + 1PM): KYC, fraud, disputes
  Squad Data (1BE + 1DS + 1PM): analytics, ML matching
  Platform Squad (1SRE + 1BE): infra, CI/CD, reliability

HIRING PHILOSOPHY:
  - Preferir generalistas no início (fazem múltiplas coisas)
  - Especialistas quando há domínio suficiente para especialização
  - Senior primeiro: mais caro mas menos supervisão necessária
  - Cultura: ownership, autonomia, foco em resultado, velocidade
  - Equity generoso para os primeiros 10 hires (0.1%-1.0% cada)
```

---

## 15. ROADMAP TÉCNICO DE 24 MESES

### 15.1 Visão Consolidada

```
MESES 0-3: FUNDAÇÃO
─────────────────────
Tech:
  [x] NestJS monolith estruturado com módulos
  [x] PostgreSQL + PostGIS configurado
  [x] Redis (cache + BullMQ)
  [x] Autenticação JWT + OTP
  [x] Integração de pagamento (Asaas/PIX + cartão)
  [x] KYC básico (Unico ou idwall)
  [x] React Native app (iOS + Android)
  [x] Admin panel básico (Next.js)
  [x] CI/CD (GitHub Actions → ECS Fargate)
  [x] Notificações (WhatsApp + Push)
  [x] Matching heurístico (weighted scoring)
  [x] Geo search (PostGIS GIST index)

Produto:
  [x] Jornada completa: busca → booking → pagamento → review
  [x] Rastreamento básico do prestador
  [x] Suporte via WhatsApp

MESES 3-6: RECORRÊNCIA E CONFIANÇA
─────────────────────────────────────
Tech:
  [ ] Recurrence engine (bookings automáticos)
  [ ] Trust score v1 (regras + pesos)
  [ ] Pricing engine com urgência e surge
  [ ] GPS spoofing detection básico
  [ ] Analytics events pipeline (PostHog)
  [ ] Sentry error tracking

Produto:
  [ ] Planos recorrentes (quinzenal, mensal)
  [ ] Chat in-app básico (WebSocket)
  [ ] Reviews obrigatórias após booking
  [ ] Disputas (fluxo de reembolso)

MESES 6-12: ESCALA E MULTI-CIDADE
───────────────────────────────────
Tech:
  [ ] Read replica PostgreSQL
  [ ] Redis cache agressivo (resultados de busca)
  [ ] BullMQ filas separadas por domínio
  [ ] Feature flags (LaunchDarkly ou PostHog)
  [ ] A/B testing framework
  [ ] Typesense (search melhorado)
  [ ] Instrumentação completa (impressions, clicks)
  [ ] Metabase + BigQuery (analytics)

Produto:
  [ ] 3+ cidades operacionais
  [ ] B2B básico (condomínios)
  [ ] Referral program
  [ ] Prestador dashboard (ganhos, agenda, métricas)
  [ ] Assinatura de prestador (FREE/PROFESSIONAL/PREMIUM)

MESES 12-18: ML E INTELIGÊNCIA
────────────────────────────────
Tech:
  [ ] Feature store v1 (batch features daily)
  [ ] LightGBM matching model (shadow mode)
  [ ] A/B test: heurístico vs ML (10% tráfego)
  [ ] Fraud detection ML básico
  [ ] Demand forecasting por zona
  [ ] Dynamic pricing automático

Produto:
  [ ] ML matching em 100% do tráfego
  [ ] Personalização básica por cliente
  [ ] "Seu prestador favorito" (match histórico)
  [ ] Notificações inteligentes ("hora de limpar?")
  [ ] Insurance básico (parceria)

MESES 18-24: PLATAFORMA E EXPANSÃO
────────────────────────────────────
Tech:
  [ ] Kafka event streaming
  [ ] Primeiros microsserviços extraídos:
      - Notification Service
      - Payment Service
  [ ] Near-realtime feature store (Flink)
  [ ] Multi-region preparação
  [ ] SOC2 Type I certificação iniciada

Produto:
  [ ] 8+ cidades
  [ ] Enterprise sales (contratos anuais)
  [ ] Serviços financeiros v1 (adiantamento de recebíveis)
  [ ] Internacional: piloto México ou Colômbia
  [ ] Marketplace de seguros (parceiro)
```

---

### 15.2 Decisões Técnicas com Datas de Revisão

```
DECISÃO                    │ AGORA         │ REVISAR EM
───────────────────────────┼───────────────┼────────────────
Monolith vs Microsserviços │ Monolith      │ mês 18 (50k bookings/mês)
PostgreSQL vs NoSQL        │ PostgreSQL    │ mês 24 (never — manter)
Redis BullMQ vs SQS        │ BullMQ        │ mês 12 (multi-região)
REST vs GraphQL            │ REST + tRPC   │ mês 18 (B2B API needs)
ECS vs EKS                 │ ECS Fargate   │ mês 18 (20+ serviços)
Heurístico vs ML Matching  │ Heurístico    │ mês 9 (10k bookings)
PIX/Asaas vs Stripe        │ Asaas (BR)    │ mês 24 (internacional)
Self-hosted vs SaaS logs   │ CloudWatch    │ mês 12 (volume alto)
Typesense vs Elasticsearch │ Typesense     │ mês 18 (10M+ docs)
PostHog vs Amplitude       │ PostHog       │ mês 12 (features avançadas)
```

---

## 16. GLOSSÁRIO E REFERÊNCIAS

### 16.1 Glossário de Termos

```
TERMOS DE NEGÓCIO:
  GMV (Gross Merchandise Value): Valor total dos serviços transacionados
  Take Rate: Percentual do GMV que fica com a plataforma
  Fill Rate: % de buscas que resultam em booking confirmado
  Ghost Rate: % de buscas sem nenhum prestador disponível
  Completion Rate: % de bookings aceitos que são concluídos
  CAC (Customer Acquisition Cost): Custo por cliente adquirido
  LTV (Lifetime Value): Receita total gerada por um cliente ao longo do tempo
  D30/D90/D180: Retention rate em 30, 90 e 180 dias após o primeiro booking
  Repeat Rate: % de clientes que fazem > 1 booking em N dias
  NPS (Net Promoter Score): Métrica de satisfação (-100 a +100)

TERMOS TÉCNICOS:
  Bounded Context: Fronteira lógica de um domínio de negócio
  Event Sourcing: Padrão de salvar todos os eventos (não só o estado atual)
  CQRS: Command Query Responsibility Segregation
  Saga Pattern: Coordenação de transações distribuídas
  Outbox Pattern: Garantia de entrega de eventos
  Circuit Breaker: Proteção contra falhas em cascata
  Idempotency: Operação segura de repetir sem efeitos colaterais
  Strangler Fig: Padrão de migração gradual de monolith para microsserviços

TERMOS OPERACIONAIS:
  KYC (Know Your Customer): Verificação de identidade do usuário
  KYB (Know Your Business): Verificação de pessoa jurídica
  AML (Anti-Money Laundering): Prevenção de lavagem de dinheiro
  LGPD: Lei Geral de Proteção de Dados (BR equivalente do GDPR)
  SLA (Service Level Agreement): Acordo de nível de serviço
  P0/P1/P2/P3: Níveis de prioridade de incidente
  MTTR: Mean Time To Recovery (tempo médio de recuperação)
  MTTD: Mean Time To Detection (tempo médio de detecção)
```

---

### 16.2 Referências Arquiteturais

```
LIVROS:
  - "Designing Data-Intensive Applications" — Martin Kleppmann
  - "Building Microservices" — Sam Newman
  - "Domain-Driven Design" — Eric Evans
  - "Clean Architecture" — Robert C. Martin
  - "System Design Interview" — Alex Xu

PAPERS E BLOGS:
  - Uber Engineering Blog (real-time location, matching)
  - Stripe Engineering Blog (payments, idempotency)
  - Airbnb Engineering Blog (trust, marketplace dynamics)
  - Netflix Tech Blog (resilience patterns)
  - Martin Fowler's blog (enterprise patterns)

DOCUMENTOS RELACIONADOS:
  → BLOCO B: Especificação detalhada de APIs e contratos
  → BLOCO C: Arquitetura de Microsserviços (migração futura)
  → BLOCO D: Sistema de IA de Matching
  → BLOCO E: Estratégia de Valuation e Crescimento
  → SYNTHESIS: Síntese estratégica e prioridades de execução
  → schema.prisma: Schema de banco de dados completo
```
