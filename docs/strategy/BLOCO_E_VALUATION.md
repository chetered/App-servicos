# BLOCO E — Estratégia de Valuation US$100M+

> **Documento de referência estratégica**: tese de investimento, modelo financeiro completo,
> análise de comparáveis, cohort economics, cap table, sensitivity analysis e roadmap de valor.
> Atualizado para refletir as decisões técnicas dos BLOCOs A–D.

---

## 1. TESE DE INVESTIMENTO

### A Narrativa para o Investidor

> *"O Brasil tem 4+ milhões de prestadores de serviços autônomos sem acesso eficiente a clientes
> e sem infraestrutura profissional. Ao mesmo tempo, famílias de classe média perdem 40+ horas/ano
> procurando prestadores confiáveis. Estamos construindo a infraestrutura que conecta esses dois
> lados — com a confiança, qualidade e recorrência que nenhum player atual consegue entregar."*

### Por que Agora

| Fator | Status 2024 | Impacto |
|---|---|---|
| Penetração de smartphones | >85% (incl. classe C/D) | Supply e demand acessíveis |
| Pix | 80M+ usuários, instantâneo, gratuito | Fricção de pagamento = zero |
| Informalidade do setor | 72% dos prestadores sem CNPJ | Oportunidade de formalizar e capturar valor |
| Validação de mercado | GetNinjas/Parafuzo provaram demanda | Mas não resolveram confiança nem recorrência |
| Custos de cloud/ML | Barreira tecnológica = mínima | Time pequeno pode construir produto de classe mundial |

### Por que Nós

**Três apostas que o mercado ainda não resolveu:**

1. **Trust-first**: Verificação biométrica + antecedentes + seguro integrado. Não é feature — é a fundação.
2. **Recorrência como modelo**: Cliente não agenda *um* serviço, ele agenda *uma relação*. Cada cliente recorrente vale 10x um transacional.
3. **Matching por IA**: Qualidade de resultado mensurável e crescente. Cada booking melhora o próximo.

### Tamanho do Mercado

```
TAM: R$ 800B    ← total de serviços para o lar no Brasil
SAM: R$ 80B     ← serviços acessíveis por plataforma digital (ticktes de R$50-1.000)
SOM: R$ 2B      ← 2,5% do SAM em 5 anos (atingível com 3 cidades grandes + recorrência)

Referência: GetNinjas tem ~R$ 50M ARR com product inferior e sem recorrência.
Com recorrência, nosso LTV/CAC > 10x vs. ~2x deles.
```

---

## 2. ANÁLISE DE COMPARÁVEIS

### Marketplaces de Serviços Globais

| Empresa | País | Revenue (último ano) | Múltiplo EV/Revenue | Valuation | Diferencial |
|---|---|---|---|---|---|
| Angi (IAC) | EUA | US$ 2.1B | 1.8x | US$ 3.8B | Líderes de geração de leads |
| Thumbtack | EUA | ~US$ 350M | ~8x (Series F) | ~US$ 2.9B | Match instantâneo, sem bidding |
| TaskRabbit (Ikea) | EUA/Europa | ~US$ 200M | Adquirida por ~US$ 500M | — | Marketplace de tarefas imediatas |
| Homejoy | EUA | Faliu | — | — | Não resolveu confiança + economics ruins |
| Handy (ANGI) | EUA | ~US$ 150M | Adquirida ~US$ 300M | — | Foco em limpeza, recorrência |
| Uber Services | Global | ~US$ 400M GMV | — | Bundled | Extensão do Uber app |
| GetNinjas | BR | ~R$ 50M | ~6x | ~R$ 300M | Lead gen puro, sem booking, sem trust |
| Parafuzo | BR | ~R$ 10M | ~5x | ~R$ 50M | Foco em manutenção, sem recorrência |

**Insight chave**: Marketplaces de serviços com **recorrência** e **trust** comprovados recebem múltiplos
3-5x superiores a plataformas transacionais. Thumbtack (8x) vs. Angi (1.8x) demonstra isso
— Thumbtack tem repeat rate 2x maior.

### Por que Valuation de US$100M é Conservador

```
Nossa trajetória comparada a Thumbtack (ajustado ao mercado BR):

Thumbtack Série B (2014):
  Revenue: ~US$ 25M ARR
  Múltiplo: ~10x ARR
  Valuation: ~US$ 250M

Nossa Série B (projeção mês 30):
  Revenue: ~R$ 36M ARR (~US$ 7.5M)
  Mercado BR vs. EUA: ~4x desconto justo
  Múltiplo aplicável: 8-12x ARR
  Valuation: US$ 60-90M → US$100M com prêmio por recorrência

Série A (projeção mês 18):
  Revenue: ~R$ 13M ARR (~US$ 2.7M)
  Múltiplo: 12-15x ARR (maior múltiplo = estágio anterior, maior crescimento)
  Valuation: US$ 32-40M
```

---

## 3. UNIT ECONOMICS PROFUNDOS

### Cohort Model — Como o LTV se Acumula

```
Cohort de 1.000 clientes adquiridos no Mês 1:

Mês 1:   1.000 clientes ativos   (booking rate 80% no 1º mês)
Mês 3:     350 clientes ativos   (D90 retention = 35%)
Mês 6:     200 clientes ativos   (D180 retention = 20%)
Mês 12:    150 clientes ativos   (D360 retention = 15%)
Mês 24:    110 clientes ativos   (D720 retention = 11%)
Mês 36:     85 clientes ativos   (D1080 retention = 8.5%)

Bookings por cliente ativo/mês (média): 1.8x
GMV por booking: R$ 150 (ticket médio)
Take rate: 18%

Revenue por mês, por coorte de 1.000 clientes:
  Mês 1:  1.000 × 1.8 × 150 × 18% = R$ 48.600
  Mês 3:    350 × 1.8 × 150 × 18% = R$ 17.010
  Mês 6:    200 × 1.8 × 150 × 18% = R$ 9.720
  Mês 12:   150 × 1.8 × 150 × 18% = R$ 7.290
  Mês 24:   110 × 1.8 × 150 × 18% = R$ 5.346
  Mês 36:    85 × 1.8 × 150 × 18% = R$ 4.131

LTV acumulado da coorte (36 meses): ~R$ 250.000

LTV por cliente (36m): R$ 250
CAC blended: R$ 80-120
LTV/CAC: 2.1–3.1x ← fase MVP, conservador

Com recorrência (30% da base em planos recorrentes):
  Clientes recorrentes retêm 3x mais (D360 = 45%)
  Booking rate: 3.5x/mês (quinzenal)
  LTV recorrente (36m): R$ 900/cliente
  LTV/CAC recorrente: 7.5–11x ← fase growth
```

### Decomposição do CAC por Canal

| Canal | CAC | Volume | Qualidade (LTV/CAC) | Escalabilidade |
|---|---|---|---|---|
| Google Ads Search | R$ 90 | Alto | 2.5x | Alta |
| Meta Ads | R$ 110 | Alto | 2.0x | Alta |
| Referral (cliente indica) | R$ 15 | Médio | 8.0x | Média |
| B2B/Condomínio | R$ 8 | Baixo | 25x | Média |
| SEO Orgânico | R$ 5 | Crescente | 40x | Alta (longo prazo) |
| Community/Influencer | R$ 40 | Médio | 5.0x | Média |
| **Blended (MVP)** | **R$ 100** | — | **3.0x** | — |
| **Blended (Growth)** | **R$ 60** | — | **12x** | — |

**Princípio**: O objetivo não é reduzir CAC absoluto, mas **aumentar LTV** via recorrência.
CAC de R$ 100 com LTV de R$ 1.800 (recorrente, 3 anos) = 18x. Melhor negócio possível.

### Economics por Booking

```
Booking típico: Limpeza Residencial, R$ 150

Cliente paga:         R$ 162  (R$ 150 + service fee 8%)
Prestador recebe:     R$ 127  (R$ 150 - comissão 15%)
Receita bruta plat.:   R$ 35  (comissão R$ 22.50 + service fee R$ 12)
  -  Pagamento/gateway  R$ 4  (2.5% do R$ 162)
  -  Atendimento CS     R$ 2  (custo médio por booking, diluído)
  -  Fraud/chargeback   R$ 1  (0.5% de taxa histórica)
  -  Notificações/infra  R$ 1  (WhatsApp, SMS, push)
─────────────────────────────────────────────────────
Contribution por booking:     R$ 27  (contribution margin: 77%)

Em escala (100k bookings/mês):
  Gross Revenue:    R$ 3.5M/mês
  Contribution:     R$ 2.7M/mês (77%)
  G&A + Sales:      R$ 1.2M/mês (34% do revenue)
  EBITDA:           R$ 1.5M/mês (43%) ← fase scale
```

---

## 4. MODELO FINANCEIRO COMPLETO

### Ano 1 — Projeção Mensal (R$ mil)

| Mês | GMV | Net Rev | Contribution | G&A | EBITDA | Headcount |
|---|---|---|---|---|---|---|
| 1 | 80 | 12 | (30) | 80 | (98) | 6 |
| 2 | 130 | 20 | (25) | 90 | (95) | 7 |
| 3 | 200 | 30 | (20) | 95 | (85) | 8 |
| 4 | 290 | 44 | (15) | 100 | (71) | 9 |
| 5 | 400 | 60 | (10) | 110 | (60) | 10 |
| 6 | 500 | 75 | (5) | 120 | (50) | 12 |
| 7 | 580 | 87 | 5 | 130 | (38) | 13 |
| 8 | 650 | 98 | 18 | 140 | (24) | 14 |
| 9 | 750 | 113 | 30 | 150 | (7) | 15 |
| 10 | 850 | 128 | 45 | 160 | 13 | 16 |
| 11 | 950 | 143 | 55 | 170 | 28 | 17 |
| 12 | 1.100 | 165 | 75 | 185 | 55 | 18 |
| **Ano 1** | **6.480** | **975** | **123** | **1.530** | **(432)** | — |

*Premissas: take rate 15% + service fee médio 0.5%. Contribution margin cresce com escala e diminuição de suporte.*

### Anos 2–5 — Projeção Trimestral (R$ milhões)

| Período | GMV/mês | Net Rev (anual) | Contribution % | EBITDA % | Headcount | Cidades |
|---|---|---|---|---|---|---|
| **Q1 Ano 2** | 1.5M | — | 35% | (20%) | 22 | 1 |
| **Q2 Ano 2** | 2.0M | — | 40% | (15%) | 28 | 2 |
| **Q3 Ano 2** | 2.8M | — | 45% | (8%) | 35 | 2 |
| **Q4 Ano 2** | 3.5M | **R$ 27M** | 50% | 5% | 42 | 3 |
| **Q2 Ano 3** | 7M | — | 55% | 15% | 65 | 5 |
| **Q4 Ano 3** | 12M | **R$ 100M** | 58% | 25% | 90 | 7 |
| **Q4 Ano 4** | 30M | **R$ 280M** | 62% | 35% | 180 | 14 |
| **Q4 Ano 5** | 60M | **R$ 650M** | 65% | 42% | 350 | 22+ |

### Revenue Streams por Fase (% do total)

| Stream | Ano 1 | Ano 2 | Ano 3 | Ano 4 | Ano 5 |
|---|---|---|---|---|---|
| Comissão | 78% | 70% | 62% | 55% | 48% |
| Service Fee (cliente) | 19% | 16% | 14% | 12% | 10% |
| Assinatura Prestador | 3% | 4% | 5% | 5% | 5% |
| Sponsored Listings | 0% | 3% | 5% | 6% | 6% |
| B2B/Enterprise | 0% | 5% | 10% | 14% | 15% |
| Seguros (parceria) | 0% | 1% | 2% | 3% | 4% |
| Serviços Financeiros | 0% | 0% | 2% | 5% | 12% |
| **Total** | **R$ 1M** | **R$ 27M** | **R$ 100M** | **R$ 280M** | **R$ 650M** |

*Nota: Revenue em reais. Conversão USD usada apenas para valuation benchmarks.*

---

## 5. MILESTONES POR ESTÁGIO DE VALUATION

### Pre-Seed → Seed (R$ 5–25M valuation)

**O que precisa existir:**

```
Produto:
  ✓ MVP funcionando (busca, booking, pagamento, review)
  ✓ 50+ prestadores verificados e ativos
  ✓ Primeiros 200 clientes com ao menos 1 booking cada

Métricas (mês 3):
  ✓ GMV/mês: R$ 200k+
  ✓ Fill rate: >20%
  ✓ Completion rate: >80%
  ✓ NPS: >30
  ✓ D30 Retention: >25%

Time:
  ✓ 2 co-fundadores com complementaridade (tech + negócios)
  ✓ 1 senior engineer full-stack
  ✓ 1 ops manager de verificação

Narrativa para o investidor:
  "Provamos que o problema existe, que as pessoas pagam para resolver,
   e que nossa abordagem de trust-first cria retenção superior."
```

**Quanto levantar**: R$ 1–3M (Seed BR). Suficiente para 18 meses de runway.

**Uso dos recursos**:
```
45% → Salários (time de produto e tech)
25% → Marketing de aquisição (testar canais)
15% → Ops (verificação, suporte)
10% → Infraestrutura e ferramentas
 5% → Legal, contabilidade, registro
```

---

### Seed → Série A (R$ 60–100M valuation)

**O que precisa existir:**

```
Tração comprovada:
  ✓ GMV/mês: R$ 2M+ (crescimento >15%/mês nos últimos 3 meses)
  ✓ Fill rate: >35%
  ✓ LTV/CAC: >3x (medido em cohorts reais)
  ✓ D90 Retention: >28%
  ✓ Repeat rate (60d): >30%
  ✓ NPS: >45
  ✓ CAC payback: <12 meses

Escala de supply:
  ✓ 2.000+ prestadores verificados e ativos
  ✓ Supply retention 12m: >55%
  ✓ 6+ categorias em operação

Produto:
  ✓ Recorrência nativa (clientes com planos semanais/quinzenais)
  ✓ App mobile iOS + Android
  ✓ Matching heurístico funcionando
  ✓ Dashboard de analytics operacional

Time:
  ✓ 15+ pessoas (produto, engenharia, ops, growth)
  ✓ VP Engineering ou CTO
  ✓ Head of Growth
  ✓ Head of Operations

Financeiro:
  ✓ Contabilidade auditada
  ✓ Unit economics documentados por cohort
  ✓ Projeção 3 anos bottom-up
```

**Quanto levantar**: R$ 15–25M (Série A).

**Uso dos recursos**:
```
40% → Marketing e aquisição de clientes (escalar canais validados)
30% → Time (dobrar headcount de engenharia e produto)
15% → Expansão geográfica (2ª cidade)
10% → Infraestrutura ML e dados
 5% → Legal, compliance, governança
```

**O que investidores de Série A perguntarão:**
1. "Qual é o seu fill rate por zona e como ele evolui com o tempo?"
2. "Mostre-me a curva de retenção por cohort dos últimos 12 meses."
3. "Qual é o seu CAC por canal e qual canal você vai escalar com o capital?"
4. "O que impede o GetNinjas de copiar o que você fez?"
5. "Mostre-me o P&L de uma zona madura vs. uma zona nova."

---

### Série A → Série B (R$ 300–500M valuation)

**O que precisa existir:**

```
Escala multi-cidade:
  ✓ 4–6 cidades em operação
  ✓ Pelo menos 2 cidades com contribution margin positivo
  ✓ GMV/mês: R$ 10M+
  ✓ Net Revenue/mês: R$ 2M+

Prova de playbook:
  ✓ Tempo de breakeven por nova cidade: <12 meses
  ✓ Custo de lançamento de nova cidade: <R$ 500k
  ✓ Fill rate na 3ª cidade >= 80% da fill rate na cidade âncora

Métricas de qualidade:
  ✓ NPS: >55
  ✓ Completion rate: >90%
  ✓ LTV/CAC: >8x (blended)
  ✓ Contribution margin: >45%

Produto diferenciado:
  ✓ ML de matching em produção (NDCG@5 > 0.78)
  ✓ B2B pipeline (10+ condomínios/empresas)
  ✓ Assinaturas de prestadores gerando receita recorrente
  ✓ Sponsored listings operacional

Governança:
  ✓ Board formado (2 fundadores + 2 investidores + 1 independente)
  ✓ CFO ou strong Finance Director
  ✓ Auditoria externa Big4 ou equivalente
```

**Quanto levantar**: R$ 80–150M (Série B).

**Uso dos recursos**:
```
50% → Expansão (8 cidades brasileiras + piloto LatAm)
25% → Produto e tecnologia (ML avançado, FinServ, B2B)
15% → Time sênior (C-suite, Engineering leads, City GMs)
 5% → Brand e marketing institucional
 5% → Reserva estratégica (M&A opportunístico)
```

---

### Série B → US$1B+ (IPO / Strategic M&A)

**Milestones que elevam o múltiplo:**

```
Receita recorrente:
  ✓ >40% do GMV vem de bookings recorrentes automáticos
  ✓ >20% do revenue de assinaturas/B2B (não-transacional)
  → Eleva múltiplo de 8x para 15–20x ARR

Serviços financeiros:
  ✓ Adiantamento de recebíveis operacional (R$ 10M/mês em volume)
  ✓ Conta digital para prestadores com >50% de penetração no supply
  → Adiciona R$ 20–30M de revenue com margins 3x maiores que comissão

Dados proprietários:
  ✓ Feature store com 100M+ eventos de matching
  ✓ Modelo de ML com NDCG@5 > 0.85 (class-leading)
  → Ativo estratégico para Rappi, Uber, Amazon: vale prêmio de aquisição

Escala internacional:
  ✓ Operação em 2+ países com unit economics validados
  → Dobra o TAM endereçável e justifica múltiplos de company global
```

---

## 6. CAP TABLE E ESTRATÉGIA DE CAPTAÇÃO

### Evolução do Cap Table

| Estágio | Rodada | Captação | Pre-Money | Dilution | Post-Money |
|---|---|---|---|---|---|
| Fundação | — | — | — | — | — |
| Bootstrapping | Próprio | R$ 100k | — | 0% | R$ 100k |
| Pre-Seed | Anjos | R$ 500k | R$ 2.5M | 17% | R$ 3M |
| Seed | Acelerador/VC | R$ 3M | R$ 12M | 20% | R$ 15M |
| Série A | VC BR/LatAm | R$ 20M | R$ 60M | 25% | R$ 80M |
| Série B | VC Internacional | R$ 100M | R$ 300M | 25% | R$ 400M |
| Série C / IPO | Público/PE | R$ 300M | R$ 900M | 25% | R$ 1.2B |

### Participação dos Fundadores por Estágio

```
Início: 100% (2 co-fundadores: 60%/40%)

Após Pre-Seed:  83% total (Co-f1: 49.8%, Co-f2: 33.2%)
Após Seed:      66% total (Co-f1: 39.8%, Co-f2: 26.5%)
Após Série A:   50% total (Co-f1: 29.8%, Co-f2: 19.9%) → ainda majoritários
Após Série B:   37% total (Co-f1: 22.4%, Co-f2: 14.9%)
Após Série C:   28% total (Co-f1: 16.8%, Co-f2: 11.2%)

Valor da participação do Co-f1 (Série C @ R$ 1.2B):
  16.8% × R$ 1.2B = R$ 201M = ~US$ 40M
```

### Employee Stock Option Pool (ESOP)

```
Reserva recomendada por estágio:

Seed:    10% do cap table (para primeiros 10-15 funcionários)
Série A: +5% adicional (expansão do pool antes do round)
Série B: +5% adicional (para C-suite e líderes de engenharia)

Vesting padrão: 4 anos com cliff de 12 meses (1/4 no cliff, 1/48 por mês)
Aceleração: duplo gatilho em caso de M&A (proteção para o time)

Benchmark de equity por função (Série A):
  CTO:          1.5–2.5%
  VP Eng.:      0.8–1.5%
  Senior Eng.:  0.2–0.5%
  Head of Growth: 0.5–1.0%
  Head of Ops:  0.3–0.6%
```

---

## 7. ESTRATÉGIA DE CRESCIMENTO EM 5 FASES

### Fase 0 — Fundação: 1 Cidade, 1 Categoria (Meses 0–6)

**Cidade-âncora**: São Paulo — Limpeza Residencial

**Por que SP + Limpeza antes de tudo?**
- Limpeza: maior frequência (1–4x/mês), menor complexidade de verificação, dados rápidos
- SP: 12M+ habitantes, maior concentração de prestadores qualificados, mercado test-bed

**Critérios de saída desta fase** (go/no-go para expansão):
```
✓ 500 prestadores verificados e ativos
✓ 2.000 clientes com ao menos 1 booking
✓ Fill rate > 25%
✓ Completion rate > 82%
✓ NPS > 35
✓ 15%+ dos clientes com recorrência ativa
```

---

### Fase 1 — Growth na Cidade Âncora (Meses 6–18)

**Expansão de categorias em SP** (sequência baseada em ticket + volume):

| Ordem | Categoria | Ticket Médio | Frequência | Por que agora |
|---|---|---|---|---|
| 1 | Limpeza (já ativa) | R$ 150 | Semanal | Âncora |
| 2 | Encanamento | R$ 250 | Eventual | Alto ticket, urgência |
| 3 | Elétrica | R$ 300 | Eventual | Alto ticket, urgência |
| 4 | Pintura | R$ 800 | Anual | Alto ticket, projeto |
| 5 | Jardinagem | R$ 200 | Quinzenal | Recorrência |
| 6 | Babá/Cuidador | R$ 180 | Frequente | Recorrência alta |
| 7 | Personal Trainer | R$ 120 | 2–3x/semana | Máxima recorrência |
| 8 | Pet Care | R$ 90 | Semanal | Recorrência |

**Key milestone desta fase**: primeiro modelo ML de matching em A/B test (mês 14).

---

### Fase 2 — Expansão Geográfica (Meses 18–36)

**Sequência de cidades** (por atratividade de mercado e facilidade de execução):

```
1. Campinas/ABC Paulista  ← extensão natural de SP, sem airfare para ops
2. Rio de Janeiro          ← 2º maior mercado, prestadores já conhecem a marca
3. Belo Horizonte          ← 3ª maior cidade, menor concorrência formal
4. Porto Alegre            ← mercado maduro, alto ticket médio
5. Curitiba                ← alta renda per capita, tech-friendly
6. Recife/Fortaleza        ← testar Nordeste (diferente sazonalidade)

Custo por cidade:
  Cidade 1 (SP): R$ 2M de investimento, 18 meses para breakeven
  Cidades 2–5:   R$ 500k cada, 8 meses para breakeven (playbook replicado)
  Cidades 6–20:  R$ 200k cada, 4 meses para breakeven (sistema maduro)
```

**City Playbook** (o ativo operacional mais valioso):
```
Semana 1–2: Parceria com grupos de WhatsApp de prestadores locais
Semana 3–4: Verificação em massa (50 prestadores/semana)
Mês 2:      Soft launch com 150 prestadores para lista de espera de clientes
Mês 3:      Lançamento público com PR local + Google Ads Search
Mês 4–6:    Otimizar fill rate, corrigir gaps de supply por zona
Mês 7–8:    Contribution margin positivo
```

---

### Fase 3 — B2B + Enterprise (Meses 24–42)

**Oportunidade**: Condomínios, hotéis, clínicas e escritórios precisam dos mesmos serviços
com maior previsibilidade e volume.

```
Produto B2B Mínimo Viável:
  ✓ Dashboard de gestão para síndicos/facilities managers
  ✓ Billing centralizado (NF-e mensal)
  ✓ SLA garantido (provider substituição em < 2h se não-show)
  ✓ Relatório de serviços executados

Pricing B2B:
  Take rate: 12–15% (menor que B2C)
  Taxa de gestão mensal: R$ 500–5.000/mês (por volume)
  Mas: 1 condomínio com 80 unidades = 80 limpezas/mês = R$ 12k GMV/mês
  → 1 venda B2B = 80 clientes B2C equivalentes

CAC B2B: R$ 200–800 (vs. R$ 100/cliente B2C)
  → mas 80x o GMV por "cliente" → LTV/CAC = 25–50x
```

---

### Fase 4 — Expansão Internacional (Meses 36–60)

**Critérios para internacionalizar** (não entrar antes):
```
✓ Playbook provado em 5+ cidades BR com breakeven < 6 meses
✓ Série B levantada (capital para expansão sem comprometer BR)
✓ CTO e produto maduros para multi-tenant e multi-moeda
```

**Países-alvo:**

| País | PIB | Smartphone | Informalidade | Concorrência | Score |
|---|---|---|---|---|---|
| México | US$ 1.3T | 82% | 56% | Baixa | 9/10 |
| Colômbia | US$ 340B | 78% | 61% | Muito baixa | 8/10 |
| Chile | US$ 300B | 92% | 28% | Média | 7/10 |
| Peru | US$ 240B | 70% | 73% | Muito baixa | 7/10 |
| Argentina | US$ 640B | 85% | 44% | Média | 6/10 |

**Estratégia de entrada**: México primeiro, estrutura de holding BVI + subsidiária local.

---

## 8. COMO CRIAR MOAT (5 CAMADAS)

### Camada 1 — Data Moat

```
O que é:
  Dados de comportamento, qualidade de serviço e matching
  que acumulamos a cada transação — impossíveis de comprar.

Como construir (desde o Dia 1):
  ✓ Instrumentar TODOS os eventos (não só transações)
  ✓ Capturar posição de cada prestador em cada resultado
  ✓ Capturar tempo de visualização por prestador
  ✓ Capturar sinais implícitos: scroll depth, foto visitada, sessão abandonada

Volume para ML competitivo:
  10k bookings   → modelo básico (meses 6-9)
  100k bookings  → modelo robusto (mês 18)
  1M bookings    → modelo class-leading (mês 36)

Por que é moat:
  Um novo entrante com R$ 50M de capital não pode comprar esse histórico.
  Leva operação real para acumular. Nosso modelo melhora todo dia.
```

### Camada 2 — Supply Moat

```
O que é: Os melhores prestadores fidelizados e impossibilitados de sair.

Como construir:
  ✓ Top 50 prestadores por categoria/cidade: programa de exclusividade
    (leads garantidos em troca de exclusividade por 6-12 meses)
  ✓ Score de reputação com 500+ reviews: não portável para concorrentes
  ✓ Ferramentas de gestão: agenda, financeiro, analytics — criam dependência
  ✓ Produtos financeiros: conta digital + crédito = nosso banco = nunca sai

Custo para um concorrente contratar nossa supply:
  Subir salário de R$ 4.000 para R$ 5.500 nos top 100 prestadores de SP
  = R$ 150k/mês de custo incremental
  Mesmo assim: não copia o histórico de reviews, não copia o relacionamento
```

### Camada 3 — Trust Moat

```
Trust se constrói em anos. Se destrói em dias.

Construir:
  ✓ 3 anos de reviews verificadas = ativo impossível de fabricar
  ✓ Histórico de incidentes gerenciados bem = credibilidade pública
  ✓ Parceria com seguradoras = produto tangível de confiança
  ✓ NPS > 60 = referência no mercado

Defender:
  ✓ Zero tolerância para incidentes graves (protocolo < 1h de ativação)
  ✓ Política de garantia de satisfação clara e cumprida
  ✓ Comunicação transparente — nunca esconder problemas

Valor para valuation:
  Um marketplace com NPS > 60 tem churn ~3x menor que NPS < 40.
  Com churn menor, LTV é 2.5x maior, múltiplo de revenue é 2x maior.
```

### Camada 4 — Operational Moat

```
City Playbook: 200 páginas de como lançar e operar uma cidade.

Contém:
  ✓ Quais grupos de WhatsApp recrutar prestadores em cada cidade
  ✓ Preços de referência por categoria por zona
  ✓ Parceiros de verificação (bureaus locais, escolas técnicas)
  ✓ Scripts de vendas para B2B por segmento
  ✓ SOP de incident response localizado
  ✓ KPIs de saúde de zona com thresholds de alerta

O que o concorrente leva para copiar:
  Copiar os documentos: 1 semana
  Ter o conhecimento implícito por trás: 3 anos de operação
```

### Camada 5 — Technology Moat

```
Algoritmos proprietários que não existem fora da plataforma:

1. Matching ML (BLOCO D): treinado em dados exclusivos do marketplace BR
2. Dynamic pricing: precificação por zona/hora/demanda específica para serviços no Brasil
3. Fraud detection: treinado no comportamento de fraude específico do nosso mercado
4. Churn prediction: identifica cliente prestes a sair antes que ele saiba
5. Supply quality score: prevê qualidade de serviço antes do cliente receber

Nenhum desses modelos pode ser copiado sem os dados.
Os dados só existem com operação real.
```

---

## 9. ACQUISITION READINESS

### Compradores Estratégicos e seu Thesis

| Comprador | Razão de Compra | Múltiplo Esperado | Trigger |
|---|---|---|---|
| **Rappi** | Supply de prestadores para "Rappi Servicios"; dados de demanda | 12–18x ARR | Depois da Série A |
| **iFood** | Extensão para home services; reutilização do supply de entregadores | 10–15x ARR | Depois da Série A |
| **Uber** | "Uber Home Services" no Brasil; matching engine para serviços | 15–20x ARR | Depois da Série B |
| **TaskRabbit/Angi** | Acesso ao mercado BR sem construir do zero | 8–12x ARR | Depois da Série A |
| **Nubank/Mercado Livre** | Expansão para serviços; dados de prestadores para crédito | 12–18x ARR | Depois que FinServ lançar |
| **Private Equity** | LBO com operational leverage; múltiplo de saída em IPO | 6–10x EBITDA | Depois de EBITDA positivo |

### Como Se Preparar para Due Diligence

**Dados Financeiros (sempre prontos):**
```
✓ P&L auditado (últimos 12 meses)
✓ Cohort analysis de retenção (por mês de aquisição)
✓ Unit economics por canal de aquisição
✓ Breakdown de GMV por categoria/cidade/canal
✓ Working capital e cash flow mensal
✓ Cap table atualizado com todas as opções e warrants
✓ Data room organizado (Notion + secure folder com acesso controlado)
```

**Tecnologia (preparar com 6 meses de antecedência):**
```
✓ Repositório de código documentado (não um graveyard)
✓ Arquitetura documentada (BLOCO A, B, C, D atualizados)
✓ Cobertura de testes > 70%
✓ Zero vulnerabilidades críticas (pentest anual)
✓ IP registrado (código + marca + domínios)
✓ APIs documentadas com OpenAPI spec
```

**Legal e Compliance:**
```
✓ LGPD compliance documentado
✓ Contratos de prestadores revisados por advogado trabalhista
✓ Termos de uso e política de privacidade atualizados
✓ Registro de marca INPI nas classes corretas
✓ Sem litígios trabalhistas ativos
✓ Certificado de regularidade fiscal (CND)
```

---

## 10. MÉTRICAS QUE IMPORTAM — ALVOS POR FASE

### Dashboard de Valuation Health

| Métrica | MVP (0–12m) | Série A (12–24m) | Série B (24–36m) | Série C (36–60m) |
|---|---|---|---|---|
| **GMV/mês** | R$ 800k | R$ 3M | R$ 12M | R$ 50M |
| **Net Revenue/mês** | R$ 120k | R$ 540k | R$ 2.4M | R$ 10M |
| **Take Rate (efetivo)** | 15% | 18% | 20% | 20% |
| **Contribution Margin** | -20% | 25% | 45% | 58% |
| **EBITDA Margin** | -250% | -35% | 5% | 30% |
| **CAC (blended)** | R$ 120 | R$ 80 | R$ 55 | R$ 40 |
| **LTV (36 meses)** | R$ 400 | R$ 900 | R$ 1.500 | R$ 2.000 |
| **LTV/CAC** | 3.3x | 11x | 27x | 50x |
| **CAC Payback** | 18m | 9m | 4m | 3m |
| **D30 Retention** | 35% | 45% | 55% | 63% |
| **D90 Retention** | 20% | 30% | 42% | 52% |
| **D360 Retention** | 12% | 18% | 30% | 42% |
| **Repeat Rate (60d)** | 22% | 38% | 55% | 65% |
| **Recurrence %** | 10% | 28% | 45% | 58% |
| **Fill Rate** | 25% | 40% | 57% | 65% |
| **Completion Rate** | 82% | 90% | 94% | 96% |
| **NPS** | 35 | 52 | 65 | 72 |
| **Active Providers** | 800 | 4.000 | 18.000 | 70.000 |
| **Active Clients/mês** | 3.000 | 15.000 | 65.000 | 250.000 |
| **Supply Retention 12m** | 50% | 65% | 77% | 83% |
| **Revenue/Headcount** | R$ 7k/hc | R$ 17k/hc | R$ 30k/hc | R$ 33k/hc |
| **Cidades** | 1 | 2–3 | 6–8 | 18–22 |

### Alertas de Valuation Destroyer

Os seguintes números devem acionar revisão imediata de estratégia:

```
🔴 CRÍTICO (stop o que está fazendo):
   Fill rate < 20% por 3 semanas consecutivas
   Completion rate < 78%
   D30 retention < 20%
   NPS < 20 ou em queda > 10pts em 60 dias
   Incidente grave de segurança

🟡 ATENÇÃO (revisão em 2 semanas):
   CAC payback > 24 meses
   LTV/CAC < 2x
   Repeat rate < 15% em 60d
   Supply retention < 40% em 6 meses
   Contribution margin negativo por > 3 meses seguidos em zona madura
```

---

## 11. ROADMAP DE VALOR — DO DIA 1 AO US$1B

### Ano 1 — Construir a Fundação de Valor

```
Q1: O Alicerce
  → Semana 1: Constituição jurídica, conta PJ, contratos de founders
  → Semana 2: Repositório, CI/CD, schema de banco (BLOCO B)
  → Semana 3: Pré-recrutamento de prestadores (WhatsApp groups SP)
  → Semana 4: MVP básico funcionando internamente

  VALOR CRIADO: A empresa existe. O problema está validado em código.

Q2: A Prova de Conceito
  → Mês 4: Pagamento em produção (Pix + cartão), primeiros 200 clientes pagantes
  → Mês 5: Primeiros 500 prestadores verificados
  → Mês 6: Fill rate > 25%, NPS > 35 — SEED ROUND

  VALOR CRIADO: "Funciona. Pessoas pagam. Prestadores recebem."

Q3: O Produto Completo
  → Mês 7: Recorrência nativa (25% dos clientes com plano recorrente)
  → Mês 8: App mobile iOS + Android
  → Mês 9: 3 categorias (Limpeza + Encanamento + Elétrica)

  VALOR CRIADO: "Não é one-hit wonder. Tem recorrência. Tem categorias."

Q4: O Momentum
  → Mês 10: Primeiro mês com EBITDA positivo em SP
  → Mês 11: Deck de Série A pronto
  → Mês 12: R$ 1M GMV/mês, NPS > 45

  VALOR CRIADO: "Pronto para escalar. Tem números. Tem história."
  VALUATION: R$ 25–40M (Série A)
```

### Ano 2 — Provar que Escala

```
Q5–Q6: Full SP + ML
  → 8 categorias em SP
  → Primeiro modelo de ML em A/B test
  → Série A fechada (R$ 20M)
  → Hiring: VP Eng, Head Growth, Head Ops
  VALUATION: R$ 40–60M

Q7–Q8: Multi-Cidade
  → Rio de Janeiro lançado com playbook
  → 3 cidades no total
  → B2B pilot (3 condomínios em SP)
  → R$ 6M GMV/mês, contribution positivo
  VALUATION: R$ 80–120M → US$20–25M (objetivo intermediário!)
```

### Ano 3 — US$100M+ de Valuation

```
Milestone de US$100M (meses 28-32):
  ✓ R$ 10M+ GMV/mês
  ✓ R$ 40M+ Net Revenue ARR
  ✓ 5+ cidades, contribution margin > 40%
  ✓ ML de matching em 100% do tráfego
  ✓ B2B representa 15% do GMV
  ✓ LTV/CAC > 12x (blended)
  ✓ NPS > 60

  VALUATION = R$ 40M ARR × 12x múltiplo = R$ 480M = US$100M ✓

  Múltiplo justificado por:
    - Recorrência (>35% dos bookings automáticos)
    - Data moat (18M+ eventos de matching coletados)
    - Operational leverage (nova cidade em 4 meses)
    - Crescimento (>80% YoY revenue)
    - Competitive position (fill rate 2x do GetNinjas)
```

### Anos 4–5 — Trajetória para US$1B

```
Ano 4: R$ 280M ARR → US$500M–700M valuation
  → 14 cidades brasileiras
  → Serviços financeiros lançados (adiantamento, conta digital)
  → México piloto com 1.000 prestadores
  → IPO em janela ou M&A estratégico com Rappi/iFood/Uber

Ano 5: R$ 650M ARR → US$1B+ valuation
  → 22+ cidades brasileiras
  → 3 países internacionais
  → Revenue de FinServ > 10% do total
  → EBITDA > 35%
  → "Unicorn" status consolidado
```

---

## 12. SENSITIVITY ANALYSIS — CENÁRIOS DE VALUATION

### Cenário Base × Bull × Bear (em US$M, mês 36)

| Variável | Bear | Base | Bull |
|---|---|---|---|
| GMV/mês | R$ 6M | R$ 12M | R$ 20M |
| Net Revenue ARR | R$ 13M | R$ 26M | R$ 44M |
| Contribution Margin | 30% | 45% | 58% |
| LTV/CAC | 5x | 12x | 22x |
| Fill Rate | 32% | 55% | 68% |
| NPS | 42 | 65 | 75 |
| Cidades | 3 | 6 | 9 |
| Revenue múltiplo | 6x | 12x | 18x |
| **Valuation (US$)** | **~US$17M** | **~US$65M** | **~US$160M** |

### O que Move o Múltiplo?

```
Múltiplo Base: 12x ARR

+4x se: Recorrência > 40% dos bookings (SaaS-like revenue)
+3x se: LTV/CAC > 15x (unit economics classe mundial)
+2x se: EBITDA positivo por 2+ trimestres (sustentabilidade provada)
+2x se: Crescimento YoY > 100% (hypergrowth premium)
+2x se: International traction (mexeu com maior endereçável)
-3x se: NPS < 40 (qualidade questionável)
-4x se: Unit economics ruins (CAC payback > 18m)
-5x se: Incidente de segurança grave público

Melhor cenário realista: 12 + 4 + 3 + 2 + 2 = 23x ARR
Com R$ 26M ARR = R$ 598M = US$125M ← base para Série B
```

### Cenário de Saída por Tipo de Acquirer

| Acquirer | Múltiplo | Premissa | Valuation Esperado (mês 36) |
|---|---|---|---|
| Strategic (Rappi/Uber) | 15–20x ARR | Synergy premium: dobra TAM addressable | US$80–130M |
| PE (Advent, Warburg) | 8–10x EBITDA | EBITDA = R$ 8M/ano (mês 36) | US$13–17M (cedo demais) |
| IPO (B3/NYSE) | 12–16x ARR | Comparável a marketplaces BR | US$65–105M |
| Trade sale (GetNinjas) | 5–8x ARR | Consolidação de mercado | US$26–42M |

**Conclusão**: Venda estratégica (Rappi/Uber/iFood) ou IPO são os caminhos com maior retorno.
PE é fallback e trade sale é indesejável (subpreço).

---

## 13. RISCOS QUE DESTROEM VALUATION

| # | Risco | Prob. | Impacto | Mitigação Específica |
|---|---|---|---|---|
| 1 | Incidente grave de segurança | Média | **-80% valuation** | Verificação biométrica, fundo R$50k de reserva, protocolo < 1h |
| 2 | Unit economics ruins (LTV/CAC < 2x) | Média | **-60% valuation** | Dashboard de cohort semanal, stop automático em canais ruins |
| 3 | Disintermediação em escala | Alta | **-40% valuation** | Valor add impossível offline: seguro, parcelamento, histórico |
| 4 | Regulamentação adversa (CLT/MEI) | Baixa | **-30% valuation** | Estrutura jurídica PJ, lobby via associações de marketplace |
| 5 | Concorrente capitalizando (Uber Services) | Média | **-25% valuation** | Velocidade de execução: moat de dados leva 2 anos para replicar |
| 6 | Key supply saindo (top 50 prestadores) | Média | **-20% valuation** | Contratos de exclusividade, programa de fidelidade top tier |
| 7 | Fraude em escala | Média | **-15% valuation** | ML de fraude, KYC rigoroso, limites de saque progressivos |
| 8 | Burn acelerado (>24 meses para próxima rodada) | Média | **Existencial** | 18 meses de runway mínimo em caixa sempre |
| 9 | Perda de co-fundador | Baixa | **-30% valuation** | Vesting bilateral, buy-sell agreement, key-man insurance |
| 10 | Dependência excessiva de 1 canal de aquisição | Alta | **-10% valuation** | Diversificar: referral > 25%, B2B > 15%, organic > 10% |

---

## 14. O QUE CONSTRUIR PRIMEIRO PARA MAXIMIZAR VALUATION

### Regra dos 20%

**80% do valuation vem de 20% das decisões.** Essas são as 20%:

#### Decisão #1 — Trust antes de tudo (40% do valor)

```
Mínimo viável de trust para Série A:
  ✓ Verificação CPF + selfie + antecedentes (Unico.io ou Serasa)
  ✓ Política de garantia de satisfação escrita e publicada
  ✓ Suporte humano em < 4h (não chatbot)
  ✓ Zero incidentes graves nos primeiros 12 meses

Por que isso vale 40% do valuation:
  Com trust → NPS 55+ → churn 12% → LTV 3x maior → múltiplo 2x maior
  Sem trust → NPS 30 → churn 40% → não tem Série A
```

#### Decisão #2 — Recorrência desde o MVP (25% do valor)

```
Mínimo viável de recorrência:
  ✓ Pergunta pós-booking: "Agendar de novo com o mesmo prestador?"
  ✓ Frequência configurável: semanal, quinzenal, mensal
  ✓ Notificação automática 48h antes

Por que isso vale 25% do valuation:
  30% dos clientes em recorrência → LTV médio sobe de R$400 para R$900
  De 2x ARR múltiplo para 8x ARR múltiplo
  Diferença de R$15M de valuation para R$60M de valuation na Série A
```

#### Decisão #3 — Dados desde o Dia 1 (20% do valor longo prazo)

```
Mínimo viável de instrumentação:
  ✓ Posição de cada prestador em cada resultado de busca
  ✓ Clique × não-clique para cada posição
  ✓ Booking feito × não feito após visualização de prestador
  ✓ Todos os campos de `search_impressions` (BLOCO D, seção 5)

Por que isso vale 20% do valuation:
  Com dados desde o dia 1 → modelo ML treinável em 6 meses
  Sem dados → precisa de 2 anos extras para ter volume suficiente
  NDCG@5 de 0.72 (heurístico) para 0.85 (ML) = +15% fill rate = +15% GMV
```

#### Decisão #4 — Payments sem atrito (15% do valor)

```
Mínimo viável de payments:
  ✓ Pix (obrigatório — 70%+ dos pagamentos BR)
  ✓ Cartão de crédito
  ✓ Confirmação imediata (< 2 segundos)
  ✓ Reembolso claro e rápido (< 24h automático)

Por que isso vale 15% do valuation:
  Checkout com atrito → abandono 35%+ → GMV perdido → menor múltiplo
  Checkout perfeito → conversão > 85% → GMV mais alto com mesmo CAC
```

---

## 15. INVESTOR COMMUNICATION

### One-Pager para Seed Round

```
EMPRESA: [Nome] — Marketplace de Serviços com Trust-First + Recorrência

PROBLEMA:
  → 4M+ prestadores informais sem acesso estruturado a clientes no Brasil
  → Famílias perdem 40h/ano buscando prestadores confiáveis
  → Alternativas: GetNinjas (lead gen sem garantia), WhatsApp (sem pagamento/trust)

SOLUÇÃO:
  → Plataforma que vai da busca ao pagamento em < 3 minutos
  → Verificação biométrica + antecedentes em todos os prestadores
  → Recorrência nativa: cliente agenda 1x, nunca mais reagenda
  → Matching por IA: sempre o prestador certo para o cliente certo

TRAÇÃO (Mês 6):
  → R$ 500k GMV/mês (+25% MoM últimos 3 meses)
  → 500 prestadores verificados, 2.000 clientes ativos
  → Fill rate: 28% | NPS: 38 | Completion rate: 84%

UNIT ECONOMICS:
  → CAC: R$ 100 | LTV (36m): R$ 400+ | LTV/CAC: 4x
  → Com recorrência (15% já): LTV/CAC = 9x

TIME:
  → [Co-f1]: Ex-[empresa], [X] anos em produto
  → [Co-f2]: Ex-[empresa], [X] anos em engenharia/operações

CAPTAÇÃO: R$ 3M Seed (18 meses runway) para:
  → Dobrar equipe (8 → 18 pessoas)
  → Escalar para 3 categorias
  → Lançar recorrência premium
  → Meta Mês 12: R$ 1M GMV/mês, LTV/CAC > 5x
```

### Narrativa para Série A — O Script de 5 Minutos

```
"Resolvemos o problema de trust que destruiu todos os marketplaces de
 serviços antes de nós. Não é diferencial — é a fundação.

 Com trust resolvido, capturamos algo que ninguém capturou antes no Brasil:
 recorrência. 28% dos nossos clientes têm bookings automáticos mensais ou
 semanais. Esses clientes têm LTV 8x maior que os transacionais.

 O flywheel funciona assim: mais clientes → mais dados de matching →
 modelo de IA melhor → fill rate maior → mais clientes.
 Após 100k bookings, nosso modelo de matching é fundamentalmente superior
 a qualquer entrante — e melhora todo dia.

 Chegamos à Série A com R$ 3M GMV/mês, fill rate de 40%, NPS de 52 e
 LTV/CAC de 11x. Estamos pedindo R$ 20M para ir de 1 para 4 cidades e
 de 500k para 3M de ARR em 18 meses.

 O mercado é de R$ 80B. Nós somos os únicos com trust + recorrência + IA.
 Este é o momento."
```

---

## 16. ROADMAP ESTRATÉGICO — LINHA DO TEMPO COMPLETA

```
ANO 0 (Pré-lançamento)
  Mês -3: Constituição, stack definido, contratações fundadoras
  Mês -2: MVP interno funcionando, primeiros 50 prestadores cadastrados
  Mês -1: Alpha fechado com 100 beta users (amigos/família)
  Mês  0: Lançamento público em SP — Limpeza Residencial

ANO 1 — Prova de Modelo
  Mês 3:  R$ 200k GMV, fill rate >20%, NPS >30
  Mês 6:  R$ 500k GMV, recorrência lançada → SEED ROUND (R$ 3M)
  Mês 9:  3 categorias, R$ 750k GMV, matching heurístico
  Mês 12: R$ 1M GMV, NPS >45, LTV/CAC >4x → SÉRIE A DECK PRONTO

ANO 2 — Crescimento
  Mês 15: 8 categorias SP, R$ 2M GMV, primeiro ML A/B test
  Mês 18: Fill rate >40%, contribution positivo → SÉRIE A (R$ 20M)
  Mês 21: Rio de Janeiro lançado, R$ 4M GMV
  Mês 24: 3 cidades, R$ 6M GMV, B2B pilot

ANO 3 — US$100M Valuation
  Mês 27: 5 cidades, R$ 9M GMV, ML em 100% do tráfego
  Mês 30: R$ 12M GMV, LTV/CAC >12x → VALUATION US$100M ✓
  Mês 33: B2B = 15% GMV, R$ 36M ARR
  Mês 36: SÉRIE B (R$ 100M) ou M&A strategic

ANO 4 — Escala Nacional
  Mês 42: 12 cidades, FinServ lançado, R$ 150M ARR
  Mês 48: México piloto, R$ 250M ARR → VALUATION US$500M+

ANO 5 — Unicorn
  Mês 54: 3 países, R$ 450M ARR
  Mês 60: 22+ cidades BR, R$ 650M ARR → IPO ou Série C → US$1B+
```

---

## 17. RESUMO EXECUTIVO DE VALUATION

### A Equação Simples

```
Valuation = Revenue × Múltiplo

Revenue (ARR mês 30): R$ 36M = ~US$ 7.5M
Múltiplo justo para nosso perfil:
  Base marketplace BR:              6x
  + Recorrência (>35% automático): +4x
  + Data moat (ML rodando):        +2x
  + Unit economics top quartile:   +2x
  + Crescimento >80% YoY:         +2x
  ─────────────────────────────────────
  Múltiplo total:                  16x
  Valuation:        US$7.5M × 16x = US$120M ✓

Valuation de US$100M é o PISO, não o teto.
O teto é o que um comprador estratégico paga por synergy:
  Rappi paga até 20x ARR = US$150M
  Uber paga até 25x ARR = US$187M
```

### Os 3 Números que Mais Importam

| # | Métrica | Por que é a mais importante |
|---|---|---|
| **1** | LTV/CAC | Define se o negócio tem direito de existir e crescer |
| **2** | Fill Rate | Define se o marketplace tem liquidez real |
| **3** | D360 Retention | Define se o produto entrega valor suficiente para reter |

Se esses 3 números estiverem no quartil superior do benchmark,
**o valuation de US$100M é quase inevitável** com o tempo e capital certos.

---

*Próximos documentos: BLOCO F (Estratégia Jurídica e Estrutura Societária),
BLOCO G (Plano de Contratação e Cultura), BLOCO H (Infraestrutura Cloud e DevOps).*
